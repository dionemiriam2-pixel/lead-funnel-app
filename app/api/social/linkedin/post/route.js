import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req) {
  const { client_id, text } = await req.json();
  if (!client_id || !text?.trim())
    return NextResponse.json({ error: "client_id und text erforderlich" }, { status: 400 });

  /* Token aus DB holen — nie ans Frontend geben */
  const { data: conn, error } = await supabaseAdmin()
    .from("social_connections")
    .select("access_token, account_id, expires_at")
    .eq("client_id", client_id)
    .eq("platform", "linkedin")
    .single();

  if (error || !conn)
    return NextResponse.json({ error: "LinkedIn nicht verbunden" }, { status: 404 });

  if (conn.expires_at && new Date(conn.expires_at) < new Date())
    return NextResponse.json({ error: "LinkedIn-Token abgelaufen — bitte neu verbinden" }, { status: 401 });

  /* Post über LinkedIn Posts API */
  const body = {
    author:         `urn:li:person:${conn.account_id}`,
    commentary:     text.trim(),
    visibility:     "PUBLIC",
    distribution: {
      feedDistribution:             "MAIN_FEED",
      targetEntities:               [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState:              "PUBLISHED",
    isReshareDisabledByAuthor:   false,
  };

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method:  "POST",
    headers: {
      "Authorization":              `Bearer ${conn.access_token}`,
      "Content-Type":               "application/json",
      "LinkedIn-Version":           "202306",
      "X-Restli-Protocol-Version":  "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("LinkedIn post error:", err);
    return NextResponse.json({ error: "LinkedIn-Fehler: " + err }, { status: 500 });
  }

  /* Post-ID aus Location-Header */
  const postId = res.headers.get("x-restli-id") || res.headers.get("location") || "";

  return NextResponse.json({ ok: true, post_id: postId });
}
