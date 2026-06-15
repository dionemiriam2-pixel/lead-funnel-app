"use client";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { MapPin, Mail, Monitor, Link2, Search } from "lucide-react";

const TOOLS = [
  {
    key: "bot",
    Icon: MapPin,
    label: "Lead-Bot / Google Maps",
    desc: "Firmen automatisch finden — Suchaufträge verwalten und Bot starten",
    href: "/kunden",
    active: true,
  },
  {
    key: "outreach",
    Icon: Mail,
    label: "E-Mail Outreach",
    desc: "KI schreibt personalisierte Angebote, Follow-up-Sequenzen starten",
    href: "/outreach",
    active: true,
  },
  {
    key: "lp",
    Icon: Monitor,
    label: "Landing Pages",
    desc: "Öffentliche Landing Pages für deine Kunden ansehen",
    href: "/lp/ladenbau-muenchen",
    active: true,
  },
  {
    key: "linkedin",
    Icon: Link2,
    label: "LinkedIn",
    desc: "Sales Navigator, automatische Vernetzung, DM-Sequenzen",
    active: false,
  },
  {
    key: "scraper",
    Icon: Search,
    label: "Webseiten-Scraper",
    desc: "Kontaktdaten direkt von Websites extrahieren",
    active: false,
  },
];

export default function ToolboxPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0 }}>Toolbox</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>Alle Werkzeuge auf einen Blick — Leads finden, ansprechen, konvertieren</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {TOOLS.map(tool => (
            <div
              key={tool.key}
              onClick={() => tool.active && tool.href && router.push(tool.href)}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "22px 18px",
                cursor: tool.active ? "pointer" : "default",
                opacity: tool.active ? 1 : 0.45,
                textAlign: "center",
                transition: "border-color .15s",
                position: "relative",
              }}
              onMouseEnter={e => { if (tool.active) e.currentTarget.style.borderColor = "var(--border-strong)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              {!tool.active && (
                <div style={{ position: "absolute", top: 10, right: 10, fontSize: 10, fontWeight: 700, background: "var(--border)", color: "var(--text-tertiary)", padding: "2px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".04em" }}>
                  Bald verfügbar
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <tool.Icon size={28} strokeWidth={1.5} color={tool.active ? "var(--ink)" : "var(--text-tertiary)"} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 6 }}>{tool.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{tool.desc}</div>
              {tool.active && (
                <div style={{ marginTop: 14, fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>Öffnen →</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
