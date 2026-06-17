import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BASE = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "list") {
    const clientId = searchParams.get("client_id");
    if (!clientId) return NextResponse.json({ data: [] });
    const { data } = await supabaseAdmin()
      .from("social_connections")
      .select("platform, account_name, account_id, connected_at, expires_at")
      .eq("client_id", clientId);
    return NextResponse.json({ data: data || [] });
  }

  if (action === "connect") {
    const clientId = searchParams.get("client_id");
    if (!clientId) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });
    const params = new URLSearchParams({
      response_type: "code",
      client_id:     process.env.LINKEDIN_CLIENT_ID,
      redirect_uri:  `${BASE()}/api/social/linkedin/callback`,
      state:         clientId,
      scope:         "openid profile w_member_social",
    });
    return NextResponse.redirect(
      `https://www.linkedin.com/oauth/v2/authorization?${params}`
    );
  }

  return NextResponse.json({ error: "Unbekannte action" }, { status: 400 });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id");
  const platform  = searchParams.get("platform");
  if (!clientId || !platform)
    return NextResponse.json({ error: "Parameter fehlen" }, { status: 400 });
  await supabaseAdmin()
    .from("social_connections")
    .delete()
    .eq("client_id", clientId)
    .eq("platform", platform);
  return NextResponse.json({ ok: true });
}
