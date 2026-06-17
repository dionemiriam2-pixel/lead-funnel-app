import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function getToken(clientId) {
  const { data } = await supabaseAdmin()
    .from("social_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("client_id", clientId)
    .eq("platform", "gmail")
    .single();
  if (!data) return null;

  /* Token auffrischen wenn er in <60s abläuft */
  if (data.expires_at && new Date(data.expires_at) < new Date(Date.now() + 60000)) {
    if (!data.refresh_token) return null;
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "refresh_token",
        refresh_token: data.refresh_token,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    });
    if (!r.ok) return null;
    const refreshed  = await r.json();
    const expiresAt  = new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString();
    await supabaseAdmin().from("social_connections")
      .update({ access_token: refreshed.access_token, expires_at: expiresAt })
      .eq("client_id", clientId).eq("platform", "gmail");
    return refreshed.access_token;
  }
  return data.access_token;
}

/* GET — Posteingang oder einzelne Nachricht */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clientId  = searchParams.get("client_id");
  const messageId = searchParams.get("message_id");
  if (!clientId) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const token = await getToken(clientId);
  if (!token) return NextResponse.json({ error: "Gmail nicht verbunden" }, { status: 401 });

  if (messageId) {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return NextResponse.json({ error: "Nachricht nicht gefunden" }, { status: 404 });
    const d       = await res.json();
    const headers = Object.fromEntries((d.payload?.headers || []).map(h => [h.name, h.value]));
    let body = "";
    function extractBody(part) {
      if (part.mimeType === "text/plain" && part.body?.data)
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      if (part.parts) part.parts.forEach(extractBody);
    }
    extractBody(d.payload || {});
    return NextResponse.json({ data: {
      id: d.id, subject: headers.Subject || "(kein Betreff)",
      from: headers.From || "", to: headers.To || "",
      date: headers.Date || "", body,
    }});
  }

  /* Inbox-Liste */
  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=20",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) return NextResponse.json({ error: "Posteingang nicht abrufbar" }, { status: 500 });
  const list = await listRes.json();
  if (!list.messages?.length) return NextResponse.json({ data: [] });

  const messages = await Promise.all(
    list.messages.slice(0, 15).map(async ({ id }) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!r.ok) return null;
      const d       = await r.json();
      const headers = Object.fromEntries((d.payload?.headers || []).map(h => [h.name, h.value]));
      return {
        id, snippet: d.snippet || "",
        subject: headers.Subject || "(kein Betreff)",
        from:    headers.From    || "",
        date:    headers.Date    || "",
        unread:  d.labelIds?.includes("UNREAD") ?? false,
      };
    })
  );
  return NextResponse.json({ data: messages.filter(Boolean) });
}

/* POST — E-Mail senden */
export async function POST(req) {
  const { client_id, to, subject, body } = await req.json();
  if (!client_id || !to || !body)
    return NextResponse.json({ error: "client_id, to und body erforderlich" }, { status: 400 });

  const token = await getToken(client_id);
  if (!token) return NextResponse.json({ error: "Gmail nicht verbunden" }, { status: 401 });

  const { data: conn } = await supabaseAdmin()
    .from("social_connections")
    .select("account_id")
    .eq("client_id", client_id).eq("platform", "gmail").single();

  const from = conn?.account_id || "";
  const raw  = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject || ""}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join("\r\n");

  const encoded = Buffer.from(raw).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify({ raw: encoded }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.text();
    console.error("Gmail send error:", err);
    return NextResponse.json({ error: "Senden fehlgeschlagen" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
