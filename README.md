# Lead-Funnel App (Next.js) — wiederverwendbares Landing-Page-System

Eine App, beliebig viele Landing Pages. Jede LP = ein Eintrag in
`content/landingpages.js`. Alle Formulare schreiben automatisch in deine
Supabase-Tabelle `leads` (mit lp, client, industry, source=landing-page).

## Struktur
```
app/
  page.js                 Übersicht aller LPs
  lp/[slug]/page.js       rendert jede LP automatisch
  api/lead/route.js       nimmt Formular an -> Supabase
components/
  LandingPage.js          die Design-Vorlage
  LeadForm.js             das Formular
content/
  landingpages.js         HIER deine LPs pflegen
lib/supabase.js           DB-Verbindung (service_role, nur serverseitig)
```

## Einrichten (einmalig)
1. Ordner in VS Code öffnen. Terminal:
   ```
   npm install
   ```
2. Datei `.env.local` anlegen (Kopie von `.env.example`) und ausfüllen:
   ```
   SUPABASE_URL=https://gwyuqhflxjsfxutgsxix.supabase.co
   SUPABASE_SERVICE_KEY=dein-service-role-key
   ```
3. Lokal testen:
   ```
   npm run dev
   ```
   Dann im Browser: http://localhost:3000  (Übersicht) bzw.
   http://localhost:3000/lp/ladenbau-muenchen

## Neue Landing Page anlegen
`content/landingpages.js` öffnen und einen neuen Block hinzufügen
(slug, client, industry, headline, subline, bullets, …). Speichern → fertig.
Sie ist sofort unter `/lp/<slug>` erreichbar.

## Online stellen (Vercel)
1. Projekt zu GitHub pushen (git init, add, commit, push).
2. Auf vercel.com importieren.
3. Environment Variables setzen: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
4. Deploy. Jede LP ist dann live unter `deinprojekt.vercel.app/lp/<slug>`.
   Jeder weitere `git push` deployt automatisch neu.

## Wichtig
- Der `service_role`-Key kommt NUR in `.env.local` / Vercel — niemals in GitHub
  (die `.gitignore` schließt `.env.local` bereits aus).
- E-Mail-Werbung an diese Leads ist ok, weil sie sich selbst eingetragen haben (Opt-in).
