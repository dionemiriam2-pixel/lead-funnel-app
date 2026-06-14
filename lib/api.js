// SSR-sicherer Helfer für API-Aufrufe mit Passwort-Header
export function authHeaders() {
  const pw = typeof window !== "undefined" ? (localStorage.getItem("lf_auth_pw") || "") : "";
  return { "x-pw": pw, "Content-Type": "application/json" };
}

export async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } });
  return res.json();
}
