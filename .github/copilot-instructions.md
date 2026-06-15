# LeadOS — Arbeitsregeln für die KI (Migration ohne Chaos)

Du hilfst beim Umbau von **LeadOS** von der alten Vanilla-App (`../lead-dashboard-web`) auf diese
Next.js-App. Lies zuerst `PROJECT_CONTEXT.md` und `MIGRATIONSPLAN.md`.

**Oberstes Ziel: nichts Funktionierendes zerstören. Lieber kleiner Schritt + Test als großer Wurf.**

## Goldene Regeln

1. **Immer auf einem Branch arbeiten**, nie direkt auf `main`/`master`. Pro Feature ein Branch (`feature/<name>`).
2. **Ein Feature pro Schritt.** Nicht mehrere Module gleichzeitig. Kleine Commits, klare Nachrichten.
3. **Nach jeder Änderung testen:** `npm run build` muss grün sein, `npm run dev` lokal prüfen. Erst dann weiter.
4. **Funktionierenden Code nicht „nebenbei" umschreiben.** Anfassen nur, wenn der Schritt es verlangt.
5. **Keine DB-Struktur ändern ohne Freigabe.** `leads` enthält **106 echte Leads** — niemals löschen/leeren.
6. **Secrets/`.env` nie anfassen, nie committen.** Keine Keys im Frontend (`NEXT_PUBLIC_` nur für Unkritisches).
7. **Die alte App (`lead-dashboard-web`) bleibt unberührt** und live als Backup. Nicht deployen, nicht löschen.
8. **Im Zweifel fragen statt raten.** Unklare Vanilla-Features erst in `../lead-dashboard-web/index.html` nachlesen.
9. **Vor größeren Änderungen kurz den Plan nennen** (welche Dateien, was ändert sich), bevor du schreibst.

## Was NIE angefasst wird
- ❌ Supabase-Produktivdaten (`leads`, `clients`, `products`)
- ❌ `.env`, `.env.local`, API-/Service-Role-Keys
- ❌ Das alte `lead-dashboard-web`-Repo/Deployment
- ❌ `main`/`master` direkt (immer Branch + Merge)

## Sicherer Ablauf pro Feature
```
1. git checkout -b feature/<name>
2. nur dieses eine Feature bauen
3. npm run build      → grün?
4. npm run dev        → im Browser prüfen
5. git commit -m "feat: <name>"
6. Vercel Preview-Deployment ansehen
7. erst wenn alles passt → in main mergen
```

## Notbremse
- Nicht gespeicherte Änderungen verwerfen: `git restore .`
- Zum letzten guten Stand: `git checkout <commit>`
- Bei Fehler: nichts Neues bauen, `git diff` zeigen, Rückrollen vorschlagen.
