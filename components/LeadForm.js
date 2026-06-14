"use client";
import { useState } from "react";

export default function LeadForm({ lp }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setSending(true);
    setMsg("Wird gesendet …");
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          lp: lp.slug,
          client: lp.client,
          industry: lp.industry,
        }),
      });
      const res = await r.json();
      if (res.ok) {
        setMsg("✓ Danke! Wir melden uns in Kürze.");
        form.reset();
      } else {
        setMsg("Fehler: " + (res.error || "unbekannt"));
      }
    } catch (err) {
      setMsg("Fehler beim Senden.");
    }
    setSending(false);
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input name="name" placeholder="Dein Name" required style={inp} />
      <input name="email" type="email" placeholder="E-Mail" required style={inp} />
      <input name="phone" placeholder="Telefon (optional)" style={inp} />
      <input name="company" placeholder="Firma (optional)" style={inp} />
      {/* Honeypot gegen Spam – bleibt unsichtbar */}
      <input name="website_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999 }} />
      <button type="submit" disabled={sending} style={btn}>
        {sending ? "…" : lp.cta || "Jetzt anfordern"}
      </button>
      <div style={{ fontSize: 14, minHeight: 18, color: msg.startsWith("✓") ? "#15803d" : "#b91c1c" }}>{msg}</div>
    </form>
  );
}

const inp = { padding: "12px 13px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15 };
const btn = { padding: 13, background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" };
