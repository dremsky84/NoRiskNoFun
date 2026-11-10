import { describe, expect, it } from 'vitest';
import { baueKarte, zufallsDefinition } from './karten';
import { mulberry32 } from './rng';
import { VORDEFINIERT } from './vordefiniert';
import type { Karte } from './types';

function istZusammenhaengend(karte: Karte): boolean {
  const alle = karte.gebiete.map((g) => g.id);
  const besucht = new Set<number>([alle[0]]);
  const schlange = [alle[0]];
  while (schlange.length > 0) {
    const v = schlange.shift() as number;
    for (const w of karte.gebiete[v].nachbarn) {
      if (!besucht.has(w)) {
        besucht.add(w);
        schlange.push(w);
      }
    }
  }
  return besucht.size === alle.length;
}

function pruefeKarte(karte: Karte): void {
  for (const g of karte.gebiete) {
    expect(g.nachbarn.length).toBeGreaterThanOrEqual(1);
    expect(g.nachbarn).not.toContain(g.id);
    for (const n of g.nachbarn) {
      expect(karte.gebiete[n].nachbarn).toContain(g.id);
    }
    expect(g.polygon.length).toBeGreaterThanOrEqual(3);
  }
  for (const [a, b] of karte.seewege) {
    expect(karte.gebiete[a].nachbarn).toContain(b);
  }
  expect(istZusammenhaengend(karte)).toBe(true);
}

describe('vordefinierte Karten', () => {
  for (const [id, def] of Object.entries(VORDEFINIERT)) {
    it(`${id}: Gebiete, Ozeane und Gebirge vorhanden, alles erreichbar`, () => {
      const karte = baueKarte(def);
      expect(karte.gebiete.length).toBeGreaterThanOrEqual(20);
      expect(karte.kontinente.length).toBe(4);
      expect(karte.felder.filter((f) => f.typ === 'ozean').length).toBeGreaterThan(0);
      expect(karte.felder.filter((f) => f.typ === 'gebirge').length).toBeGreaterThan(0);
      pruefeKarte(karte);
    });
  }
  it('eingetragene Seewege erscheinen als Nachbarschaft', () => {
    const karte = baueKarte(VORDEFINIERT.archipel);
    expect(karte.seewege.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Zufallskarte', () => {
  it('ist für mehrere Startwerte zusammenhängend und enthält Ozeane und Gebirge', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const karte = baueKarte(zufallsDefinition(mulberry32(seed)));
      expect(karte.gebiete.length).toBe(20);
      expect(karte.felder.length).toBe(8);
      pruefeKarte(karte);
    }
  });
});
