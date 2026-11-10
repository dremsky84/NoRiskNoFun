import { delaunayNachbarn, voronoiZellen } from './geometrie';
import { mische, type Rng } from './rng';
import type { Gebiet, Karte, Kontinent, Punkt } from './types';

export interface KartenDefinition {
  name: string;
  kontinente: { name: string; bonus: number }[];
  gebiete: { name: string; x: number; y: number; kontinent: number }[];
}

/** Spielfeld-Koordinaten: 0 bis 1000 in beide Richtungen. */
export const FELDGROESSE = 1000;

/** Macht aus Koordinaten eine spielbare Karte mit Zellen und Nachbarschaften. */
export function baueKarte(def: KartenDefinition): Karte {
  const punkte: Punkt[] = def.gebiete.map((g) => [g.x, g.y]);
  const nachbarn = delaunayNachbarn(punkte);
  const zellen = voronoiZellen(punkte, FELDGROESSE, FELDGROESSE);

  const gebiete: Gebiet[] = def.gebiete.map((g, id) => ({
    id,
    name: g.name,
    kontinent: g.kontinent,
    zentrum: punkte[id],
    polygon: zellen[id],
    nachbarn: nachbarn[id],
  }));

  const kontinente: Kontinent[] = def.kontinente.map((k, id) => ({
    id,
    name: k.name,
    bonus: k.bonus,
    gebiete: gebiete.filter((g) => g.kontinent === id).map((g) => g.id),
  }));

  return { name: def.name, gebiete, kontinente };
}

const GEBIETSNAMEN = [
  'Aurora', 'Kepler', 'Nyx', 'Zenit', 'Atlas', 'Vega', 'Lyra', 'Orion', 'Pulsar', 'Helios',
  'Titan', 'Callisto', 'Io', 'Europa', 'Mira', 'Sirius', 'Rigel', 'Antares', 'Deneb', 'Nova',
  'Corona', 'Eclipse', 'Meridian', 'Zephyr', 'Cygnus', 'Draco', 'Perseus', 'Lynx', 'Andromeda',
  'Hydra', 'Phoenix', 'Centaur', 'Pegasus', 'Vulpes', 'Cetus', 'Lupus', 'Ara', 'Norma', 'Pyxis',
];

const KONTINENTNAMEN = ['Nordreich', 'Ostmark', 'Südlicht', 'Westfront', 'Zentralband', 'Sternenkamm'];

const abstand = (a: Punkt, b: Punkt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Erzeugt eine zufällige Karte. Punkte halten einen Mindestabstand ein, die Kontinente
 * wachsen von zufälligen Startpunkten aus und bleiben dadurch zusammenhängend.
 */
export function zufallsDefinition(rng: Rng, anzahl = 20, kontinentAnzahl = 4): KartenDefinition {
  const punkte: Punkt[] = [];
  let minAbstand = 170;
  let versuche = 0;
  while (punkte.length < anzahl) {
    const p: Punkt = [60 + rng() * 880, 60 + rng() * 880];
    if (punkte.every((q) => abstand(p, q) >= minAbstand)) punkte.push(p);
    versuche++;
    if (versuche > 4000) {
      minAbstand *= 0.9;
      versuche = 0;
    }
  }

  const nachbarn = delaunayNachbarn(punkte);

  // Startpunkte: einer zufällig, die weiteren jeweils am weitesten entfernt von den bisherigen.
  const seeds = [Math.floor(rng() * anzahl)];
  while (seeds.length < kontinentAnzahl) {
    let beste = -1;
    let besteDistanz = -1;
    for (let i = 0; i < anzahl; i++) {
      if (seeds.includes(i)) continue;
      const d = Math.min(...seeds.map((s) => abstand(punkte[i], punkte[s])));
      if (d > besteDistanz) {
        besteDistanz = d;
        beste = i;
      }
    }
    seeds.push(beste);
  }

  // Kontinente wachsen Schritt für Schritt in benachbarte freie Gebiete.
  const kontinent = new Array<number>(anzahl).fill(-1);
  seeds.forEach((s, k) => (kontinent[s] = k));
  let geaendert = true;
  while (geaendert) {
    geaendert = false;
    for (let k = 0; k < kontinentAnzahl; k++) {
      const kandidaten: number[] = [];
      for (let i = 0; i < anzahl; i++) {
        if (kontinent[i] === -1 && nachbarn[i].some((j) => kontinent[j] === k)) kandidaten.push(i);
      }
      if (kandidaten.length > 0) {
        kontinent[kandidaten[Math.floor(rng() * kandidaten.length)]] = k;
        geaendert = true;
      }
    }
  }

  const namen = mische(GEBIETSNAMEN, rng);
  const kontinentNamen = mische(KONTINENTNAMEN, rng);
  return {
    name: 'Zufallskarte',
    kontinente: Array.from({ length: kontinentAnzahl }, (_, k) => ({
      name: kontinentNamen[k],
      bonus: 2 + Math.floor(rng() * 3),
    })),
    gebiete: punkte.map((p, i) => ({ name: namen[i], x: p[0], y: p[1], kontinent: kontinent[i] })),
  };
}
