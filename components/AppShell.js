"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkSession, logout, TOKEN_KEY } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase";
const NAV = [
  { href: "/dashboard", label: "Leads"     },
  { href: "/kunden",    label: "Kunden"    },
  { href: "/outreach",  label: "Outreach"  },
  { href: "/toolbox",   label: "Toolbox"   },
  { href: "/tracking",  label: "Tracking"  },
  { href: "/analytics", label: "Analytics" },
  { href: "/import",    label: "Import"    },
];

function BotButton() {
  const [status, setStatus] = useState("idle");

  async function handleClick() {
    setStatus("running");
    try {
      const token = localStorage.getItem(TOKEN_KEY) || "";
      const res = await fetch("/api/run-bot", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      }).then(r => r.json());
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 4000);
  }

  const label       = { idle: "Bot starten", running: "Läuft…", ok: "Gestartet ✓", error: "Fehler" }[status];
  const borderColor = status === "error" ? "var(--accent)" : "var(--border-strong)";
  const textColor   = status === "error" ? "var(--accent)" : "var(--ink)";

  return (
    <button onClick={handleClick} disabled={status === "running"}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "7px 10px", border: `1px solid ${borderColor}`, borderRadius: 7,
        background: "transparent", color: textColor,
        fontSize: 13, cursor: status === "running" ? "default" : "pointer",
        textAlign: "left", transition: "border-color .2s, color .2s", opacity: status === "running" ? .5 : 1,
      }}>
      ▶ {label}
    </button>
  );
}

export default function AppShell({ children }) {
  const router = useRouter();
  const path   = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Async Session-Check — verifiziert gegen Supabase
    checkSession().then(ok => {
      if (!ok) { router.replace("/login"); return; }
      setReady(true);
    });

    // Token bei automatischem Refresh aktuell halten
    const { data: { subscription } } = supabaseBrowser().auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        localStorage.setItem(TOKEN_KEY, session.access_token);
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem(TOKEN_KEY);
        router.replace("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (!ready) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: "var(--bg)", color: "var(--ink)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50,
      }}>
        <div style={{ padding: "22px 16px 18px", borderBottom: "1px solid var(--border)" }}>
          <a href="/dashboard" style={{ textDecoration: "none" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--ink)", letterSpacing: "-.3px" }}>
              LeadOS<span style={{ color: "var(--accent)", marginLeft: 1 }}>.</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 3, letterSpacing: ".08em", textTransform: "uppercase" }}>
              Lead-Plattform
            </div>
          </a>
        </div>

        <nav style={{ flex: 1, padding: "10px 8px" }}>
          {NAV.map(({ href, label }) => {
            const active = path.startsWith(href);
            return (
              <a key={href} href={href} style={{
                display: "flex", alignItems: "center",
                padding: "8px 12px", borderRadius: 7, marginBottom: 2,
                background: active ? "var(--ink)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                textDecoration: "none", fontSize: 13, fontWeight: active ? 500 : 400,
                transition: "background .12s, color .12s",
              }}>
                {label}
              </a>
            );
          })}
        </nav>

        <div style={{ padding: "10px 8px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 2 }}>
          <BotButton />
          <button onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "7px 10px", border: "none", borderRadius: 7, background: "transparent",
              color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", textAlign: "left",
            }}>
            → Abmelden
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
