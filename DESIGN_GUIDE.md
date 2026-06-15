# LeadOS — Design-Leitfaden

Ziel-Look: **hochwertig, reduziert, schwarz-weiß** mit **einer** Akzentfarbe (Signalrot),
charakterstarken **Serifen-Headlines** und viel Weißraum. Premium durch Weglassen.
Keine Emojis, keine bunten Flächen, keine Schatten/Verläufe.

---

## 1. Farben (Design-Tokens)

In `app/globals.css` unter `:root` anlegen, überall NUR diese Variablen nutzen
(keine hartkodierten Hex-Werte in Komponenten):

```css
:root {
  /* Basis – schwarz/weiß */
  --bg:            #FFFFFF;   /* Hauptfläche, reinweiß */
  --surface:       #FFFFFF;   /* Karten */
  --ink:           #0E0E0E;   /* Überschriften, Primärtext, aktive Elemente */
  --text-secondary:#6B6B6B;   /* Fließtext */
  --text-tertiary: #9B9B9B;   /* Mikro-Labels, Hinweise */

  /* Linien (haarfein) */
  --border:        #ECECEC;   /* Standard-Trennlinie / Rahmen */
  --border-strong: #0E0E0E;   /* Betonung, Outline-Buttons */

  /* Akzent – Signalrot, SEHR sparsam */
  --accent:        #C8322C;   /* nur für Highlights, Status, Schlüsselzahlen, Fokus */
  --accent-strong: #A82822;   /* Hover des Akzents */
}
```

**Akzent-Regel (wichtig):** Rot blitzt nur an 2–3 Stellen pro Screen auf — z. B. eine
Schlüsselzahl (Conversion), ein aktiver Status-Punkt, ein Link-Hover, der Fokus-Ring,
das Logo-Pünktchen. **Niemals** großflächig, **nie** als Button-Fläche.

**Aktive Zustände sind SCHWARZ, nicht rot:** aktiver Menüpunkt = `--ink`-Hintergrund + weißer Text;
aktive Kanal-Chips = `--ink`-Hintergrund + weißer Text; Outline-Buttons = `--ink`-Rahmen.

### Status-Punkte (kleiner Kreis statt bunter Pill)
| Status | Punktfarbe |
|---|---|
| Qualifiziert / wichtig | `--accent` (rot) |
| Neu / neutral | `#D0D0D0` |
| Kontaktiert / in Arbeit | `#D0D0D0` |

---

## 2. Typografie — der Charakter

Zwei Schriften, geladen über `next/font/google`:

- **Headlines/Zahlen:** `Fraunces` (hoch-kontrastige Serifen-Display, edel & eigenständig).
- **Fließtext/UI:** `Inter` (clean, neutral).

```js
// app/layout.js
import { Fraunces, Inter } from "next/font/google";
const serif = Fraunces({ subsets: ["latin"], weight: ["400","500"], variable: "--font-serif" });
const sans  = Inter({ subsets: ["latin"], weight: ["400","500"], variable: "--font-sans" });
// <body className={`${serif.variable} ${sans.variable}`}>
```

Regeln:
- Nur **zwei** Schnitte: 400 (normal), 500 (medium). Kein 600/700.
- Serif (`--font-serif`) für: Wortmarke „LeadOS", alle Seitentitel (H1/H2), große Kennzahlen.
- Sans (`--font-sans`) für: alles andere (Navigation, Tabellen, Buttons, Fließtext).
- Größen: H1 25px · H2 18px · große Zahl 28px · Fließtext 14px · Label 11px.
- Mikro-Labels: 11px, `text-transform:uppercase`, `letter-spacing:.1em`, Farbe `--text-tertiary`.
- Immer **Satzschreibung** (außer den Mikro-Labels). Nie Title Case.

---

## 3. Icons

Alle Emojis raus → **Lucide** (dünne, einfarbige Linien-Icons):

```
npm install lucide-react
```

- Strichstärke 1.5, Größe 16–18px, Farbe erbt vom Text (`currentColor`).
- Inaktiv: `--text-secondary`. Im aktiven (schwarzen) Menüpunkt: weiß. **Nie** rot, nie gefüllt, nie mehrfarbig.

Emoji → Lucide:
| bisher | Lucide |
|---|---|
| 📊 Übersicht/Leads | `LayoutDashboard` |
| 🏢 Kunden | `Building2` |
| 📨 Outreach | `Mail` |
| 📋 Alle Leads | `ListChecks` |
| 📈 Tracking | `LineChart` |
| 🧰 Toolbox | `LayoutGrid` |
| 🤖 Bot starten | `Play` |
| 💼 LinkedIn | `Linkedin` · 📧 `Mail` · 📱 Facebook `Facebook` · 🔍 Google `Search` · 🎯 `Target` · 📞 `Phone` |

---

## 4. Flächen & Komponenten

- **Linien statt Farbe:** 1px `--border`, Radius 7–8px (Karten 10px). Keine Schatten.
- **Kennzahlen-Block:** in EINER Box mit senkrechten Trennlinien (`border-right:1px --border`)
  statt einzelner Karten — wirkt redaktionell/print. Zahl in `--font-serif`, 28px.
  Genau eine Zahl darf rot sein (die wichtigste).
- **Listen/Tabellen:** Zeilen nur durch 1px `--border` getrennt, viel Innenabstand (12–14px),
  Status als kleiner Punkt + Text (kein farbiger Kasten).
- **Buttons:**
  - Primär: `--ink` Fläche, weißer Text, Radius 7px.
  - Sekundär/Outline: transparent, 1px `--border-strong`, Text `--ink`.
  - Rot ist KEINE Button-Farbe.
- **Sidebar-Nav:** aktiv = `--ink` Fläche + weißer Text/Icon; inaktiv = `--text-secondary`, Hover zarter Grauton.
- **Wortmarke:** „LeadOS" in `--font-serif` + winziger roter Punkt dahinter (Signature-Detail).
- **Fokus:** dünner Ring `box-shadow: 0 0 0 2px var(--accent)`.
- Großzügiger Weißraum (Abstände 16 / 24 / 32px).

---

## 5. Umbau-Strategie (sicher, rein visuell)

Keine Logik/Daten/API ändern — nur Aussehen.

1. Branch `feature/design-system`.
2. Schriften in `app/layout.js` via `next/font/google` laden (Fraunces + Inter).
3. Tokens in `app/globals.css` `:root` anlegen.
4. `npm install lucide-react`.
5. **Seite für Seite**, beginnend mit `components/AppShell.js` (Sidebar): Emojis → Lucide,
   Farben → Tokens, Wortmarke in Serif + rotem Punkt, aktiver Punkt schwarz. Nach jeder Seite `npm run build` grün prüfen.
6. Reihenfolge: AppShell → Dashboard → Kunden/Detail → Outreach → Tracking → Toolbox → Login → Rest.
7. Erst am Ende mergen, wenn alles einheitlich ist.

> Nur Aussehen ändern (Styles/Klassen + Icon-Tausch), niemals Funktion.
