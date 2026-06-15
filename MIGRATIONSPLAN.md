# LeadOS — Migrationsplan (alt → Next.js)

Reihenfolge so gewählt, dass **früh getestet** wird und **nichts Funktionierendes** kaputtgeht.
Jeder Schritt = eigener Branch, Build grün, Preview testen, dann mergen. Details: `.github/copilot-instructions.md`.

---

## Phase 0 — Absichern (zuerst!)
- [ ] **0.1** Diese Repo lokal öffnen, `npm install`, `npm run dev` läuft? Build (`npm run build`) grün?
- [ ] **0.2** `.env.local` prüfen: stehen `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` etc.? (Werte aus Vercel übernehmen, nicht committen.)
- [ ] **0.3** Aktuellen Stand committen, damit es einen sauberen Startpunkt gibt.
- [ ] **0.4** Bestätigen, dass App gegen die richtige Supabase läuft und die 106 Leads sichtbar sind.

## Phase 1 — Bestandsaufnahme (kein Code-Umbau)
- [ ] **1.1** KI listet: welche Vanilla-Features fehlen hier als UI? (Toolbox, Tracking, Kanal-Kacheln, Outreach-UI mit Vorlagen/Verlauf, „Bot starten"-Button)
- [ ] **1.2** Für jedes fehlende Feature prüfen: existiert die Backend-Route schon? (meist ja: `outreach`, `run-bot`, `sequence`, …)
- [ ] **1.3** Kurze Lücken-Liste erstellen. Erst danach bauen.

## Phase 2 — UI-Lücken nachbauen (je 1 Branch)
- [ ] **2.1** `feature/bot-button` — „Bot starten"-Button → ruft `api/run-bot` (kleinster Schritt, schneller Erfolg).
- [ ] **2.2** `feature/outreach-ui` — Outreach-Seite mit Vorlagen + Verlauf, nutzt `api/outreach` + `api/sequence`.
- [ ] **2.3** `feature/channel-cards` — konfigurierbare Kanal-Kacheln je Kunde (liest/schreibt `clients.channels` jsonb).
- [ ] **2.4** `feature/toolbox` — Toolbox-Seite mit Kacheln (inkl. „Bald verfügbar").
- [ ] **2.5** `feature/tracking` — Tracking-Seite (zunächst Layout; echte Ads-Daten in Phase 4).

## Phase 3 — Bots & Automation übernehmen
- [ ] **3.1** `bots/` (Maps-Scraper, Lead-Scorer) + GitHub-Actions-Workflow `lead-bot.yml` aus `../lead-dashboard-web` in diese Repo kopieren.
- [ ] **3.2** GitHub-Secrets (`SUPABASE_URL`, `SUPABASE_KEY`) im neuen Repo setzen.
- [ ] **3.3** `api/run-bot` auf die neue Repo/Workflow zeigen lassen. Manuell testen.

## Phase 4 — Tracking mit echten Daten (Meta/Google read-only)
- [ ] **4.1** Tabelle `ad_metrics` anlegen (nach Freigabe): `client_id, source['meta'|'google'], date, spend, impressions, clicks, leads, raw jsonb`.
- [ ] **4.2** Windsor.ai anbinden (Cron/Edge Function), Daten reinschreiben.
- [ ] **4.3** Tracking-Seite liest read-only aus `ad_metrics`.

## Phase 5 — Aufräumen (nach Freigabe)
- [ ] **5.1** `leads`/`search_terms`: `client` (text) → `client_id` (uuid) vereinheitlichen, 106 Leads backfillen.
- [ ] **5.2** Tote Kurs-Tabellen prüfen (`profiles`, `progress`, `purchases`, `sessions`, `feedback`, `purchase_claims`) → nur entfernen, wenn nirgends referenziert.

## Phase 6 — Umschalten
- [ ] **6.1** Diese App auf Vercel Pro, eine Domain draufzeigen.
- [ ] **6.2** Alte App (`lead-dashboard-web`) **pausieren** (nicht löschen) — Backup, bis die neue nachweislich alles kann.
- [ ] **6.3** Repo sinnvoll umbenennen (sie ist mehr als „funnel" — das ganze LeadOS).

---

> Faustregel: Erst Phase 0–1 komplett, bevor irgendetwas umgebaut wird.
> Niemals Phase 5 (DB) vor Phase 2–4. Bei Unsicherheit: fragen.
