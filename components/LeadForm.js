"use client";
import { useState } from "react";

const TOTAL = 3;

export default function LeadForm({ lp }) {
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState("");
  const [fields, setFields] = useState({ name: "", company: "", email: "", phone: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const intents = lp.intents || ["Neueröffnung planen", "Bestandsgeschäft umbauen", "Erstberatung anfragen"];

  function set(k, v) { setFields(f => ({ ...f, [k]: v })); }

  async function submit() {
    setSending(true);
    setErr("");
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name,
          email: fields.email,
          phone: fields.phone,
          company: fields.company,
          notes: "Vorhaben: " + intent,
          lp: lp.slug,
          client: lp.client,
          industry: lp.industry,
        }),
      });
      const res = await r.json();
      if (res.ok) { setDone(true); }
      else { setErr(res.error || "Fehler beim Senden."); }
    } catch { setErr("Verbindungsfehler. Bitte nochmals versuchen."); }
    setSending(false);
  }

  // ── Progress bar ──────────────────────────────────────────────
  const pct = Math.round((step / TOTAL) * 100);

  if (done) return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <h3 style={{ fontSize: 20, marginBottom: 8, color: "#111827" }}>Danke – wir melden uns!</h3>
      <p style={{ color: "#6b7280", fontSize: 15 }}>Du erhältst in Kürze eine Nachricht von uns.</p>
    </div>
  );

  return (
    <div>
      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#6b7280" }}>
          <span>Schritt {step} von {TOTAL}</span>
          <span>{pct}% abgeschlossen</span>
        </div>
        <div style={{ height: 6, background: "#e5e7eb", borderRadius: 999 }}>
          <div style={{ height: 6, width: pct + "%", background: "linear-gradient(90deg,#2563eb,#0ea5e9)", borderRadius: 999, transition: "width .35s ease" }} />
        </div>
      </div>

      {/* Step 1 – Intent */}
      {step === 1 && (
        <div>
          <p style={{ fontWeight: 700, marginBottom: 14, color: "#111827", fontSize: 15 }}>
            Was planst du? (Schritt 1)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {intents.map(opt => (
              <button key={opt} onClick={() => { setIntent(opt); setStep(2); }}
                style={{
                  padding: "13px 16px", border: "2px solid " + (intent === opt ? "#2563eb" : "#e5e7eb"),
                  borderRadius: 10, background: intent === opt ? "#eff6ff" : "#fff",
                  color: "#111827", fontSize: 15, textAlign: "left", cursor: "pointer",
                  fontWeight: intent === opt ? 700 : 400, transition: "all .15s",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid " + (intent === opt ? "#2563eb" : "#d1d5db"), background: intent === opt ? "#2563eb" : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {intent === opt && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                </span>
                {opt}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 14 }}>Kein Spam · Kostenlos · Unverbindlich</p>
        </div>
      )}

      {/* Step 2 – Name + Firma */}
      {step === 2 && (
        <div>
          <p style={{ fontWeight: 700, marginBottom: 14, color: "#111827", fontSize: 15 }}>
            Wer bist du? (Schritt 2)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={fields.name} onChange={e => set("name", e.target.value)}
              placeholder="Dein Name *" required style={inp} />
            <input value={fields.company} onChange={e => set("company", e.target.value)}
              placeholder="Firma / Unternehmensname" style={inp} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button onClick={() => setStep(1)} style={backBtn}>← Zurück</button>
            <button onClick={() => fields.name.trim() ? setStep(3) : setErr("Bitte deinen Namen eingeben.")}
              style={nextBtn}>Weiter →</button>
          </div>
          {err && <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 8 }}>{err}</p>}
        </div>
      )}

      {/* Step 3 – Kontakt + Submit */}
      {step === 3 && (
        <div>
          <p style={{ fontWeight: 700, marginBottom: 14, color: "#111827", fontSize: 15 }}>
            Wie erreichen wir dich? (Schritt 3)
          </p>
          {/* Honeypot */}
          <input name="website_hp" tabIndex={-1} autoComplete="off" aria-hidden="true"
            style={{ position: "absolute", left: -9999 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input value={fields.email} onChange={e => set("email", e.target.value)}
              type="email" placeholder="E-Mail-Adresse *" required style={inp} />
            <input value={fields.phone} onChange={e => set("phone", e.target.value)}
              placeholder="Telefon (optional)" style={inp} />
          </div>
          {/* Trust microcopy */}
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
            🔒 Deine Daten sind sicher — wir geben sie nie weiter.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={() => setStep(2)} style={backBtn}>← Zurück</button>
            <button onClick={() => fields.email.trim() ? submit() : setErr("Bitte E-Mail eingeben.")}
              disabled={sending}
              style={{ ...nextBtn, flex: 1, background: "linear-gradient(135deg,#2563eb,#0ea5e9)", padding: 14, fontSize: 16, fontWeight: 800 }}>
              {sending ? "⏳ Wird gesendet…" : (lp.cta || "Jetzt anfragen")}
            </button>
          </div>
          {err && <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 8 }}>{err}</p>}
        </div>
      )}
    </div>
  );
}

const inp = {
  padding: "13px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10,
  fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box",
  fontFamily: "inherit",
};
const nextBtn = {
  flex: 1, padding: "13px 18px", background: "#1d4ed8", color: "#fff",
  border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
  cursor: "pointer",
};
const backBtn = {
  padding: "13px 16px", background: "#f3f4f6", color: "#374151",
  border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer",
};
