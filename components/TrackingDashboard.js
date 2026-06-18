"use client";

/* ── Widget-Bibliothek ─────────────────────────────────────────
   Erhält: data { kpis, bySource, byStatus, trend, landingPages }
   Rendert: konfigurierte Kacheln als CSS-Grid (4 Spalten)
─────────────────────────────────────────────────────────────── */

/* ── Farb-Maps ─────────────────────────────────────────────── */
const SRC_COLOR = {
  landingpage:"#16a34a", whatsapp:"#25D366", messenger:"#1d4ed8",
  instagram:"#be185d",   manuell:"#6b7280",  unbekannt:"#d1d5db",
};
const ST_COLOR  = {
  neu:"#94a3b8", kontaktiert:"#60a5fa", qualifiziert:"#818cf8",
  angebot:"#f59e0b", gewonnen:"#16a34a", verloren:"#ef4444",
};
const ST_LABEL  = { neu:"Neu", kontaktiert:"Kontaktiert", qualifiziert:"Qualifiziert",
  angebot:"Angebot", gewonnen:"Gewonnen", verloren:"Verloren" };

/* ── Widget-Definitionen ───────────────────────────────────── */
export const WIDGET_DEFS = {
  leads_gesamt:            { label:"Leads gesamt",          cols: 1 },
  leads_neu_monat:         { label:"Neu im Zeitraum",       cols: 1 },
  conversion_rate:         { label:"Conversion-Rate",       cols: 1 },
  top_kanal:               { label:"Top Kanal",             cols: 1 },
  leads_nach_kanal:        { label:"Leads nach Kanal",      cols: 2 },
  pipeline_nach_status:    { label:"Pipeline-Status",       cols: 2 },
  leads_trend:             { label:"Lead-Trend",            cols: 4 },
  landingpage_performance: { label:"LP Performance",        cols: 4 },
  ads_spend:               { label:"Werbung (Supermetrics)",cols: 2, soon: true },
};

export const DEFAULT_WIDGETS = [
  "leads_gesamt","leads_neu_monat","conversion_rate","top_kanal",
  "leads_nach_kanal","pipeline_nach_status","leads_trend","landingpage_performance",
];

/* ── Hilfkomponenten ───────────────────────────────────────── */
function Card({ cols = 1, children, label, action }) {
  return (
    <div style={{ gridColumn: `span ${cols}`, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {label && (
        <div style={{ padding: "12px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)" }}>{label}</span>
          {action}
        </div>
      )}
      <div style={{ padding: label ? "14px 16px" : "18px 20px", flex: 1 }}>{children}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, delta, accent }) {
  const up   = delta > 0;
  const down = delta < 0;
  return (
    <Card>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: accent ? "var(--accent)" : "var(--ink)", marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: delta !== undefined ? 4 : 0 }}>{sub}</div>
      {delta !== undefined && delta !== null && (
        <div style={{ fontSize: 11, color: up ? "#16a34a" : down ? "#ef4444" : "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 3 }}>
          {up ? "↑" : down ? "↓" : "→"} {up ? "+" : ""}{delta} vs. Vorperiode
        </div>
      )}
    </Card>
  );
}

function Empty({ text = "Keine Daten" }) {
  return <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>{text}</div>;
}

/* ── SVG Trend-Chart ───────────────────────────────────────── */
function TrendChart({ data }) {
  if (!data?.length || data.every(d => d.count === 0)) return <Empty text="Keine Leads im Zeitraum" />;
  const W = 720, H = 130, PAD = { top: 8, right: 12, bottom: 28, left: 32 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top  - PAD.bottom;
  const maxV = Math.max(...data.map(d => d.count), 1);
  const barW = Math.max(2, iW / data.length - 2);
  const step = Math.max(1, Math.floor(data.length / 7));
  const yTicks = [0, Math.ceil(maxV / 2), maxV];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {yTicks.map(v => {
        const y = PAD.top + iH - (v / maxV) * iH;
        return (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} strokeDasharray={v === 0 ? "none" : "3,3"} />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-tertiary)">{v}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x  = PAD.left + i * (iW / data.length);
        const bh = Math.max(2, (d.count / maxV) * iH);
        const y  = PAD.top + iH - bh;
        return (
          <g key={d.date}>
            <rect x={x + 1} y={y} width={barW} height={bh} fill={d.count === maxV ? "var(--accent)" : "var(--ink)"} opacity={d.count === 0 ? 0.1 : 0.85} rx={2}>
              <title>{d.date}: {d.count} Lead{d.count !== 1 ? "s" : ""}</title>
            </rect>
            {i % step === 0 && (
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={8} fill="var(--text-tertiary)">{d.date.slice(5)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Einzelne Widget-Renderer ──────────────────────────────── */
function WLeadsGesamt({ data }) {
  return <KpiCard label="Leads gesamt" value={data.kpis.total ?? "–"} sub="alle Zeiträume" />;
}

function WLeadsNeu({ data, periodLabel }) {
  const k = data.kpis;
  const delta = k.inPeriod !== undefined && k.prevPeriod !== undefined ? k.inPeriod - k.prevPeriod : undefined;
  return <KpiCard label={`Neu · ${periodLabel}`} value={k.inPeriod ?? "–"} sub="neue Leads" delta={delta} accent={k.inPeriod > 0} />;
}

function WConversionRate({ data }) {
  const k = data.kpis;
  return <KpiCard label="Conversion-Rate" value={`${k.convRate ?? 0} %`} sub={`${k.won ?? 0} gewonnen · ${k.total ?? 0} gesamt`} />;
}

function WTopKanal({ data }) {
  const src = data.bySource?.[0];
  if (!src) return <KpiCard label="Top Kanal" value="–" sub="Noch keine Leads" />;
  return <KpiCard label="Top Kanal" value={src.source} sub={`${src.count} Leads`} accent />;
}

function WLeadsNachKanal({ data }) {
  const rows = data.bySource || [];
  const max  = rows.length > 0 ? Math.max(...rows.map(r => r.count)) : 1;
  return (
    <Card label="Leads nach Kanal" cols={2}>
      {rows.length === 0 ? <Empty /> : rows.map(({ source, count }) => (
        <div key={source} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>{source}</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{count}</span>
          </div>
          <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: 6, width: `${Math.round((count / max) * 100)}%`, background: SRC_COLOR[source] || "var(--ink)", borderRadius: 99, transition: "width .4s ease" }} />
          </div>
        </div>
      ))}
    </Card>
  );
}

function WPipelineStatus({ data }) {
  const rows = data.byStatus || [];
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <Card label="Pipeline nach Status" cols={2}>
      {rows.length === 0 ? <Empty /> : (
        <>
          <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
            {rows.map(({ status, count }) => (
              <div key={status} title={`${ST_LABEL[status] || status}: ${count}`}
                style={{ flex: count, background: ST_COLOR[status] || "#94a3b8" }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {rows.map(({ status, count }) => (
              <div key={status} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99,
                background: (ST_COLOR[status] || "#94a3b8") + "18", border: `1.5px solid ${ST_COLOR[status] || "#94a3b8"}` }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: ST_COLOR[status] || "#94a3b8", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>{ST_LABEL[status] || status}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)" }}>{count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function WLeadsTrend({ data, periodLabel }) {
  return (
    <Card label={`Lead-Trend · ${periodLabel}`} cols={4}>
      <TrendChart data={data.trend} />
    </Card>
  );
}

function WLandingpagePerf({ data }) {
  const items = data.landingPages?.items || [];
  return (
    <Card label="LP Performance · Conversion-Tracking" cols={4}>
      {items.length === 0 ? <Empty text="Noch keine Landing Pages" /> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Seite","Status","Aufrufe","Formular","Leads","Conv.-Rate"].map(h => (
                <th key={h} style={{ padding: "7px 10px", textAlign: h === "Seite" || h === "Status" ? "left" : "right", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(lp => (
              <tr key={lp.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "9px 10px" }}>
                  <a href={`/lp/${lp.slug}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", textDecoration: "none" }}
                    onMouseEnter={e => e.target.style.textDecoration="underline"}
                    onMouseLeave={e => e.target.style.textDecoration="none"}>
                    {lp.name}
                  </a>
                </td>
                <td style={{ padding: "9px 10px" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                    background: lp.status === "published" ? "#dcfce7" : "#f3f4f6",
                    color: lp.status === "published" ? "#16a34a" : "#6b7280" }}>
                    {lp.status === "published" ? "Live" : "Entwurf"}
                  </span>
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>{lp.page_views.toLocaleString("de")}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>{lp.form_submissions.toLocaleString("de")}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>{lp.leads_count.toLocaleString("de")}</td>
                <td style={{ padding: "9px 10px", textAlign: "right" }}>
                  {lp.conv_rate !== null
                    ? <span style={{ fontSize: 13, fontWeight: 800, color: lp.conv_rate >= 5 ? "#16a34a" : lp.conv_rate >= 2 ? "var(--accent)" : "var(--ink)" }}>{lp.conv_rate} %</span>
                    : <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>–</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function WAdsPlaceholder() {
  return (
    <Card cols={2}>
      <div style={{ textAlign: "center", padding: "16px 0", opacity: 0.5 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Werbung / Supermetrics</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Spend, Impressionen, CTR, Cost-per-Lead</div>
        <div style={{ marginTop: 12, fontSize: 11, padding: "4px 12px", display: "inline-block", borderRadius: 99, background: "var(--border)", color: "var(--text-tertiary)", fontWeight: 700 }}>
          SUPERMETRICS_API_KEY hinterlegen
        </div>
      </div>
    </Card>
  );
}

/* ── Widget-Map ────────────────────────────────────────────── */
function renderWidget(key, data, periodLabel) {
  switch (key) {
    case "leads_gesamt":            return <WLeadsGesamt      key={key} data={data} />;
    case "leads_neu_monat":         return <WLeadsNeu         key={key} data={data} periodLabel={periodLabel} />;
    case "conversion_rate":         return <WConversionRate   key={key} data={data} />;
    case "top_kanal":               return <WTopKanal         key={key} data={data} />;
    case "leads_nach_kanal":        return <WLeadsNachKanal   key={key} data={data} />;
    case "pipeline_nach_status":    return <WPipelineStatus   key={key} data={data} />;
    case "leads_trend":             return <WLeadsTrend       key={key} data={data} periodLabel={periodLabel} />;
    case "landingpage_performance": return <WLandingpagePerf  key={key} data={data} />;
    case "ads_spend":               return <WAdsPlaceholder   key={key} />;
    default: return null;
  }
}

/* ── Haupt-Komponente ──────────────────────────────────────── */
export default function TrackingDashboard({ data, widgets = DEFAULT_WIDGETS, periodLabel = "Zeitraum" }) {
  if (!data) return (
    <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
      Kunden auswählen um das Dashboard zu laden.
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, alignItems: "start" }}>
      {widgets.map(key => renderWidget(key, data, periodLabel))}
    </div>
  );
}
