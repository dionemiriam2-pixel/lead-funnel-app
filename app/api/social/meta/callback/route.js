import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getBase(req) {
  const { host } = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code     = searchParams.get("code");
  const clientId = searchParams.get("state");
  const error    = searchParams.get("error");
  const base     = getBase(req);

  if (error || !code || !clientId) {
    console.error("[meta/callback] Fehler:", error);
    return NextResponse.redirect(`${base}/kunden?meta_error=1`);
  }

  const redirectUri  = `${base}/api/social/meta/callback`;
  const appId        = process.env.META_APP_ID;
  const appSecret    = process.env.META_APP_SECRET;

  /* 1. Code → kurzlebiger User-Token */
  const shortRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code })
  );
  if (!shortRes.ok) {
    console.error("[meta/callback] Token-Austausch fehlgeschlagen:", await shortRes.text());
    return NextResponse.redirect(`${base}/kunden/${clientId}?meta_error=token`);
  }
  const { access_token: shortToken } = await shortRes.json();

  /* 2. Kurzlebig → langlebiger User-Token (60 Tage) */
  const longRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
    new URLSearchParams({
      grant_type:       "fb_exchange_token",
      client_id:        appId,
      client_secret:    appSecret,
      fb_exchange_token: shortToken,
    })
  );
  if (!longRes.ok) {
    console.error("[meta/callback] Long-lived-Token fehlgeschlagen:", await longRes.text());
    return NextResponse.redirect(`${base}/kunden/${clientId}?meta_error=longtoken`);
  }
  const { access_token: userToken, expires_in } = await longRes.json();
  const userTokenExpiry = new Date(Date.now() + (expires_in || 5184000) * 1000).toISOString();

  /* 3. Seiten abrufen — Page-Tokens aus /me/accounts sind langlebig wenn der User-Token langlebig ist */
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${userToken}`
  );
  if (!pagesRes.ok) {
    console.error("[meta/callback] Seiten abrufen fehlgeschlagen:", await pagesRes.text());
    return NextResponse.redirect(`${base}/kunden/${clientId}?meta_error=pages`);
  }
  const { data: pages } = await pagesRes.json();
  if (!pages?.length) {
    console.warn("[meta/callback] Keine Facebook-Seiten gefunden");
    return NextResponse.redirect(`${base}/kunden/${clientId}?meta_error=no_pages`);
  }

  /* Erste Seite verwenden (mehrere Seiten → TODO: Auswahl-UI) */
  const page      = pages[0];
  const pageToken = page.access_token;
  const pageId    = page.id;
  const pageName  = page.name;

  console.log(`[meta/callback] Seite: ${pageName} (${pageId})`);

  /* 4. Verknüpftes Instagram-Konto ermitteln */
  let igId = null, igName = null;
  const igRes = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account{id,username}&access_token=${pageToken}`
  );
  if (igRes.ok) {
    const igData = await igRes.json();
    igId   = igData.instagram_business_account?.id   || null;
    igName = igData.instagram_business_account?.username || null;
    if (igId) console.log(`[meta/callback] Instagram: @${igName} (${igId})`);
  }

  /* 5. Seite auf Webhook-Events abonnieren */
  const subRes = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${pageToken}`,
    { method: "POST" }
  );
  if (!subRes.ok) {
    console.warn("[meta/callback] Webhook-Subscription fehlgeschlagen:", await subRes.text());
    /* kein hard-error — weiter */
  }

  const sb = supabaseAdmin();

  /* 6. Messenger in social_connections speichern */
  await sb.from("social_connections").upsert({
    client_id:    clientId,
    platform:     "messenger",
    access_token: pageToken,
    expires_at:   null,          /* Page-Tokens laufen nicht ab */
    account_name: pageName,
    account_id:   pageId,
  }, { onConflict: "client_id,platform" });

  /* 7. Instagram speichern (falls vorhanden) */
  if (igId) {
    await sb.from("social_connections").upsert({
      client_id:    clientId,
      platform:     "instagram",
      access_token: pageToken,   /* gleicher Page-Token für IG Graph API */
      expires_at:   null,
      account_name: igName ? `@${igName}` : igId,
      account_id:   igId,
    }, { onConflict: "client_id,platform" });
  }

  /* 8. fb_page_id + ig_account_id auch auf clients aktualisieren (für Webhook-Matching) */
  const clientUpdate = { fb_page_id: pageId };
  if (igId) clientUpdate.ig_account_id = igId;
  await sb.from("clients").update(clientUpdate).eq("id", clientId);

  return NextResponse.redirect(`${base}/kunden/${clientId}?social=meta_connected`);
}
