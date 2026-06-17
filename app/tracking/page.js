"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import TrackingDashboard, { DEFAULT_WIDGETS } from "@/components/TrackingDashboard";

const PERIODS = [
  { value: "this_month",  label: "Dieser Monat"  },
  { value: "last_month",  label: "Letzter Monat" },
  { value: "30d",         label: "30 Tage"        },
];

export default function TrackingPage() {
  const [clients,   setClients]  = useState([]);
  const [clientId,  setClientId] = useState(null);
  const [period,    setPeriod]   = useState("this_month");
  const [data,      setData]     = useState(null);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState(null);

  /* ── Kunden laden ──────────────────────────────────────────── */
  useEffect(() => {
    apiFetch("/api/clients")
      .then(json => {
        const rows = json?.data || json || [];
        setClients(rows);
        if (rows?.length) setClientId(rows[0].id);
      })
      .catch(() => {});
  }, []);

  /* ── KPI-Daten laden ───────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const json = await apiFetch(`/api/dashboard/kpis?client_id=${clientId}&period=${period}`);
      if (json?.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Aktiver Kunde ─────────────────────────────────────────── */
  const activeClient = clients.find(c => c.id === clientId);
  const widgets = activeClient?.dashboard_config?.widgets || DEFAULT_WIDGETS;
  const periodLabel = PERIODS.find(p => p.value === period)?.label || period;

  return (
    <AppShell>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* ── Kopfzeile ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>Tracking</h1>
            {activeClient && (
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>
                {activeClient.name}
              </div>
            )}
          </div>

          {/* Perioden-Toggle */}
          <div style={{ display: "flex", gap: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .15s",
                  background: period === p.value ? "var(--ink)" : "transparent",
                  color:      period === p.value ? "#fff" : "var(--text-secondary)" }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Kunden-Selector ────────────────────────────────── */}
        {clients.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {clients.map(c => (
              <button key={c.id} onClick={() => setClientId(c.id)}
                style={{ padding: "7px 16px", borderRadius: 99, border: "1.5px solid", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all .15s",
                  borderColor:      c.id === clientId ? "var(--accent)" : "var(--border)",
                  background:       c.id === clientId ? "var(--accent)" : "var(--surface)",
                  color:            c.id === clientId ? "#fff" : "var(--ink)" }}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* ── State: Kein Kunde ausgewählt ───────────────────── */}
        {!clientId && (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            Kunden auswählen, um das Dashboard zu laden.
          </div>
        )}

        {/* ── State: Laden ───────────────────────────────────── */}
        {clientId && loading && (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
            Daten werden geladen…
          </div>
        )}

        {/* ── State: Fehler ──────────────────────────────────── */}
        {clientId && !loading && error && (
          <div style={{ padding: "24px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>
            Fehler beim Laden: {error}
          </div>
        )}

        {/* ── Dashboard ──────────────────────────────────────── */}
        {clientId && !loading && !error && (
          <TrackingDashboard data={data} widgets={widgets} periodLabel={periodLabel} />
        )}
      </div>
    </AppShell>
  );
}
