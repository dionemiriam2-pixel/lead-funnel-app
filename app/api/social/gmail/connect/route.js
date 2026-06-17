import { NextResponse } from "next/server";

export async function GET(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  console.log("[gmail/connect] GOOGLE_CLIENT_ID vorhanden:", !!clientId);
  if (!clientId) return NextResponse.json({ error: "GOOGLE_CLIENT_ID nicht gesetzt" }, { status: 500 });

  const { searchParams, host } = new URL(req.url);
  const supabaseClientId = searchParams.get("client_id");
  if (!supabaseClientId) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const proto       = req.headers.get("x-forwarded-proto") || "https";
  const redirectUri = `${proto}://${host}/api/social/gmail/callback`;

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email",
    access_type:   "offline",
    prompt:        "consent",
    state:         supabaseClientId,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
