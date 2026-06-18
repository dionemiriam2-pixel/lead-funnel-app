import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/* Muster die auf Kontaktanfragen hindeuten */
function isLikelyLead(subject = "", snippet = "") {
  const text = (subject + " " + snippet).toLowerCase();
  return /anfrage|kontakt|formular|contact\s?form|neue nachricht|neue anfrage|webseite|website|bewerbung|interessent|lead|angebot|beratung|rückruf|callback|name:|telefon:|nachricht:/.test(text);
}

async function getValidToken(conn) {
  let { access_token, refresh_token, expires_at } = conn;
  if (expires_at && new Date(expires_at) < new Date(Date.now() + 60000)) {
    if (!refresh_token) return null;
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "refresh_token",
        refresh_token,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    });
    if (!r.ok) return null;
    const refreshed = await r.json();
    const newExpiry = new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString();
    await supabaseAdmin().from("social_connections")
      .update({ access_token: refreshed.access_token, expires_at: newExpiry })
      .eq("id", conn.id);
    access_token = refreshed.access_token;
  }
  return access_token;
}

export async function GET(req) {
  /* Cron-Sicherheit: nur Vercel darf diesen Endpoint aufrufen */
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();

  /* Alle Kunden mit verbundenem Gmail laden */
  const { data: connections, error: connErr } = await sb
    .from("social_connections")
    .select("id, client_id, access_token, refresh_token, expires_at")
    .eq("platform", "gmail");

  if (connErr || !connections?.length) {
    return NextResponse.json({ ok: true, processed: 0, message: "Keine Gmail-Verbindungen gefunden" });
  }

  const results = [];

  for (const conn of connections) {
    const token = await getValidToken(conn);
    if (!token) { results.push({ client_id: conn.client_id, error: "Token ungültig" }); continue; }

    /* Posteingang der letzten 24h laden */
    const since = Math.floor((Date.now() - 86400000) / 1000);
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=20&q=after:${since}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!listRes.ok) { results.push({ client_id: conn.client_id, error: "Inbox nicht abrufbar" }); continue; }

    const list = await listRes.json();
    if (!list.messages?.length) { results.push({ client_id: conn.client_id, new_leads: 0 }); continue; }

    /* Metadaten jeder Mail laden */
    const mails = await Promise.all(
      list.messages.map(async ({ id }) => {
        const r = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!r.ok) return null;
        const d = await r.json();
        const h = Object.fromEntries((d.payload?.headers || []).map(h => [h.name, h.value]));
        return { id, subject: h.Subject || "", from: h.From || "", date: h.Date || "", snippet: d.snippet || "" };
      })
    );

    /* Nur Mails die wie Anfragen aussehen */
    const candidates = mails.filter(Boolean).filter(m => isLikelyLead(m.subject, m.snippet));
    let newLeads = 0;

    for (const mail of candidates) {
      /* Vollständigen Body laden */
      const bodyRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${mail.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!bodyRes.ok) continue;
      const bodyData = await bodyRes.json();
      let body = "";
      function extractBody(part) {
        if (part.mimeType === "text/plain" && part.body?.data)
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
        if (part.parts) part.parts.forEach(extractBody);
      }
      extractBody(bodyData.payload || {});
      if (!body.trim()) body = mail.snippet;

      /* KI: Kontaktdaten extrahieren */
      let extracted;
      try {
        const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            messages: [{
              role: "user",
              content: `Extrahiere Kontaktdaten aus dieser E-Mail. Antworte NUR als JSON.
Betreff: ${mail.subject}
Von: ${mail.from}
Inhalt: ${body.slice(0, 1500)}

{ "contact_name": "...", "company_name": "...", "email": "...", "phone": "...", "notes": "1 Satz Zusammenfassung", "ist_anfrage": true/false }
Falls kein sinnvoller Lead: { "ist_anfrage": false }`,
            }],
          }),
        });
        const aiJson = await aiRes.json();
        const text = aiJson.content?.[0]?.text || "";
        extracted = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
      } catch { continue; }

      if (!extracted.ist_anfrage) continue;

      const emailFallback = mail.from.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)?.[0] || null;
      const nameFallback  = mail.from.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || null;
      const leadEmail     = extracted.email || emailFallback;

      /* Duplikat-Check */
      if (leadEmail) {
        const { data: dup } = await sb.from("leads").select("id").eq("client_id", conn.client_id).eq("email", leadEmail).maybeSingle();
        if (dup) continue;
      }

      const { error: insertErr } = await sb.from("leads").insert({
        client_id:       conn.client_id,
        contact_name:    extracted.contact_name || nameFallback || null,
        company_name:    extracted.company_name || extracted.contact_name || nameFallback || null,
        email:           leadEmail || null,
        phone:           extracted.phone || null,
        notes:           [extracted.notes, `Betreff: ${mail.subject}`, `Gmail-ID: ${mail.id}`].filter(Boolean).join("\n"),
        source:          "email",
        source_detail:   mail.subject || null,
        pipeline_status: "kalt",
        score:           5,
        status:          "new",
      });

      if (!insertErr) newLeads++;
    }

    results.push({ client_id: conn.client_id, scanned: candidates.length, new_leads: newLeads });
  }

  return NextResponse.json({ ok: true, processed: connections.length, results });
}
