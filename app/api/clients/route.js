import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function auth(req) {
  return req.headers.get("x-pw") === process.env.DASHBOARD_PASSWORD;
}

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("clients").select("*").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const body = await req.json();
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("clients").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { id, ...fields } = await req.json();
  const sb = supabaseAdmin();
  const { error } = await sb.from("clients").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const sb = supabaseAdmin();
  const { error } = await sb.from("clients").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
