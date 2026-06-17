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

  if (error || !code || !clientId)
    return NextResponse.redirect(`${base}/kunden?gmail_error=1`);

  const redirectUri = `${base}/api/social/gmail/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  redirectUri,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    console.error("Gmail token error:", await tokenRes.text());
    return NextResponse.redirect(`${base}/kunden/${clientId}?gmail_error=token`);
  }

  const token       = await tokenRes.json();
  const accessToken = token.access_token;
  const expiresAt   = new Date(Date.now() + (token.expires_in || 3600) * 1000).toISOString();

  /* E-Mail-Adresse holen */
  let accountName = "Gmail";
  let accountId   = "";
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (profileRes.ok) {
    const p     = await profileRes.json();
    accountName = p.email || "Gmail";
    accountId   = p.email || p.id || "";
  }

  await supabaseAdmin()
    .from("social_connections")
    .upsert({
      client_id:     clientId,
      platform:      "gmail",
      access_token:  accessToken,
      refresh_token: token.refresh_token || null,
      expires_at:    expiresAt,
      account_name:  accountName,
      account_id:    accountId,
    }, { onConflict: "client_id,platform" });

  return NextResponse.redirect(`${base}/kunden/${clientId}?social=gmail_connected`);
}
