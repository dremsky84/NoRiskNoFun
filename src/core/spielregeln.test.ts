import { describe, expect, it } from 'vitest';
import { baueKarte, zufallsDefinition } from './karten';
import { kiZug } from './ki';
import {
  angreifen,
  beendePhase,
  erobern,
  kannAngreifen,
  missionErfuellt,
  neuesSpiel,
  setzeTruppe,
  verschieben,
  verstaerkungFuer,
} from './spiel';
import { mulberry32 } from './rng';
import { ARCHIPEL } from './vordefiniert';
import type { Spielzustand } from './types';

function spielStart(seed: number, anzahlKi = 2): Spielzustand {
  const rng = mulberry32(seed);
  const karte = baueKarte(zufallsDefinition(rng));
  return neuesSpiel(karte, anzahlKi, 'geselle', rng);
}

/** Prüft, dass der Zustand konsistent ist. Während einer offenen Eroberung hat das Ziel 0 Truppen. */
function invarianten(z: Spielzustand): void {
  z.besitz.forEach((b, i) => {
    expect(b).toBeGreaterThanOrEqual(0);
    expect(z.spieler[b]).toBeDefined();
    const offeneEroberung = z.eroberung !== null && z.eroberung.nach === i;
    expect(z.truppen[i]).toBeGreaterThanOrEqual(offeneEroberung ? 0 : 1);
  });
  for (const s of z.spieler) {
    if (!s.lebt) expect(z.besitz.includes(s.id)).toBe(false);
  }
}

describe('Verstärkung', () => {
  it('mindestens 3 Truppen, plus Kontinent-Bonus', () => {
    const z = spielStart(3);
    z.besitz.fill(1);
    z.besitz[0] = 0;
    expect(verstaerkungFuer(z, 0)).toBe(3);
    // Spieler 1 hält alles bis auf ein Gebiet: 19 Gebiete / 3 = 6, plus Boni aller Kontinente.
    const bonus = z.karte.kontinente
      .filter((k) => k.gebiete.every((id) => z.besitz[id] === 1))
      .reduce((s, k) => s + k.bonus, 0);
    expect(verstaerkungFuer(z, 1)).toBe(Math.floor(19 / 3) + bonus);
  });
});

describe('Startzustand', () => {
  it('verteilt alle Gebiete und jeder Spieler hat mindestens eines', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const z = spielStart(seed, seed % 2 === 0 ? 3 : 2);
      invarianten(z);
      for (const s of z.spieler) expect(z.besitz.includes(s.id)).toBe(true);
      expect(z.phase).toBe('verstaerken');
      expect(z.verstaerkung).toBeGreaterThan(0);
    }
  });
});

describe('Phasen', () => {
  it('Verstärken muss vollständig eingesetzt sein', () => {
    const z = spielStart(5);
    expect(beendePhase(z)).toBe(false);
    const eigenes = z.karte.gebiete.find((g) => z.besitz[g.id] === 0)!.id;
    while (z.verstaerkung > 0) expect(setzeTruppe(z, eigenes)).toBe(true);
    expect(beendePhase(z)).toBe(true);
    expect(z.phase).toBe('angreifen');
  });

  it('nach Verschieben ist der nächste Spieler am Zug, Runde zählt hoch', () => {
    const z = spielStart(6, 2);
    z.phase = 'verschieben';
    z.aktiver = 2;
    beendePhase(z);
    expect(z.aktiver).toBe(0);
    expect(z.runde).toBe(2);
    expect(z.phase).toBe('verstaerken');
  });
});

describe('Angriff und Eroberung', () => {
  it('nur gegen benachbarte Feinde mit mindestens zwei Truppen', () => {
    const z = spielStart(8);
    z.phase = 'angreifen';
    const eigen = z.karte.gebiete.find((g) => z.besitz[g.id] === 0)!;
    const fremd = eigen.nachbarn.find((n) => z.besitz[n] !== 0);
    const fern = z.karte.gebiete.find((g) => z.besitz[g.id] !== 0 && !eigen.nachbarn.includes(g.id))!;
    z.truppen[eigen.id] = 5;
    if (fremd !== undefined) expect(kannAngreifen(z, eigen.id, fremd)).toBe(true);
    expect(kannAngreifen(z, eigen.id, fern.id)).toBe(false);
    z.truppen[eigen.id] = 1;
    if (fremd !== undefined) expect(kannAngreifen(z, eigen.id, fremd)).toBe(false);
  });

  it('Eroberung verlangt eine Truppenzahl im erlaubten Bereich', () => {
    const z = spielStart(9);
    z.phase = 'angreifen';
    const eigen = z.karte.gebiete.find((g) => z.besitz[g.id] === 0 && g.nachbarn.some((n) => z.besitz[n] !== 0))!;
    const ziel = eigen.nachbarn.find((n) => z.besitz[n] !== 0)!;
    z.truppen[eigen.id] = 10;
    z.truppen[ziel] = 1;
    // Kämpfe, bis das Ziel fällt oder der Angreifer zu schwach wird.
    let rng = mulberry32(42);
    let g = angreifen(z, eigen.id, ziel, rng);
    let versuche = 0;
    while (g && !g.erobert && versuche < 50) {
      g = angreifen(z, eigen.id, ziel, rng);
      versuche++;
    }
    expect(z.eroberung).not.toBeNull();
    const e = z.eroberung!;
    expect(erobern(z, e.max + 1)).toBe(false);
    expect(erobern(z, e.min)).toBe(true);
    expect(z.besitz[ziel]).toBe(0);
    invarianten(z);
  });
});

describe('Verschieben', () => {
  it('nur über verbundene eigene Gebiete, einmal pro Zug', () => {
    const z = spielStart(11);
    z.phase = 'verschieben';
    const start = z.karte.gebiete.find((g) => z.besitz[g.id] === 0)!.id;
    z.truppen[start] = 6;
    const nachbar = z.karte.gebiete[start].nachbarn.find((n) => z.besitz[n] === 0);
    if (nachbar !== undefined) {
      expect(verschieben(z, start, nachbar, 2)).toBe(true);
      expect(verschieben(z, start, nachbar, 1)).toBe(false);
    }
  });
});

describe('Mission', () => {
  it('Gebiete-Mission ist erfüllt, wenn genug Gebiete gehalten werden', () => {
    const z = spielStart(12);
    z.spieler[0].mission = { art: 'gebiete', anzahl: 3 };
    z.besitz.fill(1);
    z.besitz[0] = 0;
    z.besitz[1] = 0;
    expect(missionErfuellt(z, 0)).toBe(false);
    z.besitz[2] = 0;
    expect(missionErfuellt(z, 0)).toBe(true);
  });
});

describe('KI', () => {
  it('spielt Züge ohne Regelverletzung und hält die Invarianten', () => {
    for (let seed = 20; seed < 26; seed++) {
      const rng = mulberry32(seed);
      const karte = baueKarte(ARCHIPEL);
      const z = neuesSpiel(karte, 3, seed % 2 === 0 ? 'meister' : 'lehrling', rng);
      let schritte = 0;
      while (z.sieger === null && schritte < 400) {
        if (z.spieler[z.aktiver].ki) {
          const gen = kiZug(z, rng);
          while (!gen.next().done) invarianten(z);
        } else {
          // Mensch: Restliche Truppen platzieren und Phasen überspringen.
          while (z.verstaerkung > 0) setzeTruppe(z, z.karte.gebiete.find((g) => z.besitz[g.id] === 0)!.id);
          beendePhase(z);
          beendePhase(z);
          beendePhase(z);
        }
        schritte++;
      }
      invarianten(z);
      expect(z.runde).toBeGreaterThanOrEqual(1);
    }
  });
});
