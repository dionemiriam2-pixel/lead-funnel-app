"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

/* ── Marke / CI – Markenbriefing ──────────────────────────────
   Props: form, setForm, saveClient, testimonials, addTestimonial,
          setTestimonial, removeTestimonial, refImages, addRefImage,
          setRefImage, removeRefImage
─────────────────────────────────────────────────────────────── */

/* ── Styling-Shortcuts (lokal, identisch zum Rest der App) ─── */
const S = {
  card:      { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px", marginBottom: 16 },
  label:     { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 },
  input:     { width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--ink)", background: "var(--surface)", boxSizing: "border-box", fontFamily: "inherit" },
  textarea:  { width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--ink)", background: "var(--surface)", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" },
  select:    { width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--ink)", background: "var(--surface)", cursor: "pointer" },
  btn:       { padding: "9px 20px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" },
  sectionHd: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)", marginBottom: 16, marginTop: 0 },
  divider:   { borderTop: "1px solid var(--border)", margin: "20px 0" },
  chip:      { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 99, fontSize: 12, fontWeight: 500 },
};

/* ── Farb-Picker-Zeile ─────────────────────────────────────── */
function ColorField({ label, value, onChange, placeholder = "#111111" }) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="color" value={value || placeholder}
          onChange={e => onChange(e.target.value)}
          style={{ width: 38, height: 38, border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", padding: 2, background: "var(--surface)", flexShrink: 0 }} />
        <input value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...S.input, fontFamily: "monospace", fontSize: 13 }} />
      </div>
    </div>
  );
}

/* ── Abschnitts-Kopf ───────────────────────────────────────── */
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function MarkeCITab({
  form, setForm, saveClient, clientId,
  testimonials, addTestimonial, setTestimonial, removeTestimonial,
  refImages, addRefImage, setRefImage, removeRefImage,
}) {
  const [prefilling, setPrefilling] = useState(false);
  const [prefillMsg, setPrefillMsg] = useState("");

  /* Hilfsfunktion: CI-jsonb-Feld setzen */
  const ci    = form.ci || {};
  const setCI = (key, val) => setForm(f => ({ ...f, ci: { ...(f.ci || {}), [key]: val } }));

  /* ── KI-Vorbefüllen ────────────────────────────────────────── */
  async function prefillFromAnalysis() {
    if (!clientId) return;
    setPrefilling(true);
    setPrefillMsg("");
    try {
      const res = await apiFetch("/api/ci/prefill", {
        method: "POST",
        body: JSON.stringify({ client_id: clientId }),
      });
      if (res.error) { setPrefillMsg("❌ " + res.error); return; }
      const s = res.suggestions;
      setForm(f => ({
        ...f,
        brand_color:  s.brand_color  || f.brand_color,
        accent_color: s.accent_color || f.accent_color,
        brand_font:   s.brand_font   || f.brand_font,
        body_font:    s.body_font    || f.body_font,
        ci: {
          ...(f.ci || {}),
          tonalitaet:    s.tonalitaet    || f.ci?.tonalitaet    || "",
          anrede:        s.anrede        || f.ci?.anrede        || "Sie",
          claim:         s.claim         || f.ci?.claim         || "",
          sprache_dos:   s.sprache_dos   || f.ci?.sprache_dos   || "",
          sprache_donts: s.sprache_donts || f.ci?.sprache_donts || "",
          mission:       s.mission       || f.ci?.mission       || "",
          werte:         s.werte         || f.ci?.werte         || "",
          kernbotschaften: s.kernbotschaften || f.ci?.kernbotschaften || [],
          persona:       s.persona       || f.ci?.persona       || "",
          wettbewerb:    s.wettbewerb    || f.ci?.wettbewerb    || "",
          bildstil:      s.bildstil      || f.ci?.bildstil      || "",
          ueber_uns:     s.ueber_uns     || f.ci?.ueber_uns     || "",
        },
      }));
      setPrefillMsg("✓ Vorschläge geladen — bitte prüfen und anpassen, dann Speichern klicken.");
    } catch (e) {
      setPrefillMsg("❌ Netzwerkfehler — bitte nochmal versuchen.");
    } finally {
      setPrefilling(false);
    }
  }

  /* Kernbotschaften (Array in ci.kernbotschaften) */
  const kernbotschaften = Array.isArray(ci.kernbotschaften) ? ci.kernbotschaften : [];
  const addKern    = ()       => setCI("kernbotschaften", [...kernbotschaften, ""]);
  const setKern    = (i, val) => { const a = [...kernbotschaften]; a[i] = val; setCI("kernbotschaften", a); };
  const removeKern = (i)      => setCI("kernbotschaften", kernbotschaften.filter((_, j) => j !== i));

  /* Werte (kommagetrennt oder Freitext) */
  const werte = ci.werte || "";

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div>

      {/* ══════════ KI-VORBEFÜLLEN ════════════════════════════ */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 3 }}>
            Aus Website-Analyse vorbefüllen
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            KI liest deine Website-Daten und schlägt Farben, Tonalität, USP, Mission und Texte vor — du kannst alles anpassen.
          </div>
          {prefillMsg && (
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: prefillMsg.startsWith("✓") ? "#15803d" : "var(--accent)" }}>
              {prefillMsg}
            </div>
          )}
        </div>
        <button onClick={prefillFromAnalysis} disabled={prefilling}
          style={{ padding: "9px 20px", background: prefilling ? "var(--border)" : "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: prefilling ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
          {prefilling ? "Analysiert…" : "Jetzt vorbefüllen"}
        </button>
      </div>

      {/* ══════════ BLOCK 1: VISUELL ══════════════════════════ */}
      <div style={S.card}>
        <SectionHeader title="Visuell" sub="Farben, Logo, Schrift — Basis aller Generatoren" />

        {/* Farben */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 18 }}>
          <ColorField
            label="Hauptfarbe"
            value={form.brand_color}
            onChange={v => setForm(f => ({ ...f, brand_color: v }))}
            placeholder="#111111"
          />
          <ColorField
            label="Akzentfarbe"
            value={form.accent_color}
            onChange={v => setForm(f => ({ ...f, accent_color: v }))}
            placeholder="#e8600a"
          />
          <ColorField
            label="Sekundärfarbe"
            value={form.color_secondary}
            onChange={v => setForm(f => ({ ...f, color_secondary: v }))}
            placeholder="#f5f5f0"
          />
        </div>

        {/* Schriften */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <div>
            <label style={S.label}>Headline-Schrift (Brand Font)</label>
            <input value={form.brand_font || ""}
              onChange={e => setForm(f => ({ ...f, brand_font: e.target.value }))}
              placeholder="z. B. Playfair Display, Sora, Inter"
              style={S.input} />
            {form.brand_font && (
              <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700, color: "var(--text-secondary)" }}
                   data-preview-font={form.brand_font}>
                {form.brand_font}
              </div>
            )}
          </div>
          <div>
            <label style={S.label}>Fließtext-Schrift (Body Font)</label>
            <input value={form.body_font || ""}
              onChange={e => setForm(f => ({ ...f, body_font: e.target.value }))}
              placeholder="z. B. Inter, Lato, Georgia"
              style={S.input} />
          </div>
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 18 }}>
          <label style={S.label}>Logo-URL</label>
          <input value={form.logo_url || ""}
            onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
            placeholder="https://…/logo.png"
            style={{ ...S.input, fontFamily: "monospace", fontSize: 13 }} />
          {form.logo_url && (
            <img src={form.logo_url} alt="Logo-Vorschau"
              onError={e => e.target.style.display = "none"}
              style={{ marginTop: 8, maxHeight: 56, maxWidth: 200, objectFit: "contain", borderRadius: 6, border: "1px solid var(--border)", padding: 6, background: "#fff" }} />
          )}
        </div>

        {/* Bildstil */}
        <div>
          <label style={S.label}>Bildstil / Foto-Richtlinie</label>
          <textarea value={ci.bildstil || ""}
            onChange={e => setCI("bildstil", e.target.value)}
            rows={3}
            placeholder="z. B. Helle, natürliche Fotos · Keine Stock-Bilder · Echte Mitarbeiter und Baustellen · Warme Erdtöne"
            style={S.textarea} />
        </div>

        <div style={{ marginTop: 16 }}>
          <button onClick={() => saveClient()} style={S.btn}>Speichern</button>
        </div>
      </div>

      {/* ══════════ BLOCK 2: SPRACHE / TON ════════════════════ */}
      <div style={S.card}>
        <SectionHeader title="Sprache & Ton" sub="Wie das Unternehmen kommuniziert — für Content und Texte" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Anrede */}
          <div>
            <label style={S.label}>Anrede</label>
            <select value={ci.anrede || "Sie"}
              onChange={e => setCI("anrede", e.target.value)}
              style={S.select}>
              <option value="Sie">Formell — Sie</option>
              <option value="du">Persönlich — du</option>
            </select>
          </div>

          {/* Tonalität */}
          <div>
            <label style={S.label}>Tonalität</label>
            <select value={ci.tonalitaet || ""}
              onChange={e => setCI("tonalitaet", e.target.value)}
              style={S.select}>
              <option value="">— wählen —</option>
              <option value="professionell">Professionell & seriös</option>
              <option value="persoenlich">Persönlich & nah</option>
              <option value="freundlich">Freundlich & locker</option>
              <option value="direkt">Direkt & klar</option>
              <option value="inspirierend">Inspirierend & emotional</option>
              <option value="humorvoll">Humorvoll & entspannt</option>
            </select>
          </div>
        </div>

        {/* Claim */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Claim / Slogan</label>
          <input value={ci.claim || ""}
            onChange={e => setCI("claim", e.target.value)}
            placeholder={'z. B. Qualitaet, die ueberzeugt. oder: Dein Partner fuer mehr Sichtbarkeit.'}
            style={S.input} />
        </div>

        {/* Dos & Don'ts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={S.label}>
              <span style={{ color: "#16a34a" }}>✓</span> Sprach-Dos — was wir immer sagen
            </label>
            <textarea value={ci.sprache_dos || ""}
              onChange={e => setCI("sprache_dos", e.target.value)}
              rows={4}
              placeholder={"z. B.:\n– Einfache, klare Sätze\n– Vorteile aus Kundensicht\n– Lokale Bezüge (Region)"}
              style={S.textarea} />
          </div>
          <div>
            <label style={S.label}>
              <span style={{ color: "#dc2626" }}>✕</span> Sprach-Don'ts — was wir nie sagen
            </label>
            <textarea value={ci.sprache_donts || ""}
              onChange={e => setCI("sprache_donts", e.target.value)}
              rows={4}
              placeholder={"z. B.:\n– Keine Buzzwords (synergetisch…)\n– Kein Passiv-Stil\n– Keine übertriebenen Versprechen"}
              style={S.textarea} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button onClick={() => saveClient()} style={S.btn}>Speichern</button>
        </div>
      </div>

      {/* ══════════ BLOCK 3: POSITIONIERUNG ═══════════════════ */}
      <div style={S.card}>
        <SectionHeader title="Positionierung" sub="USP, Mission, Werte, Zielgruppe, Wettbewerb" />

        {/* Mission */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Mission / Warum existiert das Unternehmen?</label>
          <textarea value={ci.mission || ""}
            onChange={e => setCI("mission", e.target.value)}
            rows={3}
            placeholder={'z. B. Wir machen Handwerksbetriebe sichtbar, damit gute Arbeit gerecht belohnt wird.'}
            style={S.textarea} />
        </div>

        {/* Werte */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Unternehmenswerte (kommagetrennt oder als Sätze)</label>
          <textarea value={werte}
            onChange={e => setCI("werte", e.target.value)}
            rows={2}
            placeholder="z. B. Verlässlichkeit, Qualität, Transparenz, Regionalität"
            style={S.textarea} />
          {werte && (
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {werte.split(",").map(v => v.trim()).filter(Boolean).map((v, i) => (
                <span key={i} style={{ ...S.chip, color: "var(--ink)" }}>✦ {v}</span>
              ))}
            </div>
          )}
        </div>

        {/* Kernbotschaften */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <label style={{ ...S.label, margin: 0 }}>Kernbotschaften</label>
            <button onClick={addKern}
              style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 8, border: "1.5px solid var(--ink)", background: "transparent", color: "var(--ink)", cursor: "pointer" }}>
              + Botschaft
            </button>
          </div>
          {kernbotschaften.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "12px 14px", background: "var(--bg)", borderRadius: 8, border: "1px dashed var(--border)" }}>
              Noch keine Kernbotschaften — "Botschaft" klicken.
            </div>
          )}
          {kernbotschaften.map((k, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
              <input value={k}
                onChange={e => setKern(i, e.target.value)}
                placeholder={`Kernbotschaft ${i + 1} — was Kunden über uns denken sollen`}
                style={{ ...S.input, flex: 1 }} />
              <button onClick={() => removeKern(i)}
                style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 16, flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>

        {/* Persona */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>Zielgruppe / Buyer Persona</label>
          <textarea value={ci.persona || ""}
            onChange={e => setCI("persona", e.target.value)}
            rows={3}
            placeholder={"z. B.:\nAlter: 35–55 · Selbstständig oder KMU-Inhaber · Sucht zuverlässige Partner · Preisorientiert aber qualitätsbewusst · Hat wenig Zeit für Recherche"}
            style={S.textarea} />
        </div>

        {/* Wettbewerb */}
        <div>
          <label style={S.label}>Wettbewerb / Differenzierung</label>
          <textarea value={ci.wettbewerb || ""}
            onChange={e => setCI("wettbewerb", e.target.value)}
            rows={3}
            placeholder="z. B. Hauptwettbewerber: XY GmbH · Unser Unterschied: Persönlicher Ansprechpartner, 24h-Reaktionszeit, Festpreisgarantie"
            style={S.textarea} />
        </div>

        <div style={{ marginTop: 16 }}>
          <button onClick={() => saveClient()} style={S.btn}>Speichern</button>
        </div>
      </div>

      {/* ══════════ BLOCK 4: INHALTE ══════════════════════════ */}
      <div style={S.card}>
        <SectionHeader title="Inhalte" sub="Über-uns, Angebot, Garantie, Testimonials, Referenzbilder" />

        {/* Über uns */}
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>Über uns — Unternehmensgeschichte & Hintergrund</label>
          <textarea value={ci.ueber_uns || ""}
            onChange={e => setCI("ueber_uns", e.target.value)}
            rows={5}
            placeholder={"z. B.:\nSeit 2008 helfen wir Handwerksbetrieben in der Region München, online gefunden zu werden. Gegründet von Max Muster, selbst Malermeister, der die Probleme der Branche aus eigener Erfahrung kennt…"}
            style={S.textarea} />
        </div>

        {/* Lead-Magnet & Garantie */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={S.label}>Angebot / Lead-Magnet</label>
            <textarea value={form.lead_magnet || ""}
              onChange={e => setForm(f => ({ ...f, lead_magnet: e.target.value }))}
              rows={3}
              placeholder="z. B. Kostenlose Erstberatung (30 Min.), Gratis-Checkliste, Kostenloser Website-Check, …"
              style={S.textarea} />
          </div>
          <div>
            <label style={S.label}>Garantie / Versprechen</label>
            <textarea value={form.garantie || ""}
              onChange={e => setForm(f => ({ ...f, garantie: e.target.value }))}
              rows={3}
              placeholder="z. B. 30-Tage-Geld-zurück, Kostenlose Nachbesserung, Festpreisgarantie, …"
              style={S.textarea} />
          </div>
        </div>

        {/* Testimonials */}
        <div style={S.divider} />
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Kundenstimmen / Testimonials</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>Erscheinen auf Landing Pages als sozialer Beweis</div>
            </div>
            <button onClick={addTestimonial}
              style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 8, border: "1.5px solid var(--ink)", background: "transparent", color: "var(--ink)", cursor: "pointer" }}>
              + Zeuge
            </button>
          </div>
          {testimonials.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "14px 16px", background: "var(--bg)", borderRadius: 8, border: "1px dashed var(--border)" }}>
              Noch keine Testimonials — „Zeuge" klicken zum Hinzufügen.
            </div>
          )}
          {testimonials.map((t, i) => (
            <div key={i} style={{ padding: "14px 16px", background: "var(--bg)", borderRadius: 10, marginBottom: 10, border: "1px solid var(--border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "start", marginBottom: 10 }}>
                <div>
                  <label style={S.label}>Name</label>
                  <input value={t.name || ""} onChange={e => setTestimonial(i, "name", e.target.value)} placeholder="Max Mustermann" style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Firma (optional)</label>
                  <input value={t.firma || ""} onChange={e => setTestimonial(i, "firma", e.target.value)} placeholder="Muster GmbH" style={S.input} />
                </div>
                <button onClick={() => removeTestimonial(i)}
                  style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", marginTop: 20, fontSize: 16 }}>✕</button>
              </div>
              <div>
                <label style={S.label}>Zitat / Text</label>
                <textarea value={t.text || ""} onChange={e => setTestimonial(i, "text", e.target.value)} rows={2}
                  placeholder={'Sehr professionell und schnell – absolut empfehlenswert!'}
                  style={S.textarea} />
              </div>
            </div>
          ))}
        </div>

        {/* Referenz-Bilder */}
        <div style={S.divider} />
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Referenzbilder / Vorher-Nachher</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>Bilderslider auf der Landing Page</div>
            </div>
            <button onClick={addRefImage}
              style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 8, border: "1.5px solid var(--ink)", background: "transparent", color: "var(--ink)", cursor: "pointer" }}>
              + Bild
            </button>
          </div>
          {refImages.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "14px 16px", background: "var(--bg)", borderRadius: 8, border: "1px dashed var(--border)" }}>
              Noch keine Referenzbilder — „+ Bild" klicken.
            </div>
          )}
          {refImages.map((img, i) => (
            <div key={i} style={{ padding: "14px 16px", background: "var(--bg)", borderRadius: 10, marginBottom: 10, border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "start" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={S.label}>Bild-URL</label>
                  <input value={img.url || ""} onChange={e => setRefImage(i, "url", e.target.value)}
                    placeholder="https://…/bild.jpg" style={{ ...S.input, fontFamily: "monospace", fontSize: 12 }} />
                </div>
                {img.url && (
                  <img src={img.url} alt="" onError={e => e.target.style.display = "none"}
                    style={{ height: 64, width: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)", gridColumn: "1/-1" }} />
                )}
                <div>
                  <label style={S.label}>Beschreibung</label>
                  <input value={img.beschreibung || ""} onChange={e => setRefImage(i, "beschreibung", e.target.value)}
                    placeholder="Vorher / Nachher – Küchensanierung" style={S.input} />
                </div>
              </div>
              <button onClick={() => removeRefImage(i)}
                style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", marginTop: 20, fontSize: 16 }}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <button onClick={() => saveClient()} style={S.btn}>Speichern</button>
        </div>
      </div>

    </div>
  );
}
