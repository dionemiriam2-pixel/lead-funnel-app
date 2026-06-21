"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import LeadsDigest from "@/components/LeadsDigest";

/* ── Kanal-Badge-Farben ────────────────────────────────────── */
const SRC = {
  landingpage: { bg: "#dcfce7", color: "#16a34a" },
  whatsapp:    { bg: "#dcfce7", color: "#15803d" },
  messenger:   { bg: "#dbeafe", color: "#1d4ed8" },
  instagram:   { bg: "#fce7f3", color: "#be185d" },
  manuell:     { bg: "#f3f4f6", color: "#6b7280" },
  phone:       { bg: "#fef9c3", color: "#854d0e" },
  empfehlung:  { bg: "#ede9fe", color: "#7c3aed" },
};
function srcStyle(s) { return SRC[s] || { bg: "#f3f4f6", color: "#6b7280" }; }

function SourceBadge({ src }) {
  const st = srcStyle(src);
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>
      {src || "unbekannt"}
    </span>
  );
}

/* ── Pipeline-Farben ───────────────────────────────────────── */
const PS_COLOR = { neu:"#94a3b8", kontaktiert:"#64748b", angebot:"#334155", gewonnen:"#16a34a", verloren:"#dc2626" };

export default function DashboardPage() {
  const router   = useRouter();
  const [leads,   setLeads]   = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [lr, cr] = await Promise.all([
      apiFetch("/api/leads"),
      apiFetch("/api/clients"),
    ]);
    setLeads(lr.data   || []);
    setClients(cr.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const now     = new Date();
  const since24 = new Date(now - 86400000).toISOString();
  const since7d = new Date(now - 7 * 86400000).toISOString();

  const newToday   = leads.filter(l => l.created_at > since24);
  const thisWeek   = leads.filter(l => l.created_at > since7d);
  const hotLeads   = leads.filter(l => (l.score || 0) >= 7);
  const recentFeed = [...leads].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 12);

  /* Leads pro Kunde */
  const leadsPerClient = {};
  leads.forEach(l => { if (l.client_id) leadsPerClient[l.client_id] = (leadsPerClient[l.client_id] || 0) + 1; });

  const greeting = now.getHours() < 12 ? "Guten Morgen" : now.getHours() < 18 ? "Guten Tag" : "Guten Abend";
  const dateStr  = now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  const S = {
    card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 },
    label: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", marginBottom: 8, display: "block" },
  };

  if (loading) return (
    <AppShell>
      <div style={{ padding: "60px 32px", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>Lade…</div>
    </AppShell>
  );

  return (
    <AppShell>
      <div style={{ padding: "28px 32px", maxWidth: 1200 }}>

        {/* ── Greeting ───────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 500, color: "var(--ink)", margin: 0, lineHeight: 1.2 }}>
            {greeting}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>{dateStr}</p>
        </div>

        {/* ── KPI-Streifen ───────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Kunden",      val: clients.length,  sub: "aktiv",      hi: false },
            { label: "Neu heute",   val: newToday.length, sub: "letzte 24h", hi: newToday.length > 0 },
            { label: "Diese Woche", val: thisWeek.length, sub: "neue Leads", hi: false },
            { label: "Hot Leads",   val: hotLeads.length, sub: "Score ≥ 7",  hi: hotLeads.length > 0 },
          ].map(({ label, val, sub, hi }) => (
            <div key={label} style={{ ...S.card, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: hi ? "var(--accent)" : "var(--text-tertiary)" }}>{label}</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, color: hi && val > 0 ? "var(--accent)" : "var(--ink)", marginBottom: 4 }}>{val}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: ".06em" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Leads-Digest ───────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <LeadsDigest />
        </div>

        {/* ── Zwei Spalten ───────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

          {/* Linke Spalte: Lead-Feed ─────────────────────────── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 500, color: "var(--ink)", margin: 0 }}>
                Eingehende Leads
              </h2>
              {newToday.length > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: "var(--accent)", color: "#fff" }}>
                  {newToday.length} neu heute
                </span>
              )}
            </div>

            <div style={{ ...S.card, overflow: "hidden" }}>
              {recentFeed.length === 0 ? (
                <div style={{ padding: "48px 32px", textAlign: "center" }}>
                    <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Noch keine Leads</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
                    Leads kommen über Landing Pages, WhatsApp, Messenger oder manuell herein.
                  </div>
                  <button onClick={() => router.push("/kunden")}
                    style={{ padding: "10px 20px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Kunden & Kanäle einrichten →
                  </button>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Kontakt", "Kanal", "Kunde", "Score", "Status", "Eingang"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentFeed.map(l => {
                      const isNew = l.created_at > since24;
                      const cl    = clients.find(c => c.id === l.client_id);
                      const ps    = l.pipeline_status || "neu";
                      return (
                        <tr key={l.id} onClick={() => l.client_id && router.push(`/kunden/${l.client_id}?tab=Leads`)}
                          style={{ borderTop: "1px solid var(--border)", cursor: l.client_id ? "pointer" : "default", background: isNew ? "#fffbf5" : "transparent" }}
                          onMouseEnter={e => e.currentTarget.style.background = isNew ? "#fff7ed" : "var(--bg)"}
                          onMouseLeave={e => e.currentTarget.style.background = isNew ? "#fffbf5" : "transparent"}>
                          <td style={{ padding: "11px 14px" }}>
                            {isNew && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginRight: 6, verticalAlign: "middle" }} />}
                            <span style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)" }}>{l.company_name || l.contact_name || "–"}</span>
                            {(l.phone || l.email) && (
                              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>{l.phone || l.email}</div>
                            )}
                          </td>
                          <td style={{ padding: "11px 14px" }}><SourceBadge src={l.source} /></td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{cl?.name || "–"}</td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: (l.score||0) >= 7 ? "var(--ink)" : "var(--border)", color: (l.score||0) >= 7 ? "#fff" : "var(--text-tertiary)" }}>
                              {l.score ?? "–"}
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 99, background: PS_COLOR[ps] + "22", color: PS_COLOR[ps] }}>
                              {ps}
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                            {l.created_at ? new Date(l.created_at).toLocaleString("de-DE", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }) : "–"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Rechte Spalte ────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Schnellaktionen */}
            <div style={S.card}>
              <div style={{ padding: "16px 18px 10px" }}>
                <span style={S.label}>Schnellaktionen</span>
              </div>
              {[
                { label: "Alle Kunden",      sub: `${clients.length} Kunden`, href: "/kunden" },
                { label: "Outreach starten", sub: "E-Mail / LinkedIn",        href: "/outreach" },
                { label: "Toolbox",          sub: "Bot & Scraping",           href: "/toolbox" },
                { label: "Analytics",        sub: "Auswertungen",             href: "/analytics" },
              ].map(({ label, sub, href }) => (
                <button key={label} onClick={() => router.push(href)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", border: "none", borderTop: "1px solid var(--border)", background: "transparent", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", display: "block" }}>{label}</span>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{sub}</span>
                  </span>
                  <span style={{ color: "var(--text-tertiary)" }}>›</span>
                </button>
              ))}
            </div>

            {/* Kunden-Karten */}
            <div style={S.card}>
              <div style={{ padding: "16px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={S.label}>Kunden</span>
                <button onClick={() => router.push("/kunden")}
                  style={{ fontSize: 11, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  Alle →
                </button>
              </div>
              {clients.length === 0 ? (
                <div style={{ padding: "16px 18px", fontSize: 13, color: "var(--text-secondary)" }}>Noch keine Kunden angelegt.</div>
              ) : (
                clients.slice(0, 6).map(c => (
                  <button key={c.id} onClick={() => router.push(`/kunden/${c.id}`)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", border: "none", borderTop: "1px solid var(--border)", background: "transparent", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      {(c.name || "?")[0].toUpperCase()}
                    </div>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                        {leadsPerClient[c.id] || 0} Lead{leadsPerClient[c.id] !== 1 ? "s" : ""}
                        {c.industry ? ` · ${c.industry}` : ""}
                      </span>
                    </span>
                    <span style={{ color: "var(--text-tertiary)" }}>›</span>
                  </button>
                ))
              )}
              <button onClick={() => router.push("/kunden")}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 18px", border: "none", borderTop: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>
                + Neuen Kunden anlegen
              </button>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
