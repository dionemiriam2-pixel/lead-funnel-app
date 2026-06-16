"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import { TOKEN_KEY } from "@/lib/auth";

export default function LoginPage() {
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [show,    setShow]    = useState(false);
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { data, error } = await supabaseBrowser().auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });
      if (error) {
        setErr(error.message === "Invalid login credentials"
          ? "E-Mail oder Passwort falsch."
          : error.message);
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.session.access_token);
      router.replace("/dashboard");
    } catch {
      setErr("Netzwerkfehler — bitte nochmal versuchen.");
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
    borderRadius: 8, fontSize: 14, color: "var(--ink)", background: "var(--surface)",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink)", margin: 0, letterSpacing: "-.01em" }}>
            LeadOS<span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>Bitte melde dich an</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
              E-Mail
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="deine@email.de" required autoFocus autoComplete="email"
              style={inp} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
              Passwort
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                style={{ ...inp, paddingRight: 44 }} />
              <button type="button" onClick={() => setShow(s => !s)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-tertiary)" }}>
                {show ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {err && <div style={{ color: "var(--accent)", fontSize: 13 }}>{err}</div>}

          <button type="submit" disabled={loading}
            style={{ marginTop: 4, padding: "13px 14px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? .7 : 1 }}>
            {loading ? "Anmelden…" : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
