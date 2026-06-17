import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function getBase(req) {
  const { host } = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}
const REDIRECT_URI = (req) => `${getBase(req)}/api/social/linkedin/callback`;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code     = searchParams.get("code");
  const clientId = searchParams.get("state");
  const error    = searchParams.get("error");

  const base = getBase(req);

  if (error || !code || !clientId) {
    return NextResponse.redirect(`${base}/kunden?linkedin_error=1`);
  }

  // Code gegen Token tauschen
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  REDIRECT_URI(req),
      client_id:     process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("LinkedIn token error:", err);
    return NextResponse.redirect(`${base}/kunden/${clientId}?linkedin_error=token`);
  }

  const token       = await tokenRes.json();
  const accessToken = token.access_token;
  const expiresAt   = new Date(Date.now() + (token.expires_in || 3600) * 1000).toISOString();

  // Profil via OpenID Connect holen
  let accountName = "LinkedIn-Nutzer";
  let accountId   = "";
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (profileRes.ok) {
    const p     = await profileRes.json();
    accountName = [p.given_name, p.family_name].filter(Boolean).join(" ") || p.name || "LinkedIn-Nutzer";
    accountId   = p.sub || "";
  }

  // In DB speichern (upsert falls schon verbunden)
  await supabaseAdmin()
    .from("social_connections")
    .upsert({
      client_id:     clientId,
      platform:      "linkedin",
      access_token:  accessToken,
      refresh_token: token.refresh_token || null,
      expires_at:    expiresAt,
      account_name:  accountName,
      account_id:    accountId,
    }, { onConflict: "client_id,platform" });

  return NextResponse.redirect(`${base}/kunden/${clientId}?social=connected`);
}
