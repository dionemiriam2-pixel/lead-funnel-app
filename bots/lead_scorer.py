"""
lead_scorer.py — berechnet den "Heißgrad" (Score 0-10) eines Leads.

Die Idee: Je mehr ein Lead zu deinem Wunschkunden passt, desto höher der Score.
Nur Leads ab Score 6 werden später kontaktiert (Regel aus dem Blueprint).

Du kannst die Punkte unten jederzeit anpassen — das ist dein "Regelwerk".
"""

# Wörter, die auf eine Neueröffnung hindeuten (starkes Kaufsignal)
NEUEROEFFNUNG_WOERTER = [
    "neueröffnung", "neueroeffnung", "eröffnung", "eroeffnung",
    "grand opening", "neue filiale", "coming soon", "bald geöffnet",
]

# Branchen, die besonders gut zu Ladenbau/Innenausbau passen
ZIEL_BRANCHEN = [
    "restaurant", "café", "cafe", "bar", "gastronomie",
    "boutique", "einzelhandel", "laden", "store", "shop",
]


def berechne_score(lead: dict, rating=None) -> int:
    """
    lead: dict mit Feldern wie company_name, website, phone, notes, category
    rating: optionaler Bewertungs-Text von Google Maps (z.B. '4,5')
    Rückgabe: ganze Zahl 0-10
    """
    score = 3  # Grundwert: ein gefundener Lead ist erstmal 3 wert

    text = " ".join(
        str(lead.get(f, "")) for f in ("company_name", "notes", "category")
    ).lower()

    # +3: Neueröffnung erkannt (das wichtigste Signal)
    if any(w in text for w in NEUEROEFFNUNG_WOERTER):
        score += 3

    # +2: Branche passt zur Zielgruppe
    if any(b in text for b in ZIEL_BRANCHEN):
        score += 2

    # +1: hat eine Website (= ernsthaftes Geschäft)
    if lead.get("website"):
        score += 1

    # +1: hat eine Telefonnummer (= erreichbar)
    if lead.get("phone"):
        score += 1

    # -1: ganz neue Firma ohne Bewertungen ist schwerer einzuschätzen
    #     (optional — hier neutral gelassen)

    # auf 0-10 begrenzen
    return max(0, min(10, score))


# Kleiner Selbsttest: python lead_scorer.py
if __name__ == "__main__":
    beispiel = {
        "company_name": "Trattoria Bella Nuova",
        "website": "https://bella-nuova.de",
        "phone": "+49 89 123",
        "category": "Restaurant",
        "notes": "Neueröffnung Q3 2026",
    }
    print("Beispiel-Score:", berechne_score(beispiel))  # erwartet: 10
