"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, Globe, BarChart2 } from "lucide-react";

/* ── Farben ────────────────────────────────────────────────── */
const SRC_COLOR = {
  landingpage: "#16a34a",
  whatsapp:    "#25D366",
  messenger:   "#1d4ed8",
  instagram:   "#be185d",
  manuell:     "#6b7280",
  unbekannt:   "#d1d5db",
};
const SRC_ICON = {
  landingpage: "🌐",
  whatsapp:    "💬",
  messenger:   "💙",
  instagram:   "📸",
  manuell:     "✏️",
};
const ST_COLOR = {
  neu:          "#94a3b8",
  kontaktiert:  "#60a5fa",
  qualifiziert: "#818cf8",
  angebot:      "#f59e0b",
  gewonnen:     "#16a34a",
  verloren:     "#ef4444",
};
const ST_LABEL = {
  neu: "Neu", kontaktiert: "Kontaktiert", qualifiziert: "Qualifiziert",
  angebot: "Angebot", gewonnen: "Gewonnen", verloren: "Verloren",
};
const PERIODS = [
  { key: "this_month",  label: "Dieser Monat" },
  { key: "last_month",  label: "Letzter Monat" },
  { key: "30d",         label: "30 Tage" },
];

/* ── SVG Trend-Chart ───────────────────────────────────────── */
function TrendChart({ data }) {
  if (!data || data.length === 0) return <Empty text="Keine Trenddaten" />;

  const W = 560, H = 120, PAD = { top: 8, right: 8, bottom: 24, left: 28 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map(d => d.count), 1);
  const barW   = Math.max(2, (innerW / data.length) - 2);
  const yLabels = [0, Math.ceil(maxVal / 2), maxVal];

  // Show date label every ~7 days
  const step = Math.max(1, Math.floor(data.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {/* Y-axis lines */}
      {yLabels.map(v => {
        const y = PAD.top + innerH - (v / maxVal) * innerH;
        return (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
              stroke="var(--border)" strokeWidth={1} strokeDasharray={v === 0 ? "none" : "3,3"} />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-tertiary)">{v}</text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const x = PAD.left + i * (innerW / data.length);
        const bh = Math.max(2, (d.count / maxVal) * innerH);
        const y  = PAD.top + innerH - bh;
        const isHot = d.count === maxVal && maxVal > 0;
        return (
          <g key={d.date}>
            <rect x={x + 1} y={y} width={barW} height={bh}
              fill={isHot ? "var(--accent)" : "var(--ink)"}
              opacity={d.count === 0 ? 0.12 : 0.85}
              rx={2}>
              <title>{`${d.date}: ${d.count} Lead${d.count !== 1 ? "s" : ""}`}</title>
            </rect>
            {i % step === 0 && (
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize={8} fill="var(--text-tertiary)">
                {d.date.slice(5)} {/* MM-DD */}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Kleine Hilfkomponenten ────────────────────────────────── */
function Empty({ text = "Noch keine Daten" }) {
  return (
    <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
      {text}
    </div>
  );
}

function Delta({ now, prev }) {
  if (prev === undefined || prev === null) return null;
  const diff = now - prev;
  if (diff === 0) return <span style={{ fontSize: 11, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 2 }}><Minus size={10} /> {prev} Vorperiode</span>;
  const up = diff > 0;
  return (
    <span style={{ fontSize: 11, color: up ? "#16a34a" : "#ef4444", display: "flex", alignItems: "center", gap: 2 }}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? "+" : ""}{diff} vs. Vorperiode
    </span>
  );
}

function KpiCard({ label, value, sub, delta, prev, accent }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, color: accent ? "var(--accent)" : "var(--ink)", marginBottom: 6 }}>{value}</div>
      {sub  && <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>{sub}</div>}
      {delta !== undefined && <Delta now={delta} prev={prev} />}
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-secondary)" }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

/* ── Haupt-Komponente ──────────────────────────────────────── */
export default function CustomerDashboard({ clientId }) {
  const router  = useRouter();
  const [period, setPeriod]   = useState("this_month");
  const [data,   setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/api/dashboard/kpis?client_id=${clientId}&period=${period}`);
    setData(res);
    setLoading(false);
  }, [clientId, period]);

  useEffect(() => { load(); }, [load]);

  const kpis      = data?.kpis      || {};
  const bySource  = data?.bySource  || [];
  const byStatus  = data?.byStatus  || [];
  const trend     = data?.trend     || [];
  const lps       = data?.landingPages || {};

  const srcMax = bySource.length > 0 ? Math.max(...bySource.map(x => x.count)) : 1;
  const stMax  = byStatus.length  > 0 ? Math.max(...byStatus.map(x => x.count)) : 1;

  return (
    <div style={{ padding: "20px 0" }}>

      {/* ── Periode-Umschalter ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <BarChart2 size={15} strokeWidth={1.5} color="var(--text-tertiary)" />
        <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", marginRight: 4 }}>Zeitraum:</span>
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            style={{
              padding: "5px 14px", borderRadius: 99, border: "1.5px solid",
              borderColor: period === p.key ? "var(--ink)" : "var(--border)",
              background:  period === p.key ? "var(--ink)" : "transparent",
              color:       period === p.key ? "#fff" : "var(--text-secondary)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
            {p.label}
          </button>
        ))}
        {loading && <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 8 }}>Lade…</span>}
      </div>

      {/* ── KPI-Karten ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KpiCard label="Leads gesamt"       value={kpis.total      ?? "–"} sub="alle Zeiträume" />
        <KpiCard label="Im Zeitraum"        value={kpis.inPeriod   ?? "–"} sub="neue Leads" delta={kpis.inPeriod} prev={kpis.prevPeriod} accent={kpis.inPeriod > 0} />
        <KpiCard label="Conversion-Rate"    value={`${kpis.convRate ?? 0} %`} sub={`${kpis.won ?? 0} gewonnen`} />
        <KpiCard label="Offene Pipeline"    value={kpis.openPipeline ?? "–"} sub="nicht gewonnen/verloren" />
      </div>

      {/* ── Trend + Kanäle ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 16 }}>

        {/* Trend */}
        <Section title={`Lead-Trend · ${PERIODS.find(p => p.key === period)?.label}`}>
          {trend.length === 0 || trend.every(d => d.count === 0)
            ? <Empty text="Noch keine Leads in diesem Zeitraum" />
            : <TrendChart data={trend} />}
        </Section>

        {/* Kanal-Verteilung */}
        <Section title="Leads nach Kanal">
          {bySource.length === 0
            ? <Empty />
            : bySource.map(({ source, count }) => (
              <div key={source} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500 }}>
                    {SRC_ICON[source] || "📌"} {source}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{count}</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: 6, width: `${Math.round((count / srcMax) * 100)}%`, background: SRC_COLOR[source] || "var(--ink)", borderRadius: 99, transition: "width .4s ease" }} />
                </div>
              </div>
            ))}
        </Section>
      </div>

      {/* ── Pipeline + LPs ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>

        {/* Pipeline nach Status */}
        <Section title="Pipeline nach Status (gesamt)">
          {byStatus.length === 0
            ? <Empty />
            : (
              <>
                {/* Proportions bar */}
                <div style={{ display: "flex", height: 12, borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
                  {byStatus.map(({ status, count }) => (
                    <div key={status} title={`${ST_LABEL[status] || status}: ${count}`}
                      style={{ flex: count, background: ST_COLOR[status] || "#94a3b8", transition: "flex .4s ease" }} />
                  ))}
                </div>
                {/* Legend */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {byStatus.map(({ status, count }) => (
                    <div key={status} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: (ST_COLOR[status] || "#94a3b8") + "18", border: `1.5px solid ${ST_COLOR[status] || "#94a3b8"}` }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: ST_COLOR[status] || "#94a3b8", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{ST_LABEL[status] || status}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
        </Section>

        {/* Landing Pages */}
        <Section title="Landing Pages"
          action={
            <button onClick={() => router.push(`?tab=Landing+Pages`)}
              style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
              Verwalten →
            </button>
          }>
          {lps.count === 0
            ? <Empty text="Noch keine Landing Pages" />
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Seiten gesamt</span>
                  <span style={{ fontWeight: 800, fontSize: 20, color: "var(--ink)" }}>{lps.count}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Veröffentlicht</span>
                  <span style={{ fontWeight: 800, fontSize: 20, color: "#16a34a" }}>{lps.published}</span>
                </div>
                <div style={{ height: 1, background: "var(--border)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>LP-Leads gesamt</span>
                  <span style={{ fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>{lps.totalLeads}</span>
                </div>
              </div>
            )}
        </Section>

      </div>
    </div>
  );
}
