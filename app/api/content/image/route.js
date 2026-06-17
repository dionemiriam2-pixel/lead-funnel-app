import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

/* GET: teilt dem Frontend mit ob ein OpenAI-Key vorhanden ist */
export async function GET(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  return NextResponse.json({ hasKey: !!process.env.OPENAI_API_KEY });
}

/* POST: Bild generieren und in Supabase Storage ablegen */
export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { post_id, image_prompt } = await req.json();
  if (!post_id || !image_prompt) {
    return NextResponse.json({ error: "post_id + image_prompt erforderlich" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ canva: true });
  }

  // ── DALL-E 3 aufrufen ─────────────────────────────────────
  const aiRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:           "dall-e-3",
      prompt:          `Professionelles Social-Media-Bild für ein deutsches Unternehmen: ${image_prompt}. Klarer, moderner Stil, kein Text im Bild, quadratisches Format.`,
      n:               1,
      size:            "1024x1024",
      quality:         "standard",
      response_format: "url",
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error("[/api/content/image] OpenAI Fehler:", errText);
    return NextResponse.json({ error: "Bild-KI Fehler — Key prüfen oder später nochmals versuchen" }, { status: 500 });
  }

  const aiData = await aiRes.json();
  const tempUrl = aiData.data?.[0]?.url;
  if (!tempUrl) return NextResponse.json({ error: "Kein Bild erhalten" }, { status: 500 });

  // ── Bild downloaden + in Supabase Storage hochladen ──────
  const sb       = supabaseAdmin();
  let image_url  = tempUrl; // Fallback: temp-URL (läuft in ~1h ab)
  let permanent  = false;

  try {
    const imgRes    = await fetch(tempUrl);
    const imgBuf    = await imgRes.arrayBuffer();
    const fileName  = `${post_id}-${Date.now()}.png`;

    const { error: uploadErr } = await sb.storage
      .from("content-images")
      .upload(fileName, new Uint8Array(imgBuf), { contentType: "image/png", upsert: true });

    if (!uploadErr) {
      const { data: { publicUrl } } = sb.storage.from("content-images").getPublicUrl(fileName);
      image_url = publicUrl;
      permanent = true;
    }
  } catch (e) {
    console.warn("[/api/content/image] Storage-Upload fehlgeschlagen, nutze temp-URL:", e.message);
  }

  // ── image_url am Post speichern ───────────────────────────
  await sb.from("content_posts").update({ image_url }).eq("id", post_id);

  return NextResponse.json({ ok: true, image_url, permanent });
}
