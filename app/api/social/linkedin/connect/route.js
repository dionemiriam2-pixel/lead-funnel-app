import { NextResponse } from "next/server";

export async function GET(req) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;

  console.log("[linkedin/connect] LINKEDIN_CLIENT_ID vorhanden:", !!clientId);

  if (!clientId) {
    return NextResponse.json(
      { error: "LINKEDIN_CLIENT_ID nicht gesetzt — .env.local prüfen und Dev-Server neu starten" },
      { status: 500 }
    );
  }

  const { searchParams, host } = new URL(req.url);
  const supabaseClientId = searchParams.get("client_id");
  if (!supabaseClientId) {
    return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });
  }

  /* Redirect-URI direkt aus dem Request ableiten — funktioniert lokal + Vercel automatisch */
  const proto       = req.headers.get("x-forwarded-proto") || "https";
  const redirectUri = `${proto}://${host}/api/social/linkedin/callback`;

  console.log("[linkedin/connect] redirect_uri:", redirectUri);

  const params = new URLSearchParams({
    response_type: "code",
    client_id:     clientId,
    redirect_uri:  redirectUri,
    state:         supabaseClientId,
    scope:         "openid profile w_member_social",
  });

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params}`
  );
}
