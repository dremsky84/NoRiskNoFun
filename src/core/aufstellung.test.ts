import { describe, expect, it } from 'vitest';
import { baueKarte, zufallsDefinition } from './karten';
import { mulberry32 } from './rng';
import { aufstellungAutomatisch, beendePhase, neuesSpiel, setzeAufstellung, setzeTruppe } from './spiel';
import { ARCHIPEL } from './vordefiniert';

describe('freie Aufstellung', () => {
  it('ohne Option wird automatisch verteilt und die Partie beginnt sofort', () => {
    const z = neuesSpiel(baueKarte(ARCHIPEL), 2, 'geselle', mulberry32(4));
    expect(z.aufstellung).toBe(0);
    expect(z.verstaerkung).toBeGreaterThan(0);
  });

  it('mit Option bleiben Startruppen offen und die Partie wartet', () => {
    const z = neuesSpiel(baueKarte(ARCHIPEL), 2, 'geselle', mulberry32(4), { freieAufstellung: true });
    expect(z.aufstellung).toBeGreaterThan(0);
    expect(z.verstaerkung).toBe(0);
    expect(beendePhase(z)).toBe(false);
  });

  it('setzt genau die offenen Truppen und beginnt danach die erste Verstärkung', () => {
    const z = neuesSpiel(baueKarte(ARCHIPEL), 2, 'geselle', mulberry32(4), { freieAufstellung: true });
    const offen = z.aufstellung;
    const eigenes = z.karte.gebiete.find((g) => z.besitz[g.id] === 0)!.id;
    const vorher = z.truppen[eigenes];
    expect(setzeAufstellung(z, eigenes)).toBe(true);
    expect(z.truppen[eigenes]).toBe(vorher + 1);
    expect(z.aufstellung).toBe(offen - 1);
    while (z.aufstellung > 0) setzeAufstellung(z, eigenes);
    expect(z.verstaerkung).toBeGreaterThan(0);
    expect(setzeAufstellung(z, eigenes)).toBe(false);
  });

  it('fremdes Gebiet kann nicht gewählt werden', () => {
    const z = neuesSpiel(baueKarte(ARCHIPEL), 2, 'geselle', mulberry32(4), { freieAufstellung: true });
    const fremd = z.karte.gebiete.find((g) => z.besitz[g.id] !== 0)!.id;
    expect(setzeAufstellung(z, fremd)).toBe(false);
  });

  it('Gesamtzahl der Truppen ist unabhängig von der Aufstellungsart', () => {
    const summe = (z: { truppen: number[] }) => z.truppen.reduce((a, b) => a + b, 0);
    const auto = neuesSpiel(baueKarte(ARCHIPEL), 2, 'geselle', mulberry32(9));
    const frei = neuesSpiel(baueKarte(ARCHIPEL), 2, 'geselle', mulberry32(9), { freieAufstellung: true });
    aufstellungAutomatisch(frei, mulberry32(1));
    expect(summe(frei)).toBe(summe(auto));
    expect(frei.aufstellung).toBe(0);
    expect(setzeTruppe(frei, frei.karte.gebiete.find((g) => frei.besitz[g.id] === 0)!.id)).toBe(true);
  });
});

describe('Kartengröße', () => {
  it('Startvorrat wächst mit der Gebietsanzahl', () => {
    const klein = neuesSpiel(baueKarte(zufallsDefinition(mulberry32(3), 20)), 2, 'geselle', mulberry32(3));
    const gross = neuesSpiel(baueKarte(zufallsDefinition(mulberry32(3), 44)), 2, 'geselle', mulberry32(3));
    const summe = (z: { truppen: number[] }) => z.truppen.reduce((a, b) => a + b, 0);
    expect(summe(gross) / gross.karte.gebiete.length).toBeGreaterThan(0.5 * summe(klein) / klein.karte.gebiete.length);
  });
});
