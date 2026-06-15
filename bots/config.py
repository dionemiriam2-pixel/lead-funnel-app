"""
config.py — zentrale Einstellungen für den Lead-Bot.

WICHTIG: Trage hier deine Supabase-Zugangsdaten ein.
Du findest sie in Supabase → Project Settings → API:
  - SUPABASE_URL      = "Project URL"
  - SUPABASE_KEY      = "service_role"-Key (NICHT der anon-Key, da der Bot schreibt)

Tipp: Lege die Keys lieber als Umgebungsvariablen an, statt sie hier hart reinzuschreiben.
Der Code unten liest zuerst Umgebungsvariablen und nutzt die Werte hier nur als Fallback.
"""

import os

# ---------------------------------------------------------------------------
# Supabase-Zugang
# ---------------------------------------------------------------------------
# Deine Projekt-URL ist bereits eingetragen (kein Geheimnis):
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://gwyuqhflxjsfxutgsxix.supabase.co")

# Wird über GitHub-Secret SUPABASE_KEY gesetzt — niemals hier eintragen:
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# ---------------------------------------------------------------------------
# Suchbegriffe — {plz} wird automatisch durch jede PLZ unten ersetzt
# ---------------------------------------------------------------------------
QUERIES = [
    "Gastronomie Neueröffnung {plz}",
    "Restaurant Neueröffnung {plz}",
    "Café Eröffnung {plz}",
    "Einzelhandel Neueröffnung {plz}",
    "Ladenlokal Eröffnung {plz}",
    "Boutique Eröffnung {plz}",
]

# ---------------------------------------------------------------------------
# Regionen, die durchsucht werden (PLZ oder Stadtname)
# ---------------------------------------------------------------------------
PLZ_LISTE = [
    "München",
    "80331",   # München Zentrum
    # "Augsburg",
    # "Nürnberg",
]

# ---------------------------------------------------------------------------
# Verhalten des Bots
# ---------------------------------------------------------------------------
MAX_RESULTS_PRO_QUERY = 20    # wie viele Treffer pro Suchbegriff max. geöffnet werden
DELAY_MIN_SEK = 2.0           # zufällige Pause zwischen Aktionen (Minimum)
DELAY_MAX_SEK = 5.0           # zufällige Pause zwischen Aktionen (Maximum)
HEADLESS = True              # True = unsichtbar im Hintergrund (für Cloud/Cron-Job)
