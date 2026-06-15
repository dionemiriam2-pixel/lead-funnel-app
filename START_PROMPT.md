# Start-Prompts für VS Code

Kopiere den passenden Block in den KI-Chat in VS Code (Copilot Chat / Claude).
Reihenfolge einhalten — erst Block 1, dann Block 2, dann pro Feature Block 3.

---

## BLOCK 1 — Einstieg (einmal am Anfang)

```
Du arbeitest am Projekt LeadOS in dieser Next.js-App.
Lies zuerst diese drei Dateien vollständig:
- PROJECT_CONTEXT.md
- MIGRATIONSPLAN.md
- .github/copilot-instructions.md

Halte dich strikt an die Regeln in copilot-instructions.md.
Wir migrieren LeadOS von der alten Vanilla-App (liegt lokal unter ../lead-dashboard-web)
auf diese Next.js-App. Nichts Funktionierendes darf kaputtgehen.

Schreibe noch KEINEN Code. Bestätige mir nur kurz:
1. Was ist das Projekt und welche App ist die Zukunft?
2. Was darfst du NIE anfassen?
3. Wie ist der sichere Ablauf pro Feature?
```

---

## BLOCK 2 — Bestandsaufnahme (Phase 0 + 1, noch kein Umbau)

```
Wir machen jetzt Phase 0 und 1 aus MIGRATIONSPLAN.md. Noch kein Feature-Umbau.

1. Prüfe, ob die App lokal läuft: erkläre mir, wie ich `npm install`, `npm run dev`
   und `npm run build` ausführe, und sag mir, worauf ich beim Ergebnis achten muss.
2. Prüfe .env.local: welche Variablen werden im Code erwartet? Liste sie auf
   (NUR die Namen, keine Werte ausgeben).
3. Vergleiche diese App mit ../lead-dashboard-web/index.html und liste mir,
   welche Oberflächen aus der alten App hier noch FEHLEN.
4. Sag mir für jede fehlende Oberfläche, ob die Backend-Route hier schon existiert.

Gib mir am Ende eine kurze Lücken-Liste. Schreibe noch keinen Feature-Code.
```

---

## BLOCK 3 — Ein Feature bauen (pro Feature wiederholen)

Ersetze `<FEATURE>` durch z. B. `bot-button`, `outreach-ui`, `tracking` …

```
Wir bauen jetzt NUR das Feature "<FEATURE>" aus MIGRATIONSPLAN.md (Phase 2).

Vorgehen:
1. Lege einen Branch an: feature/<FEATURE>
2. Erkläre mir zuerst deinen Plan: welche Dateien legst du an / änderst du, was bleibt unberührt.
   Warte auf mein "ok", bevor du Code schreibst.
3. Baue nur dieses eine Feature. Orientiere dich am alten UI in
   ../lead-dashboard-web/index.html.
4. Ändere keine bestehenden Seiten und keine Datenbank.
5. Stelle sicher, dass `npm run build` durchläuft. Wenn nicht: stopp und zeig mir den Fehler.
6. Mache am Ende einen Commit mit Nachricht "feat: <FEATURE>".

Wenn etwas unklar ist: frag mich, statt zu raten.
```

---

## NOTBREMSE — wenn etwas kaputt ist

```
Etwas funktioniert nicht mehr. Baue nichts Neues.
Zeig mir mit `git diff` und `git status`, was sich seit dem letzten Commit geändert hat,
und schlag vor, wie wir sicher zum letzten funktionierenden Stand zurückkommen.
Wenn nötig: erkläre mir, wie ich mit `git restore .` alle ungespeicherten Änderungen verwerfe.
```
