"""
maps_scraper.py — findet Firmen auf Google Maps und schreibt sie in Supabase.

So funktioniert es (für Einsteiger):
  1. Der Bot öffnet einen echten Browser (Playwright).
  2. Er sucht auf Google Maps nach jedem Begriff aus config.QUERIES für jede PLZ.
  3. Er scrollt die Trefferliste, öffnet jeden Treffer und liest Name, Adresse,
     Telefon, Website, Bewertung aus.
  4. Jeder Treffer wird in die Supabase-Tabelle 'leads' geschrieben (upsert).

EHRLICHER HINWEIS:
  Google ändert das Layout von Maps regelmäßig. Wenn der Bot plötzlich nichts
  mehr findet, liegt es fast immer an geänderten "Selektoren" (den Markierungen
  unten im Code). Dann HEADLESS=False in config.py setzen, zuschauen wo er
  hängt, und die Selektoren anpassen. Notfalls die fehlenden Leads von Hand
  in Supabase eintragen — der Rest des Funnels läuft trotzdem weiter.

Start:
  python maps_scraper.py
"""

import random
import time
import re

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
from supabase import create_client

import config
from lead_scorer import berechne_score


# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------
def pause():
    """Zufällige Pause, damit wir nicht wie ein Bot wirken."""
    time.sleep(random.uniform(config.DELAY_MIN_SEK, config.DELAY_MAX_SEK))


def supabase_client():
    if not config.SUPABASE_KEY:
        raise SystemExit(
            "FEHLER: SUPABASE_KEY ist nicht gesetzt. "
            "GitHub-Secret SUPABASE_KEY in den Repo-Einstellungen hinterlegen."
        )
    return create_client(config.SUPABASE_URL, config.SUPABASE_KEY)


def text_or_none(page, selector):
    """Liest den Text eines Elements, gibt None zurück wenn es nicht da ist."""
    try:
        el = page.query_selector(selector)
        return el.inner_text().strip() if el else None
    except Exception:
        return None


def attr_or_none(page, selector, attr):
    try:
        el = page.query_selector(selector)
        return el.get_attribute(attr) if el else None
    except Exception:
        return None


def handle_consent(page):
    """Klickt den Google-Cookie-Dialog weg, falls er erscheint."""
    for label in ["Alle akzeptieren", "Accept all", "Ich stimme zu", "Alle ablehnen"]:
        try:
            btn = page.get_by_role("button", name=label)
            if btn.count() > 0:
                btn.first.click(timeout=3000)
                pause()
                return
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Eine Detailseite auslesen
# ---------------------------------------------------------------------------
def lese_detail(page):
    """Liest die Daten aus dem geöffneten Maps-Detail-Panel."""
    name = text_or_none(page, "h1")

    # Adresse, Telefon, Website stehen in Buttons mit data-item-id
    adresse = attr_or_none(page, 'button[data-item-id="address"]', "aria-label")
    if adresse:
        adresse = adresse.replace("Adresse: ", "").strip()

    telefon = attr_or_none(page, 'button[data-item-id^="phone"]', "aria-label")
    if telefon:
        telefon = re.sub(r"^Telefon:\s*", "", telefon).strip()

    website = attr_or_none(page, 'a[data-item-id="authority"]', "href")

    # Bewertung & Anzahl (stehen je nach Sprache in aria-labels)
    rating = text_or_none(page, 'div.F7nice span[aria-hidden="true"]')

    return {
        "company_name": name,
        "address_raw": adresse,
        "phone": telefon,
        "website": website,
        "rating": rating,
    }


# ---------------------------------------------------------------------------
# Hauptlogik
# ---------------------------------------------------------------------------
def lade_jobs(sb):
    """
    Baut die Liste der Suchaufträge.
    1) Zuerst offene Begriffe aus der Tabelle 'search_terms' (vom Dashboard eingegeben).
    2) Wenn keine offenen Begriffe da sind: die Standard-Begriffe aus config.py.
    """
    jobs = []
    try:
        res = sb.table("search_terms").select("*").eq("status", "pending").execute()
        for row in res.data:
            ort = (row.get("location") or "").strip()
            term = row["term"].strip()
            query = (term + " " + ort).strip()
            jobs.append({
                "id": row["id"],
                "query": query,
                "category": term.split(" ")[0],
                "plz": ort,
                "max_results": row.get("max_results") or config.MAX_RESULTS_PRO_QUERY,
                "client": row.get("client") or "eigene",
                "industry": row.get("industry") or term.split(" ")[0],
            })
    except Exception as e:
        print(f"  ⚠️  Konnte search_terms nicht lesen ({e}) — nutze config.py")

    if jobs:
        print(f"📋 {len(jobs)} Suchauftrag/-aufträge aus dem Dashboard geladen.")
        return jobs

    # Fallback: Standard-Begriffe aus config.py
    for plz in config.PLZ_LISTE:
        for query_template in config.QUERIES:
            jobs.append({
                "id": None,
                "query": query_template.format(plz=plz),
                "category": query_template.split(" ")[0],
                "plz": plz,
                "max_results": config.MAX_RESULTS_PRO_QUERY,
                "client": "eigene",
                "industry": query_template.split(" ")[0],
            })
    print(f"📋 Keine Dashboard-Aufträge — nutze {len(jobs)} Standard-Suchen aus config.py.")
    return jobs


def _markiere_erledigt(sb, job, anzahl):
    """Setzt einen Dashboard-Suchauftrag auf 'done' und speichert die Trefferzahl."""
    if not job.get("id"):
        return
    try:
        from datetime import datetime, timezone
        sb.table("search_terms").update({
            "status": "done",
            "result_count": anzahl,
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", job["id"]).execute()
    except Exception as e:
        print(f"  ⚠️  Konnte Auftrag nicht als erledigt markieren ({e})")


def scrape():
    sb = supabase_client()
    gefunden_gesamt = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=config.HEADLESS)
        context = browser.new_context(
            locale="de-DE",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
            ),
        )
        page = context.new_page()

        jobs = lade_jobs(sb)

        for job in jobs:
            query = job["query"]
            plz = job["plz"]
            job_count = 0
            print(f"\n🔎 Suche: {query}")

            url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
            page.goto(url, timeout=60000)
            handle_consent(page)
            pause()

            # Trefferliste (Feed) finden und scrollen, damit mehr lädt
            try:
                page.wait_for_selector('div[role="feed"]', timeout=15000)
            except PWTimeout:
                print("  ⚠️  Keine Trefferliste gefunden — überspringe.")
                _markiere_erledigt(sb, job, 0)
                continue

            # Feed-Element direkt scrollen (funktioniert auch headless in der Cloud)
            feed_el = page.query_selector('div[role="feed"]')
            for _ in range(12):
                if feed_el:
                    feed_el.evaluate("el => el.scrollTop += 2000")
                else:
                    page.mouse.wheel(0, 2000)
                time.sleep(1.5)

            # Alle Treffer-Links einsammeln
            cards = page.query_selector_all('div[role="feed"] a[href*="/maps/place/"]')
            links = []
            for c in cards:
                href = c.get_attribute("href")
                if href and href not in links:
                    links.append(href)
            links = links[: job["max_results"]]
            print(f"  → {len(links)} Treffer (max {job['max_results']}), öffne sie nacheinander…")

            for href in links:
                try:
                    page.goto(href, timeout=45000)
                    page.wait_for_selector("h1", timeout=10000)
                    pause()
                    daten = lese_detail(page)
                except Exception as e:
                    print(f"    ✗ Treffer übersprungen ({e})")
                    continue

                if not daten.get("company_name"):
                    continue

                # Ort aus der Adresse grob ableiten
                stadt = plz
                if daten.get("address_raw"):
                    stadt = daten["address_raw"].split(",")[-1].strip() or plz

                lead = {
                    "company_name": daten["company_name"],
                    "phone": daten.get("phone"),
                    "website": daten.get("website"),
                    "city": stadt,
                    "category": job["category"],  # grobe Kategorie
                    "client": job.get("client", "eigene"),
                    "industry": job.get("industry") or job["category"],
                    "source": "google-maps",
                    "status": "new",
                    "notes": f"Gefunden über Suche: '{query}'. Adresse: {daten.get('address_raw')}",
                }
                lead["score"] = berechne_score(lead, rating=daten.get("rating"))

                # upsert: gleicher Firmenname wird nicht doppelt angelegt
                try:
                    sb.table("leads").upsert(lead, on_conflict="company_name").execute()
                    gefunden_gesamt += 1
                    job_count += 1
                    print(f"    ✓ {lead['company_name']}  (Score {lead['score']})")
                except Exception as e:
                    print(f"    ✗ Supabase-Fehler bei {lead['company_name']}: {e}")

            # Auftrag aus dem Dashboard als erledigt markieren
            _markiere_erledigt(sb, job, job_count)

        browser.close()

    print(f"\n✅ Fertig. {gefunden_gesamt} Leads in Supabase geschrieben/aktualisiert.")


if __name__ == "__main__":
    scrape()
