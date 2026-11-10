import { describe, expect, it } from 'vitest';
import { naechstePhase } from './spiel';

describe('naechstePhase', () => {
  it('geht von Verstärken zu Angreifen ohne neue Runde', () => {
    expect(naechstePhase('verstaerken')).toEqual({ phase: 'angreifen', neueRunde: false });
  });

  it('geht von Angreifen zu Verschieben ohne neue Runde', () => {
    expect(naechstePhase('angreifen')).toEqual({ phase: 'verschieben', neueRunde: false });
  });

  it('startet nach Verschieben eine neue Runde bei Verstärken', () => {
    expect(naechstePhase('verschieben')).toEqual({ phase: 'verstaerken', neueRunde: true });
  });
});
