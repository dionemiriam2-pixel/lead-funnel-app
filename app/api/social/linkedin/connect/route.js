import { NextResponse } from "next/server";

export async function GET(req) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const base     = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  /* Debug-Log: nur ob Variable vorhanden, nie den Wert */
  console.log("[linkedin/connect] LINKEDIN_CLIENT_ID vorhanden:", !!clientId);
  console.log("[linkedin/connect] NEXT_PUBLIC_APP_URL:", base);

  if (!clientId) {
    return NextResponse.json(
      { error: "LINKEDIN_CLIENT_ID nicht gesetzt — .env.local prüfen und Dev-Server neu starten" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const supabaseClientId = searchParams.get("client_id");
  if (!supabaseClientId) {
    return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });
  }

  const redirectUri = `${base}/api/social/linkedin/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id:     clientId,
    redirect_uri:  redirectUri,
    state:         supabaseClientId,
    scope:         "openid profile w_member_social",
  });

  console.log("[linkedin/connect] redirect_uri:", redirectUri);

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params}`
  );
}
