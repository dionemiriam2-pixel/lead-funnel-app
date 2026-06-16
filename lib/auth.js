"use client";
import { supabaseBrowser } from "./supabase";

export const TOKEN_KEY = "lf_access_token";

// Synchron — für authHeaders() in lib/api.js
export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

// Synchroner Schnell-Check (reicht für AppShell-Erstprüfung)
export function isLoggedIn() {
  return !!getToken();
}

// Async: verifiziert Session gegen Supabase, aktualisiert Token-Cache
export async function checkSession() {
  try {
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    if (session?.access_token) {
      localStorage.setItem(TOKEN_KEY, session.access_token);
      return true;
    }
    localStorage.removeItem(TOKEN_KEY);
    return false;
  } catch {
    return false;
  }
}

export async function logout() {
  try { await supabaseBrowser().auth.signOut(); } catch { /* ignore */ }
  localStorage.removeItem(TOKEN_KEY);
}
