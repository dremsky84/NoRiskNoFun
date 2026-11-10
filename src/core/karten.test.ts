import { describe, expect, it } from 'vitest';
import { baueKarte, zufallsDefinition } from './karten';
import { mulberry32 } from './rng';
import { VORDEFINIERT } from './vordefiniert';
import type { Karte } from './types';

function istZusammenhaengend(karte: Karte, gebietIds: number[]): boolean {
  if (gebietIds.length === 0) return true;
  const menge = new Set(gebietIds);
  const besucht = new Set<number>([gebietIds[0]]);
  const schlange = [gebietIds[0]];
  while (schlange.length > 0) {
    const v = schlange.shift() as number;
    for (const w of karte.gebiete[v].nachbarn) {
      if (menge.has(w) && !besucht.has(w)) {
        besucht.add(w);
        schlange.push(w);
      }
    }
  }
  return besucht.size === gebietIds.length;
}

function pruefeKarte(karte: Karte): void {
  for (const g of karte.gebiete) {
    for (const n of g.nachbarn) {
      expect(karte.gebiete[n].nachbarn).toContain(g.id);
    }
    expect(g.polygon.length).toBeGreaterThanOrEqual(3);
  }
  for (const k of karte.kontinente) {
    expect(istZusammenhaengend(karte, k.gebiete)).toBe(true);
  }
  expect(istZusammenhaengend(karte, karte.gebiete.map((g) => g.id))).toBe(true);
}

describe('vordefinierte Karten', () => {
  for (const [id, def] of Object.entries(VORDEFINIERT)) {
    it(`${id}: 20 Gebiete, zusammenhängend, Kontinente zusammenhängend`, () => {
      const karte = baueKarte(def);
      expect(karte.gebiete.length).toBe(20);
      expect(karte.kontinente.length).toBe(4);
      pruefeKarte(karte);
    });
  }
});

describe('Zufallskarte', () => {
  it('ist für mehrere Startwerte zusammenhängend', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const karte = baueKarte(zufallsDefinition(mulberry32(seed)));
      expect(karte.gebiete.length).toBe(20);
      pruefeKarte(karte);
    }
  });
});
