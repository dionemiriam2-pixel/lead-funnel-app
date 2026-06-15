"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Play, AlertTriangle } from "lucide-react";

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

  const isError   = status === "error";
  const isRunning = status === "running";

  return (
    <button
      onClick={handleClick}
      disabled={isRunning}
      style={{
        width: "100%", padding: "9px 14px",
        border: `1px solid ${isError ? "var(--accent)" : "var(--border-strong)"}`,
        borderRadius: 8,
        background: "transparent",
        color: isError ? "var(--accent)" : "var(--ink)",
        fontSize: 12, cursor: isRunning ? "default" : "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: 7,
        transition: "opacity .2s", opacity: isRunning ? .5 : 1,
        fontFamily: "inherit", marginBottom: 6,
      }}
    >
      {isError
        ? <AlertTriangle size={13} strokeWidth={1.5} />
        : <Play size={13} strokeWidth={1.5} />}
      {{ idle: "Bot starten", running: "Läuft…", ok: "✓ Bot gestartet", error: "Fehler" }[status]}
    </button>
  );
}
