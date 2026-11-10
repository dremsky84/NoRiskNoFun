import { describe, expect, it } from 'vitest';
import { baueKarte, zufallsDefinition } from './karten';
import { kiZug } from './ki';
import { mulberry32, type Rng } from './rng';
import {
  angreifen,
  beendePhase,
  erobern,
  kannAngreifen,
  missionErfuellt,
  neuesSpiel,
  setzeTruppe,
  verschieben,
  kannVerschieben,
  verbundeneEigene,
} from './spiel';
import { VORDEFINIERT } from './vordefiniert';
import type { Karte, Schwierigkeit, Spielzustand } from './types';

interface Bericht {
  runden: number;
  angriffe: number;
  niederlagen: number;
  eroberungen: number;
  grund: string;
  letzte: string[];
}

/**
 * Spielt eine komplette Partie für den Menschen (Spieler 0) mit einfacher Strategie:
 * verstärkt die Grenze, greift an, wenn die Siegchance passt, verschiebt ins Hinterland.
 * Jeder Sieg muss durch eine echte Bedingung ausgelöst sein.
 */
function spieleMensch(z: Spielzustand, rng: Rng, bericht: Bericht): void {
  // Verstärken: auf eigene Grenzgebiete verteilen.
  const grenzen = z.karte.gebiete.filter((g) => z.besitz[g.id] === 0 && g.nachbarn.some((n) => z.besitz[n] !== 0));
  const ziele = grenzen.length > 0 ? grenzen : z.karte.gebiete.filter((g) => z.besitz[g.id] === 0);
  while (z.verstaerkung > 0) {
    setzeTruppe(z, ziele[Math.floor(rng() * ziele.length)].id);
  }
  beendePhase(z);

  // Angreifen: solange es lohnende Ziele gibt. Verlorene Schlachten dürfen die Partie nicht beenden.
  for (let i = 0; i < 40 && z.sieger === null; i++) {
    const kandidaten: { von: number; nach: number }[] = [];
    for (const g of z.karte.gebiete) {
      for (const n of g.nachbarn) {
        if (kannAngreifen(z, g.id, n)) kandidaten.push({ von: g.id, nach: n });
      }
    }
    if (kandidaten.length === 0) break;
    const wahl = kandidaten[Math.floor(rng() * kandidaten.length)];
    if (z.truppen[wahl.von] < z.truppen[wahl.nach] - 1 && rng() < 0.6) continue;

    const vorher = z.spieler.filter((s) => s.lebt).length;
    const g = angreifen(z, wahl.von, wahl.nach, rng);
    bericht.angriffe++;
    if (!g) continue;
    if (!g.erobert) {
      bericht.niederlagen++;
      // Eine verlorene Schlacht darf die Partie nie beenden.
      expect(z.sieger, 'Niederlage darf die Partie nicht beenden').toBeNull();
      continue;
    }
    bericht.eroberungen++;
    const e = z.eroberung!;
    erobern(z, e.min + Math.floor(rng() * (e.max - e.min + 1)));
    const nachher = z.spieler.filter((s) => s.lebt).length;
    if (z.sieger !== null) {
      // Ein Sieg muss durch Ausscheiden oder Mission begründet sein.
      const begruendet = nachher === 1 || missionErfuellt(z, 0);
      expect(begruendet, `Sieg ohne Grund: ${z.siegGrund}`).toBe(true);
    }
    expect(nachher).toBeLessThanOrEqual(vorher);
  }

  // Verschieben: einmal pro Zug, falls möglich.
  beendePhase(z);
  if (z.sieger === null) {
    for (const g of z.karte.gebiete) {
      if (z.besitz[g.id] !== 0 || z.truppen[g.id] < 2) continue;
      const ziel = verbundeneEigene(z, 0, g.id).find((id) => id !== g.id && kannVerschieben(z, g.id, id));
      if (ziel !== undefined) {
        verschieben(z, g.id, ziel, z.truppen[g.id] - 1);
        break;
      }
    }
  }
  beendePhase(z);
}

function spieleKi(z: Spielzustand, rng: Rng): void {
  const gen = kiZug(z, rng);
  while (!gen.next().done) {
    // jeder KI-Schritt muss den Zustand konsistent lassen
  }
}

function spiele(karte: Karte, anzahlKi: number, schwierigkeit: Schwierigkeit, seed: number): Bericht {
  const rng = mulberry32(seed);
  const z = neuesSpiel(karte, anzahlKi, schwierigkeit, rng);
  const bericht: Bericht = { runden: 0, angriffe: 0, niederlagen: 0, eroberungen: 0, grund: '', letzte: [] };
  let zuege = 0;
  while (z.sieger === null && zuege < 300) {
    if (z.spieler[z.aktiver].ki) spieleKi(z, rng);
    else spieleMensch(z, rng, bericht);
    zuege++;
  }
  bericht.runden = z.runde;
  bericht.grund = z.sieger === null ? 'Rundenlimit erreicht' : `${z.spieler[z.sieger].name}: ${z.siegGrund}`;
  bericht.letzte = z.protokoll.slice(-4);
  // Spielende muss begründet sein.
  if (z.sieger !== null) {
    const lebende = z.spieler.filter((s) => s.lebt).length;
    expect(lebende === 1 || missionErfuellt(z, z.sieger)).toBe(true);
  }
  return bericht;
}

const SZENARIEN: { name: string; karte: () => Karte; ki: number; schwer: Schwierigkeit; seed: number }[] = [
  { name: 'Archipel, 2 KI, Geselle', karte: () => baueKarte(VORDEFINIERT.archipel), ki: 2, schwer: 'geselle', seed: 101 },
  { name: 'Gebirgsbogen, 3 KI, Meister', karte: () => baueKarte(VORDEFINIERT.gebirgsbogen), ki: 3, schwer: 'meister', seed: 202 },
  { name: 'Dreifachmeer, 2 KI, Lehrling', karte: () => baueKarte(VORDEFINIERT.dreifachmeer), ki: 2, schwer: 'lehrling', seed: 303 },
];

describe('Missionen zu Spielbeginn', () => {
  it('sind für keinen Spieler schon erfüllt', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const def of Object.values(VORDEFINIERT)) {
        const rng = mulberry32(seed);
        const z = neuesSpiel(baueKarte(def), 2 + (seed % 2), 'geselle', rng);
        for (const s of z.spieler) expect(missionErfuellt(z, s.id)).toBe(false);
      }
    }
  });
});

describe('komplette Partien', () => {
  for (const s of SZENARIEN) {
    it(`Partie: ${s.name}`, () => {
      const bericht = spiele(s.karte(), s.ki, s.schwer, s.seed);
      expect(bericht.angriffe).toBeGreaterThan(0);
      console.log(`[${s.name}] Runden ${bericht.runden}, Angriffe ${bericht.angriffe}, Niederlagen ${bericht.niederlagen}, Eroberungen ${bericht.eroberungen} – ${bericht.grund}`);
      console.log(bericht.letzte.map((z) => `    ${z}`).join('\n'));
      // Die Partie muss sich über mehrere Runden erstrecken, nicht in Runde 1 enden.
      expect(bericht.runden).toBeGreaterThanOrEqual(4);
    });
  }

  it('Zufallskarte: Partie endet nie durch eine verlorene Schlacht', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const rng = mulberry32(seed);
      const karte = baueKarte(zufallsDefinition(rng));
      spiele(karte, 2, 'geselle', seed);
    }
  });
});
