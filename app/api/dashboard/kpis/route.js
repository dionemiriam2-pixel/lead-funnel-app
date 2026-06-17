import { NextResponse } from "next/server";
import { supabaseAdmin, verifyAuth } from "@/lib/supabase";

export async function GET(req) {
  if (!await verifyAuth(req)) return NextResponse.json({ error: "Unauth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const client_id = searchParams.get("client_id");
  const period    = searchParams.get("period") || "this_month";

  if (!client_id) return NextResponse.json({ error: "client_id fehlt" }, { status: 400 });

  const now = new Date();
  let periodStart, periodEnd, prevStart, prevEnd;

  if (period === "this_month") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    prevStart   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd     = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === "last_month") {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    periodEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    prevStart   = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    prevEnd     = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
  } else {
    // 30d
    periodStart = new Date(now.getTime() - 30 * 86400000);
    periodEnd   = now;
    prevStart   = new Date(now.getTime() - 60 * 86400000);
    prevEnd     = new Date(now.getTime() - 30 * 86400000 - 1);
  }

  const pStart  = periodStart.toISOString();
  const pEnd    = periodEnd.toISOString();
  const pvStart = prevStart.toISOString();
  const pvEnd   = prevEnd.toISOString();

  const db = supabaseAdmin();

  const [{ data: leads, error: leadsErr }, { data: lps }] = await Promise.all([
    db.from("leads")
      .select("id, created_at, pipeline_status, source")
      .eq("client_id", client_id)
      .order("created_at", { ascending: true }),
    db.from("landing_pages")
      .select("id, leads_count, status")
      .eq("client_id", client_id),
  ]);

  if (leadsErr) return NextResponse.json({ error: leadsErr.message }, { status: 500 });

  const all    = leads || [];
  const period_ = all.filter(l => l.created_at >= pStart && l.created_at <= pEnd);
  const prev_   = all.filter(l => l.created_at >= pvStart && l.created_at <= pvEnd);

  const won          = all.filter(l => l.pipeline_status === "gewonnen").length;
  const openPipeline = all.filter(l => !["gewonnen", "verloren"].includes(l.pipeline_status)).length;
  const convRate     = all.length > 0 ? Math.round((won / all.length) * 100) : 0;

  // By source (period only)
  const srcMap = {};
  period_.forEach(l => { const s = l.source || "unbekannt"; srcMap[s] = (srcMap[s] || 0) + 1; });

  // By pipeline status (all time)
  const stMap = {};
  all.forEach(l => { const s = l.pipeline_status || "neu"; stMap[s] = (stMap[s] || 0) + 1; });

  // Trend: leads per day in period
  const trendMap = {};
  period_.forEach(l => { const d = l.created_at.slice(0, 10); trendMap[d] = (trendMap[d] || 0) + 1; });

  const trend = [];
  const cur = new Date(periodStart);
  while (cur <= periodEnd) {
    const d = cur.toISOString().slice(0, 10);
    trend.push({ date: d, count: trendMap[d] || 0 });
    cur.setDate(cur.getDate() + 1);
  }

  return NextResponse.json({
    kpis: {
      total:        all.length,
      inPeriod:     period_.length,
      prevPeriod:   prev_.length,
      won,
      openPipeline,
      convRate,
    },
    bySource: Object.entries(srcMap).sort((a, b) => b[1] - a[1]).map(([source, count]) => ({ source, count })),
    byStatus: Object.entries(stMap).sort((a, b) => b[1] - a[1]).map(([status, count]) => ({ status, count })),
    trend,
    landingPages: {
      count:       (lps || []).length,
      published:   (lps || []).filter(l => l.status === "published").length,
      totalLeads:  (lps || []).reduce((s, l) => s + (l.leads_count || 0), 0),
    },
  });
}
