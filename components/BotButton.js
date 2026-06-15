"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function BotButton() {
  const [status, setStatus] = useState("idle"); // idle | running | ok | error

  async function handleClick() {
    setStatus("running");
    try {
      const res = await apiFetch("/api/run-bot", { method: "POST" });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 4000);
  }

  const label = { idle: "🤖 Bot starten", running: "⏳ Läuft…", ok: "✓ Bot gestartet", error: "⚠ Fehler" }[status];

  return (
    <button
      onClick={handleClick}
      disabled={status === "running"}
      style={{
        width: "100%", padding: "9px 14px", border: "none", borderRadius: 10,
        background: status === "ok" ? "rgba(34,197,94,.2)" : status === "error" ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.08)",
        color: status === "ok" ? "#4ade80" : status === "error" ? "#f87171" : "rgba(255,255,255,.6)",
        fontSize: 12, cursor: status === "running" ? "default" : "pointer", textAlign: "left",
        transition: "background .2s, color .2s", marginBottom: 6,
      }}
    >
      {label}
    </button>
  );
}
