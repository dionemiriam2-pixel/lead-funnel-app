"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn, logout } from "@/lib/auth";
import {
  LayoutDashboard,
  Building2,
  Mail,
  LayoutGrid,
  TrendingUp,
  BarChart2,
  Upload,
  Play,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Leads",     Icon: LayoutDashboard },
  { href: "/kunden",    label: "Kunden",    Icon: Building2 },
  { href: "/outreach",  label: "Outreach",  Icon: Mail },
  { href: "/toolbox",   label: "Toolbox",   Icon: LayoutGrid },
  { href: "/tracking",  label: "Tracking",  Icon: TrendingUp },
  { href: "/analytics", label: "Analytics", Icon: BarChart2 },
  { href: "/import",    label: "Import",    Icon: Upload },
];

function BotButton() {
  const [status, setStatus] = useState("idle");

  async function handleClick() {
    setStatus("running");
    try {
      const pw = typeof window !== "undefined" ? localStorage.getItem("lf_auth_pw") || "" : "";
      const res = await fetch("/api/run-bot", {
        method: "POST",
        headers: { "x-pw": pw, "Content-Type": "application/json" },
      }).then(r => r.json());
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 4000);
  }

  const label = { idle: "Bot starten", running: "Läuft…", ok: "Gestartet", error: "Fehler" }[status];
  const color = status === "ok" ? "rgba(34,197,94,.25)" : status === "error" ? "rgba(200,50,44,.25)" : "transparent";

  return (
    <button onClick={handleClick} disabled={status === "running"}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "7px 10px", border: "none", borderRadius: 7,
        background: color, color: "rgba(255,255,255,.55)",
        fontSize: 13, cursor: status === "running" ? "default" : "pointer",
        textAlign: "left", transition: "background .2s, color .2s",
      }}>
      <Play size={15} strokeWidth={1.5} />
      {label}
    </button>
  );
}

export default function AppShell({ children }) {
  const router   = useRouter();
  const path     = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: "var(--ink)", color: "#fff",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50,
      }}>
        {/* Wortmarke */}
        <div style={{ padding: "22px 16px 18px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "#fff", letterSpacing: "-.3px" }}>
            LeadOS<span style={{ color: "var(--accent)", marginLeft: 1 }}>.</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 3, letterSpacing: ".08em", textTransform: "uppercase" }}>
            Lead-Plattform
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "10px 8px" }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = path.startsWith(href);
            return (
              <a key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "8px 10px", borderRadius: 7, marginBottom: 2,
                background: active ? "rgba(255,255,255,.12)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,.55)",
                textDecoration: "none", fontSize: 13, fontWeight: active ? 500 : 400,
                transition: "background .12s, color .12s",
              }}>
                <Icon size={16} strokeWidth={1.5} />
                {label}
              </a>
            );
          })}
        </nav>

        {/* Unten */}
        <div style={{ padding: "10px 8px 16px", borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", flexDirection: "column", gap: 2 }}>
          <BotButton />
          <button onClick={() => { logout(); router.replace("/login"); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "7px 10px", border: "none", borderRadius: 7, background: "transparent",
              color: "rgba(255,255,255,.45)", fontSize: 13, cursor: "pointer", textAlign: "left",
            }}>
            <LogOut size={15} strokeWidth={1.5} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
