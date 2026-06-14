"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn, logout } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "📊 Leads" },
  { href: "/kunden", label: "🏢 Kunden" },
  { href: "/analytics", label: "📈 Analytics" },
  { href: "/import", label: "📥 Import" },
];

export default function AppShell({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "#1a1a2e", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0, position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50 }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>⚡ LeadFlow</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", marginTop: 3 }}>Deine Lead-Plattform</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 12px" }}>
          {NAV.map(n => (
            <a key={n.href} href={n.href}
              style={{
                display: "block", padding: "11px 14px", borderRadius: 10, marginBottom: 4,
                color: path.startsWith(n.href) ? "#fff" : "rgba(255,255,255,.6)",
                background: path.startsWith(n.href) ? "rgba(255,255,255,.12)" : "transparent",
                textDecoration: "none", fontSize: 14, fontWeight: path.startsWith(n.href) ? 700 : 400,
                transition: "all .15s",
              }}>
              {n.label}
            </a>
          ))}
        </nav>
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <a href="/lp/ladenbau-muenchen" target="_blank"
            style={{ display: "block", padding: "9px 14px", borderRadius: 10, color: "rgba(255,255,255,.5)", fontSize: 12, textDecoration: "none", marginBottom: 6 }}>
            🔗 Landing Pages ↗
          </a>
          <button onClick={() => { logout(); router.replace("/login"); }}
            style={{ width: "100%", padding: "9px 14px", background: "rgba(255,255,255,.08)", border: "none", borderRadius: 10, color: "rgba(255,255,255,.5)", fontSize: 12, cursor: "pointer", textAlign: "left" }}>
            🚪 Abmelden
          </button>
        </div>
      </aside>
      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
