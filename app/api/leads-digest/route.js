import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/* Muster für Kontaktanfragen (gleiche Logik wie im Kanäle-Tab) */
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
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const sb    = supabaseAdmin();
  const since = new Date(Date.now() - 86400000).toISOString();

  /* ── 1. Neue Leads aus der DB ─────────────────────────── */
  const { data: rows, error } = await sb
    .from("leads")
    .select("source, contact_name, email, phone, created_at, clients:client_id(name)")
    .gt("created_at", since)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const leads = (rows || []).map(l => ({
    kunde:        l.clients?.name || "Unbekannt",
    kanal:        l.source        || "unbekannt",
    contact_name: l.contact_name  || null,
    email:        l.email         || null,
    phone:        l.phone         || null,
    created_at:   l.created_at,
  }));

  const kundenMap = {};
  for (const l of leads) {
    if (!kundenMap[l.kunde]) kundenMap[l.kunde] = { kunde: l.kunde, count: 0, kanaele: {} };
    kundenMap[l.kunde].count++;
    kundenMap[l.kunde].kanaele[l.kanal] = (kundenMap[l.kunde].kanaele[l.kanal] || 0) + 1;
  }

  /* ── 2. Gmail-Postfächer: unverarbeitete Anfragen ────── */
  const { data: connections } = await sb
    .from("social_connections")
    .select("id, client_id, access_token, refresh_token, expires_at, clients:client_id(id, name)")
    .eq("platform", "gmail");

  const gmailUnprocessed = [];

  if (connections?.length) {
    const sinceUnix = Math.floor((Date.now() - 86400000) / 1000);

    await Promise.all(connections.map(async (conn) => {
      const token = await getValidToken(conn);
      if (!token) return;

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=20&q=after:${sinceUnix}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => null);
      if (!listRes?.ok) return;

      const list = await listRes.json();
      if (!list.messages?.length) return;

      /* Metadaten der Mails holen */
      const mails = await Promise.all(
        list.messages.slice(0, 20).map(async ({ id }) => {
          const r = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
            { headers: { Authorization: `Bearer ${token}` } }
          ).catch(() => null);
          if (!r?.ok) return null;
          const d = await r.json();
          const h = Object.fromEntries((d.payload?.headers || []).map(h => [h.name, h.value]));
          return { subject: h.Subject || "", snippet: d.snippet || "" };
        })
      );

      const count = mails.filter(Boolean).filter(m => isLikelyLead(m.subject, m.snippet)).length;
      if (count > 0) {
        gmailUnprocessed.push({
          client_id: conn.clients?.id || conn.client_id,
          kunde:     conn.clients?.name || "Unbekannt",
          count,
        });
      }
    }));
  }

  return NextResponse.json({
    total:             leads.length,
    perKunde:          Object.values(kundenMap).sort((a, b) => b.count - a.count),
    leads,
    gmailUnprocessed:  gmailUnprocessed.sort((a, b) => b.count - a.count),
  });
}
