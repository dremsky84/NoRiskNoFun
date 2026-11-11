# Arbeitstitel: Konzept

Stand: 10.11.2026. Konzept für den Prototyp, ohne Code.

## Spielidee

Ein futuristisches Eroberungsspiel nach dem Vorbild von Risiko. Die Welt ist in Gebiete und Kontinente aufgeteilt. Du stationierst Truppen, greifst Nachbargebiete an und kontrollierst ganze Kontinente. Ziel ist die Weltherrschaft oder das Erfüllen einer Missionskarte.

Eine Partie dauert etwa 20 Minuten, rundenbasiert.

## Spielmodi

- **Solo gegen KI (Hauptmodus):** 2 bis 3 KI-Gegner. Drei Schwierigkeitsstufen.
- **WLAN-Multiplayer (Phase 2):** 2 bis 4 Spieler im selben WLAN, jeder mit eigenem Gerät. Ohne Server, per WebRTC. Der Verbindungsaufbau erfolgt über QR-Code oder kopierten Text. Kein Internet nötig.
  - Funktioniert nicht in Gäste-WLANs mit Geräte-Isolation.
- **Hot-Seat (Fallback):** Mehrere Spieler an einem Gerät, falls die WLAN-Verbindung nicht zuverlässig klappt.

## Karten

- **Drei handgebaute Karten**, je etwa 20 bis 24 Gebiete in 4 Kontinenten.
- **Zufallskarte:** Wird aus festen Regeln erzeugt (Anzahl Gebiete, Kontinente). Die Nachbarschaft ist garantiert zusammenhängend.

## Regeln

- **Ablauf pro Runde:** Verstärken, Angreifen, Verschieben (wie bei Risiko).
- **Würfelkampf wie bei Risiko:** Angreifer würfelt mit bis zu 3 Würfeln, Verteidiger mit bis zu 2. Die höchsten Würfel werden verglichen, Gleichstand geht an den Verteidiger.
- **Kontinent-Boni:** Wer einen ganzen Kontinent hält, bekommt zusätzliche Truppen pro Runde.
- **Missionskarten:** Alternative Siegbedingung neben der vollständigen Eroberung.

## Stärken von Risiko, intensiviert

- **Klare Risikoabwägung:** Vor jedem Angriff wird die Erfolgswahrscheinlichkeit angezeigt (abschaltbar).
- **Engpässe:** Karten werden so gebaut, dass Kontinente über wenige Verbindungen erreichbar sind. Dort entstehen die spannenden Kämpfe.
- **Sichtbare Bedrohung:** Truppenstärken und Grenzen sind jederzeit lesbar.
- **Kurze Züge:** Schnelle Würfelanimation, keine langen Wartezeiten.
- **KI mit Charakter:** Angreifer (riskiert viel), Verteidiger (hält Gebiete), Expansionist (greift schwache Nachbarn an).

## Technik und Veröffentlichung

Wie bei Gildenstadt:
- Vite und TypeScript, Tests mit Vitest.
- Veröffentlichung über GitHub Pages mit Workflow bei Push auf `main`.
- `base: './'`, PWA-Manifest, Service Worker, Hochformat.
- Eigenes Repo, nicht im Projekt `Project1`.

Architektur-Hinweis: Die Spiellogik wird als reine TypeScript-Module ohne Darstellung gebaut. So kann der WLAN-Modus später die Zustände zwischen den Geräten synchronisieren, ohne die Regeln neu zu schreiben.

## Entscheidungen für den Prototyp (Stand 10.11.2026)

- **KI-Gegner:** 2 oder 3 wählbar, Standard ist 2. Die Charaktere heißen Angreifer, Verteidiger und Expansionist.
- **Karten:** Drei handgebaute Karten mit je 20 Gebieten in 4 Kontinenten, dazu eine Zufallskarte.
- **Risiko-Karten:** Nicht enthalten. Verstärkung kommt nur aus Gebieten und Kontinent-Boni.
- **Missionen:** Jeder Spieler erhält zufällig entweder zwei Kontinente oder mindestens die Hälfte der Gebiete als Ziel.
- **Verschieben:** Einmal pro Zug, nur über verbundene eigene Gebiete, mindestens eine Truppe bleibt zurück.
- **Kein Zeitlimit.** Die Partie endet mit Sieg, Missionserfüllung oder Ausscheiden aller Gegner.
- **Kartengröße:** Die Zufallskarte gibt es in drei Größen: klein (20 Gebiete), mittel (32) und groß (44). Startvorrat und Kontinente wachsen mit. Die handgebauten Karten sind bisher alle klein.
- **Startaufstellung:** Wahlweise automatisch oder selbst platziert. Bei der Selbstaufstellung setzt der Mensch seine Startruppen Klick für Klick, die KI verteilt automatisch.
- **Missionen:** Ziel mindestens 5 Gebiete über dem Startbesitz. Missionen zählen erst ab Runde 4.
- **Nicht im Prototyp:** WLAN-Multiplayer und Hot-Seat (beide Phase 2).

## Offene Punkte

- Arbeitstitel und Repo-Name.
- WLAN-Verbindung auf echten Geräten testen (Android, iOS, Gäste-WLAN), sobald Phase 2 beginnt.
- Balancing der KI-Schwellen und Startvorräte nach ersten echten Partien.
