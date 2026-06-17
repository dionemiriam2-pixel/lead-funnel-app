import { NextResponse } from "next/server";

export async function GET(req) {
  const appId = process.env.META_APP_ID;
  console.log("[meta/connect] META_APP_ID vorhanden:", !!appId);
  if (!appId) return NextResponse.json({ error: "META_APP_ID nicht gesetzt" }, { status: 500 });

  const { searchParams, host } = new URL(req.url);
  const clientId = searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const proto       = req.headers.get("x-forwarded-proto") || "https";
  const redirectUri = `${proto}://${host}/api/social/meta/callback`;

  const scopes = [
    "pages_manage_metadata",
    "pages_messaging",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_manage_messages",
  ].join(",");

  const params = new URLSearchParams({
    client_id:     appId,
    redirect_uri:  redirectUri,
    scope:         scopes,
    response_type: "code",
    state:         clientId,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v21.0/dialog/oauth?${params}`
  );
}
