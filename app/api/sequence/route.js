import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function auth(req) {
  return req.headers.get("x-pw") === process.env.DASHBOARD_PASSWORD;
}

const DEFAULT_STEPS = [
  { id: 1, day: 0, type: "email", label: "E-Mail senden", icon: "📧", status: "pending" },
  { id: 2, day: 3, type: "linkedin", label: "LinkedIn kontaktieren", icon: "💼", status: "pending" },
  { id: 3, day: 7, type: "email_followup", label: "Follow-up E-Mail", icon: "📧", status: "pending" },
  { id: 4, day: 14, type: "ads", label: "Custom Audience hochladen", icon: "🎯", status: "pending" },
];

// Sequenz starten
export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { lead_id } = await req.json();
  const sb = supabaseAdmin();

  const steps = DEFAULT_STEPS.map(s => ({ ...s }));
  const now = new Date().toISOString();

  await sb.from("leads").update({
    sequence: steps,
    sequence_started_at: now,
    updated_at: now,
  }).eq("id", lead_id);

  return NextResponse.json({ ok: true, steps });
}

// Schritt als erledigt markieren
export async function PATCH(req) {
  if (!auth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const { lead_id, step_id, status } = await req.json();
  const sb = supabaseAdmin();

  const { data: lead } = await sb.from("leads").select("sequence").eq("id", lead_id).single();
  if (!lead) return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });

  const steps = (lead.sequence || []).map(s =>
    s.id === step_id ? { ...s, status, done_at: status === "done" ? new Date().toISOString() : null } : s
  );

  await sb.from("leads").update({ sequence: steps, updated_at: new Date().toISOString() }).eq("id", lead_id);
  return NextResponse.json({ ok: true, steps });
}
