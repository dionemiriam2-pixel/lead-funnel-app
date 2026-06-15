# LeadOS — Projekt-Kontext (für VS Code / KI)

> Diese Datei beschreibt, **was das Projekt ist, was existiert und wohin es gebaut wird.**
> Lies sie zusammen mit `.github/copilot-instructions.md` (Migrations-Regeln) und `MIGRATIONSPLAN.md`.
> Stand: Juni 2026.

---

## 1. Worum geht's?

**LeadOS** ist ein internes Agentur-Tool für **Lead-Gewinnung und Lead-Management** über mehrere Kunden ("Mandanten").
Eine Betreiberin verwaltet ihre eigenen Leads **und** die Leads ihrer Kunden, getrennt nach `client_id`.
Es ist ein **kommerzielles** Werkzeug (kein Endkundenprodukt).

**Ziel:** Alle Kanäle der Kunden + das gesamte Lead-Management laufen über **eine einzige, saubere Web-App.**

---

## 2. WICHTIG: Es gibt zwei Apps — diese hier ist die Zukunft

| App | Repo | Rolle | Zukunft |
|---|---|---|---|
| **lead-funnel-app** (DIESE) | `dionemiriam2-pixel/lead-funnel-app` | Next.js 14 + React. Moderne Basis: Cockpit + Landing-Pages, 15 API-Routes. | ✅ **Wird die EINE App** |
| **lead-dashboard-web** (ALT) | `dionemiriam2-pixel/lead-dashboard` | Vanilla `index.html` (2.480 Z.) + 10 Serverless-Fns + Python-Bots. **Aktuell live.** | ⏸️ Backup, wird stillgelegt |

> **Migration:** Wir bauen die fehlenden Oberflächen der alten App in diese Next.js-App nach,
> dann wird die alte App pausiert. Die alte Repo liegt lokal als Referenz unter `../lead-dashboard-web`.

---

## 3. Tech-Stack

- **Framework:** Next.js 14 (App Router), React 18.
- **Hosting:** Vercel. ⚠️ Kommerziell → **Vercel Pro Pflicht** (Hobby ist nur für nicht-kommerzielle Projekte).
- **Datenbank/Auth:** **Supabase** (Postgres 17), Region `eu-west-2`, Projekt-Ref `gwyuqhflxjsfxutgsxix`. RLS überall aktiv.
- **Bots:** Python (Google-Maps-Scraper via Playwright) als **GitHub Actions**, manuell per Button angestoßen. Liegen in der alten Repo (`../lead-dashboard-web/bots/`) → müssen mit übernommen werden.
- **Automation:** n8n-Webhook (alte App) bzw. eigener `webhook`-Route (neue App).

---

## 4. Aktuelle Struktur dieser App (Ist)

```
app/
  page.js                  (Einstieg)
  login/page.js            Login
  dashboard/page.js        Lead-Liste + Detail (Notizen, KI-Einschätzung, Follow-up-Sequenz)
  kunden/page.js           Kundenliste
  kunden/[id]/page.js      Kundendetail (Produkte, Strategie, KI-Analyse)
  analytics/page.js        Auswertungen
  import/page.js           CSV-Massenimport von Leads
  lp/[slug]/page.js        Dynamische Landing-Page (rendert aus content/landingpages.js)
  api/                     Route Handlers (Backend):
    auth, clients, products, leads, lead, search-terms,
    analyse, enrich, linkedin-msg, outreach, sequence,
    run-bot, import, webhook
components/
  AppShell.js              Navigation (Leads, Kunden, Analytics, Import)
  LandingPage.js           LP-Design-Vorlage
  LeadForm.js              Formular (schreibt in Supabase `leads`)
lib/
  supabase.js, auth.js, api.js
content/
  landingpages.js          Alle Landing-Pages als Daten-Einträge
```

---

## 5. Supabase-Schema (echt, gemeinsam für beide Apps)

**LeadOS-Kern:**
- `clients` (Mandanten): name, website, region, usp, channels(jsonb), strategy(jsonb), Social-Handles, meta_*, …
- `products`: client_id→clients, name, description, target_groups, keywords, offer
- `leads` (**106 echte Zeilen — niemals löschen**): company_name(unique), contact_name, email, phone, website, city, category, source, score, status, pipeline_status, notes, **client (text, alt)** + **client_id (uuid→clients, neu)**, industry, lp, product, follow_up_date, outreach_text, channels(jsonb), enriched_data(jsonb), sequence(jsonb), linkedin_msg(jsonb)
- `activities`: lead_id→leads, type, note (Timeline pro Lead)
- `search_terms`: term, location, status, max_results, client_id→clients (Aufträge für den Maps-Bot)
- `landing_pages`: client_id→clients, name, url, status, leads_count

**Tech-Debt (aufräumen, aber nur nach Rückfrage):**
- `leads`/`search_terms` haben **doppelt** `client (text)` UND `client_id (uuid)` → auf `client_id` vereinheitlichen.
- Alt-Tabellen aus einem Kurs-Template, vermutlich **nicht** Teil von LeadOS: `profiles`, `progress`, `purchases`, `sessions`, `feedback`, `purchase_claims`. Erst Code-Referenzen prüfen, dann ggf. entfernen.

---

## 6. Zielbild — 5 Funktionen

| # | Funktion | Umsetzung | Externes Tool |
|---|---|---|---|
| 1 | Lead-Erfassung & CRM | nativ (Supabase) | — |
| 2 | Outreach / E-Mail | nativ + API | Resend (transaktional). ⚠️ Kaltakquise NICHT über Resend → Smartlead/Instantly + eigene Domain |
| 3 | Social Posting | API-first | Late (getlate.dev). Ayrshare meiden (zu teuer) |
| 4 | Tracking / Reporting | Dashboard, read-only | Windsor.ai |
| 5 | Meta/Google ins Tracking spiegeln | nur Daten reinziehen, nicht steuern | Windsor.ai |

**Was beim Umzug aus der alten App noch als Oberfläche fehlt:** Toolbox, Tracking-Seite, konfigurierbare Kanal-Kacheln je Kunde, Outreach-UI mit Vorlagen + Verlauf, sichtbarer „Bot starten"-Button. (Die Backend-Routen dafür existieren hier meist schon.)

---

## 7. Leitplanken

- Service-Role-Key nur server-seitig (Route Handlers), nie im Browser. `NEXT_PUBLIC_*` nur für Unkritisches.
- Jede Query nach `client_id` filtern (Mandantentrennung). "eigene" Leads = eigener Client-Datensatz.
- Vercel auf 1 Seat halten; beide Vercel-Projekte laufen im selben Team → keine Doppelkosten.
- Sicherheit & Aufräumen siehe `.github/copilot-instructions.md`.
