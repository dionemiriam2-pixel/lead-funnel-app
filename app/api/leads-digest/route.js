import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const since = new Date(Date.now() - 86400000).toISOString();

  const { data: rows, error } = await supabaseAdmin()
    .from("leads")
    .select("source, contact_name, email, phone, created_at, clients:client_id(name)")
    .gt("created_at", since)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const leads = (rows || []).map(l => ({
    kunde:        l.clients?.name || "Unbekannt",
    kanal:        l.source        || "unbekannt",
    contact_name: l.contact_name  || null,
    email:        l.email         || null,
    phone:        l.phone         || null,
    created_at:   l.created_at,
  }));

  /* Verdichtung pro Kunde serverseitig */
  const kundenMap = {};
  for (const l of leads) {
    if (!kundenMap[l.kunde]) kundenMap[l.kunde] = { kunde: l.kunde, count: 0, kanaele: {} };
    kundenMap[l.kunde].count++;
    kundenMap[l.kunde].kanaele[l.kanal] = (kundenMap[l.kunde].kanaele[l.kanal] || 0) + 1;
  }

  return NextResponse.json({
    total:    leads.length,
    perKunde: Object.values(kundenMap).sort((a, b) => b.count - a.count),
    leads,
  });
}
