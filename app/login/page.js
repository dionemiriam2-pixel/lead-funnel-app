"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pw }) });
    const d = await r.json();
    if (d.ok) { localStorage.setItem("lf_auth", "ok"); router.replace("/dashboard"); }
    else { setErr("Falsches Passwort."); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>LeadFlow</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Bitte melde dich an</p>
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)}
              placeholder="Passwort" required autoFocus
              style={{ width: "100%", padding: "13px 44px 13px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15, boxSizing: "border-box" }} />
            <button type="button" onClick={() => setShow(s => !s)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9ca3af" }}>
              {show ? "🙈" : "👁️"}
            </button>
          </div>
          {err && <div style={{ color: "#b91c1c", fontSize: 13 }}>{err}</div>}
          <button type="submit" style={{ padding: 14, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
