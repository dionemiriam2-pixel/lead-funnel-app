# Restliche Prompts für VS Code — in dieser Reihenfolge

Regeln: ein Prompt = ein Branch. Nach jedem: `npm run build` grün → kurz im Vercel-Preview
prüfen → in `master` mergen → erst dann den nächsten. So bleibt alles sauber und
konfliktfrei. Jeder Prompt: erst Plan zeigen lassen, dann „ok".

---

## 1) Sidebar auf den abgestimmten Look korrigieren
```
Branch feature/design-system. Die Sidebar ist aktuell komplett dunkel — im
freigegebenen Design ist sie WEISS. Ändere components/AppShell.js:
- Sidebar-Hintergrund: weiß (--bg), 1px Rahmen rechts (--border)
- inaktive Nav-Punkte: graue Schrift (--text-secondary), filigrane Lucide-Icons
- aktiver Nav-Punkt: schwarze Fläche (--ink) + weißer Text/Icon (kein Rot)
- Wortmarke "LeadOS" in Serif (--font-serif) + kleiner roter Punkt (--accent) dahinter
- "Bot starten": Outline-Button (1px --border-strong, schwarz), nicht gefüllt
Nur Aussehen, keine Logik. npm run build grün. Zeig mir kurz, was du änderst.
```

## 2) Reiche Kundenmaske (Cockpit) bauen
```
Eigener Branch feature/kunden-cockpit. Mach app/kunden/[id]/page.js so reichhaltig
wie die ALTE App. Studiere ../lead-dashboard-web/index.html: Tabs pro Kunde =
Leads, Pipeline, Kanäle, Profil, Marketing, Landing Pages — mit Kanal-Kacheln,
pro-Kunde-KPIs, Pipeline-Leiste, Lead-Quellen und einer dem Kunden zugeordneten
Google-Maps-Suche.
- Nutze NUR vorhandene APIs (leads, clients, products, search-terms, sequence, outreach),
  keine neuen Routen, keine DB-Änderung.
- Bestehende Inhalte (Profil, Strategie, Produkte) sinnvoll einordnen, nicht verlieren.
- Design nach DESIGN_GUIDE.md: weiß/schwarz, Serif-Titel, filigrane Lucide-Icons,
  Rot nur sparsam.
Zeig mir zuerst den Plan (welche Tabs, welche Daten, welche Dateien). Noch kein Code.
```

## 3–8) Design + filigrane Icons je Seite
Immer derselbe Block, nur die letzte Zeile (Seite) tauschen. Reihenfolge:
`dashboard` → `outreach` → `tracking` → `toolbox` → `login` → `analytics`,`import`,`lp`.

```
Branch feature/design-system. Stelle die genannte Seite auf DESIGN_GUIDE.md um:
- ALLE Emojis raus -> filigrane Lucide-Linien-Icons (Mapping aus dem Guide)
- Farben -> Tokens: weißer Hintergrund, schwarze Schrift, Rot nur sparsam
- Seitentitel + große Kennzahlen in Serif (--font-serif)
- aktive Elemente schwarz, NICHT rot; Karten/Listen mit 1px --border, viel Weißraum
Nur Aussehen ändern, keine Logik/Daten/API. npm run build muss grün sein.
Zeig mir vorher kurz, was du änderst.

Seite: dashboard
```

## 9) Globaler Emoji-Check (Sicherheitsnetz)
```
Durchsuche app/ und components/ nach verbliebenen Emojis und ersetze sie durch
passende Lucide-Icons (Mapping/Stil aus DESIGN_GUIDE.md). Nur Icons/Styles ändern,
keine Logik. Liste mir vorher auf, welche Dateien betroffen sind. npm run build grün.
```

## 10) Alles zusammenführen
```
Führe die fertigen Branches in master zusammen: erst feature/kunden-cockpit,
dann feature/design-system. Löse eventuelle Konflikte in components/AppShell.js und
app/kunden/[id]/page.js so, dass BEIDE — die reichen Tabs UND der neue Look — erhalten
bleiben. npm run build grün, dann master pushen. Zeig mir vorher, was du tust.
```

---

> Nach jedem Schritt: schick mir, was die KI vorschlägt/baut — ich prüfe es gegen
> deine echten APIs/Tabellen, bevor du „ok" oder „mergen" sagst.
