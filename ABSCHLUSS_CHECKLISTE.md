# LeadOS — Abschluss-Checkliste

Das interne Design ist fertig, alle Features sind gebaut. Diese Punkte kommen jetzt
von dir (Konten/Schlüssel), damit live wirklich alles funktioniert.
Produktions-URL: **lead-funnel-app-five.vercel.app**

---

## 1. Sicherheit zuerst — Service-Role-Key rotieren ⚠️
Der alte Key lag im Code offen, gilt als kompromittiert.

- [ ] Supabase → Project Settings → API → **service_role**-Key neu generieren (rotieren).
- [ ] Den NEUEN Key an **drei** Stellen eintragen (sonst geht ein Teil aus):
  - [ ] Vercel → lead-funnel-app → Settings → Environment Variables → `SUPABASE_SERVICE_KEY`
  - [ ] GitHub → lead-funnel-app → Settings → Secrets and variables → Actions → `SUPABASE_KEY`
  - [ ] lokal in `.env.local` → `SUPABASE_SERVICE_KEY`

## 2. Vercel Pro (Pflicht, weil kommerziell)
- [ ] Vercel → Team/Account → auf **Pro** upgraden (~20 $/Monat). Hobby ist nur für nicht-kommerzielle Projekte.

## 3. Schlüssel/Variablen in Vercel setzen (für Bot + KI-Funktionen)
Vercel → lead-funnel-app → Settings → Environment Variables (Production + Preview):
- [ ] `ANTHROPIC_API_KEY` = dein Anthropic-Key  → für E-Mail-/LinkedIn-Generierung
- [ ] `GITHUB_OWNER` = `dionemiriam2-pixel`
- [ ] `GITHUB_REPO` = `lead-funnel-app`
- [ ] `GITHUB_WORKFLOW` = `lead-bot.yml`
- [ ] `GITHUB_TOKEN` = dein PAT (GitHub → Settings → Developer settings → Personal access tokens, Scope: `workflow`)

## 4. GitHub-Secrets im lead-funnel-app-Repo (für den Bot)
GitHub → lead-funnel-app → Settings → Secrets and variables → Actions:
- [ ] `SUPABASE_URL` = `https://gwyuqhflxjsfxutgsxix.supabase.co`
- [ ] `SUPABASE_KEY` = der NEU rotierte service_role-Key

## 5. Funktionstest (nach 1–4)
- [ ] Einloggen auf der Produktions-URL.
- [ ] „Bot starten" klicken → in GitHub → Actions sollte der Lauf starten.
- [ ] Bei einem Lead „E-Mail generieren" / „LinkedIn" → Text erscheint (braucht ANTHROPIC_API_KEY).

---

## Optional / wenn du bereit bist

- **Phase 4 — Ads-Tracking:** Windsor.ai-Konto (~19 $/Monat), Meta + Google verbinden → echte Zahlen ins Tracking. Die Platzhalter-Karte ist schon da.
- **Phase 5 — Datenbank aufräumen:** `client` → `client_id` vereinheitlichen, tote Kurs-Tabellen entfernen (mit Backup). Kann Claude prompt-gesteuert begleiten.
- **Phase 6 — Umschalten:** eigene Domain auf die neue App, alte App (`lead-dashboard-web`) pausieren (als Backup behalten), Repo sinnvoll umbenennen.
- **Kanäle scharf schalten:** Resend (E-Mail), Late (Social), Smartlead/Instantly (Kaltakquise) — wann immer du sie brauchst.
