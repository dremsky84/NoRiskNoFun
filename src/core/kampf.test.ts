import { describe, expect, it } from 'vitest';
import { ausgaenge, siegChance, wuerfelKampf } from './kampf';
import { mulberry32 } from './rng';

describe('Würfelkampf', () => {
  it('Verlust-Verteilung summiert sich auf 1', () => {
    for (const [na, nd] of [
      [1, 1],
      [2, 2],
      [3, 2],
    ]) {
      const summe = ausgaenge(na, nd).reduce((s, o) => s + o.p, 0);
      expect(summe).toBeCloseTo(1, 10);
    }
  });

  it('Ein Würfel gegen einen Würfel: Angreifer gewinnt in 15 von 36 Fällen', () => {
    expect(siegChance(2, 1)).toBeCloseTo(15 / 36, 10);
  });

  it('mehr Truppen erhöhen die Siegchance', () => {
    expect(siegChance(10, 5)).toBeGreaterThan(siegChance(3, 5));
    expect(siegChance(3, 5)).toBeGreaterThan(siegChance(2, 5));
  });

  it('ohne Angreifer-Truppen kann nicht angegriffen werden', () => {
    expect(siegChance(1, 3)).toBe(0);
    expect(siegChance(5, 0)).toBe(1);
  });

  it('echte Würfe halten die Verlust-Regeln ein', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 500; i++) {
      const a = 2 + Math.floor(rng() * 10);
      const d = 1 + Math.floor(rng() * 10);
      const r = wuerfelKampf(a, d, rng);
      const paare = Math.min(Math.min(3, a - 1), Math.min(2, d));
      expect(r.angreiferVerluste + r.verteidigerVerluste).toBe(paare);
      expect(r.angriffWuerfel.length).toBe(Math.min(3, a - 1));
      expect(r.verteidigWuerfel.length).toBe(Math.min(2, d));
    }
  });
});
