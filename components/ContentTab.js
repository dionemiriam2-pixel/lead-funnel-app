"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
/* ── Plattform-Konfig ──────────────────────────────────────── */
const PLAT = {
  linkedin:  { label: "LinkedIn",  bg: "#0a66c2", icon: "in" },
  instagram: { label: "Instagram", bg: "#e1306c", icon: "📸" },
  facebook:  { label: "Facebook",  bg: "#1877f2", icon: "f"  },
};

function PlatBadge({ platform }) {
  const p = PLAT[platform] || { label: platform, bg: "#6b7280", icon: null };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: p.bg, color: "#fff", fontSize: 11, fontWeight: 700 }}>
      {p.icon} {p.label}
    </span>
  );
}

/* ── Einzelne Post-Karte ───────────────────────────────────── */
function PostCard({ post, hasLinkedIn, hasImageKey, onDelete, onLinkedInPost }) {
  const [text,       setText]       = useState(post.text || "");
  const [imageUrl,   setImageUrl]   = useState(post.image_url || null);
  const [saving,     setSaving]     = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [posting,    setPosting]    = useState(false);
  const [postOk,     setPostOk]     = useState(false);
  const [postErr,    setPostErr]    = useState("");
  const [deleted,    setDeleted]    = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgErr,     setImgErr]     = useState("");
  const saveTimer = useRef(null);

  // Auto-save on text change (debounced 800ms)
  function handleText(v) {
    setText(v);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await apiFetch("/api/content/posts", { method: "PATCH", body: JSON.stringify({ id: post.id, text: v }) });
      setSaving(false);
    }, 800);
  }

  async function copy() {
    const full = text + (post.hashtags?.length ? "\n\n" + post.hashtags.join(" ") : "");
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function doLinkedInPost() {
    setPosting(true); setPostErr("");
    const full = text + (post.hashtags?.length ? "\n\n" + post.hashtags.join(" ") : "");
    const res = await onLinkedInPost(full);
    setPosting(false);
    if (res?.ok) { setPostOk(true); await apiFetch("/api/content/posts", { method: "PATCH", body: JSON.stringify({ id: post.id, status: "gepostet" }) }); }
    else setPostErr(res?.error || "Fehler beim Posten");
  }

  async function doDelete() {
    if (!confirm("Post löschen?")) return;
    setDeleted(true);
    await apiFetch(`/api/content/posts?id=${post.id}`, { method: "DELETE" });
    onDelete(post.id);
  }

  async function generateImage() {
    const prompt = post.image_prompt || text.slice(0, 200);
    if (!prompt) return;
    setImgLoading(true); setImgErr("");
    const res = await apiFetch("/api/content/image", {
      method: "POST",
      body: JSON.stringify({ post_id: post.id, image_prompt: prompt }),
    });
    setImgLoading(false);
    if (res.canva) {
      // Kein OpenAI-Key → Canva öffnen
      window.open(`https://www.canva.com/search?q=${encodeURIComponent(prompt)}`, "_blank");
    } else if (res.image_url) {
      setImageUrl(res.image_url);
    } else {
      setImgErr(res.error || "Fehler beim Generieren");
    }
  }

  if (deleted) return null;

  const S = {
    card: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" },
  };

  return (
    <div style={S.card}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)" }}>
        <PlatBadge platform={post.platform} />
        {post.week_label && (
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 4 }}>{post.week_label}</span>
        )}
        {post.status === "gepostet" && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", marginLeft: "auto" }}>✓ Gepostet</span>
        )}
        <button onClick={doDelete} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4 }}>
          ✕
        </button>
      </div>

      {/* Text */}
      <div style={{ padding: "12px 16px" }}>
        <textarea
          value={text}
          onChange={e => handleText(e.target.value)}
          rows={5}
          style={{
            width: "100%", boxSizing: "border-box", resize: "vertical",
            border: "1.5px solid var(--border)", borderRadius: 8, padding: "10px 12px",
            fontSize: 13, lineHeight: 1.6, fontFamily: "inherit",
            background: "var(--bg)", color: "var(--ink)", outline: "none",
          }}
        />
        {saving && <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 3 }}>Speichert…</div>}
      </div>

      {/* Hashtags */}
      {post.hashtags?.length > 0 && (
        <div style={{ padding: "0 16px 10px", display: "flex", flexWrap: "wrap", gap: 5 }}>
          {post.hashtags.map((h, i) => (
            <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>{h}</span>
          ))}
        </div>
      )}

      {/* Bild-Idee */}
      {post.image_prompt && !imageUrl && (
        <div style={{ margin: "0 16px 12px", padding: "8px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--text-tertiary)" }}>Bildidee</span>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "3px 0 0", lineHeight: 1.5 }}>{post.image_prompt}</p>
        </div>
      )}

      {/* Generiertes Bild */}
      {imageUrl && (
        <div style={{ margin: "0 16px 12px", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", position: "relative" }}>
          <img src={imageUrl} alt="Generiertes Bild" loading="lazy"
            style={{ width: "100%", display: "block", aspectRatio: "1/1", objectFit: "cover" }} />
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
            <a href={imageUrl} download target="_blank" rel="noopener noreferrer"
              style={{ padding: "5px 8px", borderRadius: 6, background: "rgba(0,0,0,.55)", color: "#fff", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
              ↓ Speichern
            </a>
            <button onClick={generateImage} disabled={imgLoading}
              style={{ padding: "5px 8px", borderRadius: 6, background: "rgba(0,0,0,.55)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
              {imgLoading ? "↺" : "↺"} Neu
            </button>
          </div>
        </div>
      )}

      {/* Aktionen */}
      <div style={{ padding: "10px 16px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* Kopieren */}
        <button onClick={copy}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--ink)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {copied ? "✓" : "⎘"}
          {copied ? "Kopiert!" : "Kopieren"}
        </button>

        {/* LinkedIn direkt posten */}
        {post.platform === "linkedin" && (
          <button onClick={doLinkedInPost} disabled={posting || postOk}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: postOk ? "#dcfce7" : "#0a66c2", color: postOk ? "#16a34a" : "#fff", fontSize: 12, fontWeight: 600, cursor: posting || postOk ? "default" : "pointer", opacity: posting ? 0.7 : 1 }}>
            →
            {postOk ? "Gepostet ✓" : posting ? "Wird gepostet…" : "Direkt posten"}
          </button>
        )}

        {/* Bild generieren oder Canva */}
        {!imageUrl ? (
          hasImageKey
            ? (
              <button onClick={generateImage} disabled={imgLoading}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--ink)", fontSize: 12, fontWeight: 600, cursor: imgLoading ? "not-allowed" : "pointer", opacity: imgLoading ? 0.6 : 1 }}>
                {imgLoading
                  ? "↺"
                  : "🖼"}
                {imgLoading ? "Generiert…" : "Bild erzeugen"}
              </button>
            ) : (
              <a href={`https://www.canva.com/search?q=${encodeURIComponent(post.image_prompt || text.slice(0,80))}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                ↗ In Canva öffnen
              </a>
            )
        ) : (
          <button onClick={generateImage} disabled={imgLoading}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            ↺ Bild neu generieren
          </button>
        )}

        {/* CapCut */}
        <a href="https://www.capcut.com" target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
          ↗ Video in CapCut
        </a>
      </div>

      {imgErr  && <div style={{ padding: "0 16px 10px", fontSize: 12, color: "#dc2626" }}>{imgErr}</div>}
      {postErr && <div style={{ padding: "0 16px 12px", fontSize: 12, color: "#dc2626" }}>{postErr}</div>}
    </div>
  );
}

/* ── Haupt-Komponente ──────────────────────────────────────── */
export default function ContentTab({ clientId, client }) {
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [genErr,      setGenErr]      = useState("");
  const [hasLinkedIn, setHasLinkedIn] = useState(false);
  const [hasImageKey, setHasImageKey] = useState(false);

  // Group by week
  const byWeek = posts.reduce((acc, p) => {
    const w = p.week_label || "Ohne Woche";
    if (!acc[w]) acc[w] = [];
    acc[w].push(p);
    return acc;
  }, {});
  const weeks = Object.keys(byWeek).sort((a, b) => b.localeCompare(a));

  const load = useCallback(async () => {
    setLoading(true);
    const [pr, sr, ir] = await Promise.all([
      apiFetch(`/api/content/posts?client_id=${clientId}`),
      apiFetch(`/api/social?action=list&client_id=${clientId}`),
      apiFetch("/api/content/image"),
    ]);
    setPosts(pr.data || []);
    setHasLinkedIn(!!(sr.connections || []).find(c => c.platform === "linkedin"));
    setHasImageKey(!!ir.hasKey);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  async function generate() {
    setGenerating(true); setGenErr("");
    const res = await apiFetch("/api/content/generate", {
      method: "POST",
      body: JSON.stringify({ client_id: clientId }),
    });
    setGenerating(false);
    if (res.ok) {
      setPosts(prev => [...(res.posts || []), ...prev]);
    } else {
      setGenErr(res.error || "Fehler beim Generieren");
    }
  }

  async function linkedInPost(text) {
    return await apiFetch("/api/social/linkedin/post", {
      method: "POST",
      body: JSON.stringify({ client_id: clientId, text }),
    });
  }

  function removePost(id) {
    setPosts(p => p.filter(x => x.id !== id));
  }

  return (
    <div style={{ padding: "20px 0" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--ink)", margin: "0 0 4px" }}>
            Content-Planung
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            KI erstellt 5 Posts für LinkedIn, Instagram und Facebook — Text editierbar, direkt kopierbar.
          </p>
        </div>
        <button onClick={generate} disabled={generating}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--ink)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1, flexShrink: 0 }}>
          {generating
            ? "↺ Generiert…"
            : "✦ Wochen-Content erstellen"}
        </button>
      </div>

      {genErr && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
          {genErr}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Content ────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>Lade…</div>
      ) : posts.length === 0 ? (
        <div style={{ padding: "60px 32px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
          <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6, fontSize: 15 }}>Noch keine Posts erstellt</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 320, margin: "0 auto 20px" }}>
            Klick auf "Wochen-Content erstellen" — die KI schreibt 5 fertige Posts basierend auf dem Kundenprofil.
          </div>
          <button onClick={generate} disabled={generating}
            style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "var(--ink)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <span style={{ marginRight: 6 }}>✦</span>
            Jetzt generieren
          </button>
        </div>
      ) : (
        weeks.map(week => (
          <div key={week} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-tertiary)" }}>{week}</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{byWeek[week].length} Posts</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
              {byWeek[week].map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  hasLinkedIn={hasLinkedIn}
                  hasImageKey={hasImageKey}
                  onDelete={removePost}
                  onLinkedInPost={linkedInPost}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
