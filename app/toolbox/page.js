"use client";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";

const TOOLS = [
  {
    key: "bot",
    icon: "🗺️",
    label: "Lead-Bot / Google Maps",
    desc: "Firmen automatisch finden — Suchaufträge verwalten und Bot starten",
    href: "/kunden",
    active: true,
  },
  {
    key: "outreach",
    icon: "📧",
    label: "E-Mail Outreach",
    desc: "KI schreibt personalisierte Angebote, Follow-up-Sequenzen starten",
    href: "/outreach",
    active: true,
  },
  {
    key: "lp",
    icon: "🖥️",
    label: "Landing Pages",
    desc: "Öffentliche Landing Pages für deine Kunden ansehen",
    href: "/lp/ladenbau-muenchen",
    active: true,
  },
  {
    key: "linkedin",
    icon: "💼",
    label: "LinkedIn",
    desc: "Sales Navigator, automatische Vernetzung, DM-Sequenzen",
    active: false,
  },
  {
    key: "scraper",
    icon: "🔍",
    label: "Webseiten-Scraper",
    desc: "Kontaktdaten direkt von Websites extrahieren",
    active: false,
  },
];

export default function ToolboxPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div style={{ padding: "32px 32px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.4px" }}>Toolbox</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Alle Werkzeuge auf einen Blick — Leads finden, ansprechen, konvertieren</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {TOOLS.map(tool => (
            <div
              key={tool.key}
              onClick={() => tool.active && tool.href && router.push(tool.href)}
              style={{
                background: "#fff",
                border: `1px solid ${tool.active ? "#e5e7eb" : "#f3f4f6"}`,
                borderRadius: 14,
                padding: "22px 18px",
                cursor: tool.active ? "pointer" : "default",
                opacity: tool.active ? 1 : 0.5,
                textAlign: "center",
                transition: "border-color .15s, box-shadow .15s",
                position: "relative",
              }}
              onMouseEnter={e => { if (tool.active) { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 0 0 3px #ede9fe"; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = tool.active ? "#e5e7eb" : "#f3f4f6"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {!tool.active && (
                <div style={{ position: "absolute", top: 10, right: 10, fontSize: 10, fontWeight: 700, background: "#f3f4f6", color: "#9ca3af", padding: "2px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".04em" }}>
                  Bald verfügbar
                </div>
              )}
              <div style={{ fontSize: 32, marginBottom: 10 }}>{tool.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 6 }}>{tool.label}</div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{tool.desc}</div>
              {tool.active && (
                <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: "#6366f1" }}>Öffnen →</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
