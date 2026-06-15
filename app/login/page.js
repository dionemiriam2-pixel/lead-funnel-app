"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pw }) });
    const d = await r.json();
    if (d.ok) { localStorage.setItem("lf_auth", "ok"); localStorage.setItem("lf_auth_pw", pw); router.replace("/dashboard"); }
    else { setErr("Falsches Passwort."); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0, letterSpacing: "-.01em" }}>
            LeadOS<span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>Bitte melde dich an</p>
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)}
              placeholder="Passwort" required autoFocus
              style={{ width: "100%", padding: "12px 44px 12px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--ink)", background: "var(--surface)", boxSizing: "border-box", fontFamily: "inherit" }} />
            <button type="button" onClick={() => setShow(s => !s)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-tertiary)" }}>
              {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
            </button>
          </div>
          {err && <div style={{ color: "var(--accent)", fontSize: 13 }}>{err}</div>}
          <button type="submit" style={{ padding: "13px 14px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
