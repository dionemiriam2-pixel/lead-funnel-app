import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

export async function GET(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const sb = supabaseAdmin();
  const { searchParams } = new URL(req.url);
  const client    = searchParams.get("client");
  const client_id = searchParams.get("client_id");
  const source    = searchParams.get("source");
  const status    = searchParams.get("status");
  const q         = searchParams.get("q");

  let query = sb.from("leads").select("*").order("score", { ascending: false }).order("created_at", { ascending: false });
  if (client_id) query = query.eq("client_id", client_id);
  else if (client) query = query.eq("client", client);
  if (source) query = query.eq("source", source);
  if (status) query = query.eq("pipeline_status", status);
  if (q)      query = query.ilike("company_name", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const body = await req.json();
  if (!body.client_id) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("leads").insert({
    contact_name:    body.contact_name    || null,
    company_name:    body.company_name    || body.contact_name || null,
    phone:           body.phone           || null,
    email:           body.email           || null,
    source:          body.source          || "manuell",
    notes:           body.notes           || null,
    client_id:       body.client_id,
    status:          "new",
    pipeline_status: "neu",
    score:           body.score           ?? 5,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });
  const sb = supabaseAdmin();
  const { error } = await sb.from("leads").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id  = searchParams.get("id");
  const all = searchParams.get("all");
  const ids = searchParams.get("ids");
  const sb  = supabaseAdmin();
  if (all === "1") {
    const { error } = await sb.from("leads").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (ids) {
    const idList = ids.split(",").filter(Boolean);
    if (!idList.length) return NextResponse.json({ error: "ids leer" }, { status: 400 });
    const { error } = await sb.from("leads").delete().in("id", idList);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    if (!id) return NextResponse.json({ error: "id fehlt" }, { status: 400 });
    const { error } = await sb.from("leads").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
