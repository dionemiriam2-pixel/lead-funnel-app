import { NextResponse } from "next/server";
import { createHmac }   from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

/* ── GET: Meta-Webhook-Verifizierung ─────────────────────── */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[whatsapp/webhook] Verifizierung erfolgreich");
    return new Response(challenge, { status: 200 });
  }
  console.warn("[whatsapp/webhook] Verifizierung fehlgeschlagen — Token stimmt nicht");
  return new Response("Forbidden", { status: 403 });
}

/* ── POST: Eingehende Nachrichten von Meta ───────────────── */
export async function POST(req) {
  const rawBody = await req.text();

  /* Signatur prüfen */
  const signature = req.headers.get("x-hub-signature-256") || "";
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    if (signature !== expected) {
      console.warn("[whatsapp/webhook] Signatur ungültig");
      return new Response("Forbidden", { status: 403 });
    }
  }

  let payload;
  try { payload = JSON.parse(rawBody); } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const sb = supabaseAdmin();

  /* Nachrichten aus dem Meta-Payload extrahieren */
  const entries = payload?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value    = change.value ?? {};
      const messages = value.messages ?? [];

      for (const msg of messages) {
        if (msg.type !== "text") continue; // erstmal nur Text

        const waFrom    = msg.from;
        const body      = msg.text?.body ?? "";
        const messageId = msg.id;
        const waTo      = value.metadata?.display_phone_number ?? "";

        /* Passenden Kunden anhand der Nummer suchen */
        const { data: lead } = await sb
          .from("leads")
          .select("client_id")
          .eq("phone", waFrom)
          .maybeSingle();

        /* Nachricht speichern */
        await sb.from("whatsapp_messages").insert({
          client_id:     lead?.client_id ?? null,
          wa_from:       waFrom,
          wa_to:         waTo,
          direction:     "in",
          body,
          wa_message_id: messageId,
          status:        "received",
        });

        console.log(`[whatsapp/webhook] Nachricht von ${waFrom}: ${body.slice(0, 60)}`);
      }
    }
  }

  /* Meta erwartet immer 200, sonst wiederholt er */
  return new Response("OK", { status: 200 });
}
