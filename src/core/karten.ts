import { delaunayNachbarn, voronoiZellen } from './geometrie';
import { mische, type Rng } from './rng';
import type { Feld, Gebiet, Karte, Kontinent, Punkt } from './types';

export interface KartenDefinition {
  name: string;
  kontinente: { name: string; bonus: number }[];
  gebiete: { name: string; x: number; y: number; kontinent: number }[];
  /** Ozeane: unbetretbar, trennen Gebiete. */
  ozeane: { x: number; y: number }[];
  /** Gebirge: unbetretbar, bilden Barrieren mit Lücken (Pässen). */
  gebirge: { x: number; y: number }[];
  /** Optionale Seewege per Gebietsname. Fehlende Verbindungen werden automatisch ergänzt. */
  seewege?: [string, string][];
}

/** Spielfeld-Koordinaten: 0 bis 1000 in beide Richtungen. */
export const FELDGROESSE = 1000;

const abstand = (a: Punkt, b: Punkt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Zerlegt die Gebiete in Teilgraphen (Zusammenhangskomponenten). */
function komponenten(nachbarn: Set<number>[]): number[][] {
  const besucht = new Set<number>();
  const ergebnis: number[][] = [];
  for (let start = 0; start < nachbarn.length; start++) {
    if (besucht.has(start)) continue;
    const gruppe: number[] = [];
    const schlange = [start];
    besucht.add(start);
    while (schlange.length > 0) {
      const v = schlange.shift() as number;
      gruppe.push(v);
      for (const w of nachbarn[v]) {
        if (!besucht.has(w)) {
          besucht.add(w);
          schlange.push(w);
        }
      }
    }
    ergebnis.push(gruppe);
  }
  return ergebnis;
}

/**
 * Macht aus einer Definition eine spielbare Karte. Ozeane und Gebirge werden als Felder
 * gezeichnet und unterbrechen Landgrenzen. Zusammenhängende Teilgebiete bleiben über
 * Seewege erreichbar, damit jede Partie gewinnbar ist.
 */
export function baueKarte(def: KartenDefinition): Karte {
  const n = def.gebiete.length;
  const punkte: Punkt[] = [
    ...def.gebiete.map((g): Punkt => [g.x, g.y]),
    ...def.ozeane.map((o): Punkt => [o.x, o.y]),
    ...def.gebirge.map((b): Punkt => [b.x, b.y]),
  ];
  const nb = delaunayNachbarn(punkte);
  const zellen = voronoiZellen(punkte, FELDGROESSE, FELDGROESSE);

  // Nur Landgrenzen zwischen Gebieten zählen. Felder dazwischen trennen.
  const nachbarn: Set<number>[] = Array.from({ length: n }, (_, i) => new Set(nb[i].filter((j) => j < n)));
  const seewege: [number, number][] = [];
  const verbinde = (a: number, b: number): void => {
    if (a === b || nachbarn[a].has(b)) return;
    nachbarn[a].add(b);
    nachbarn[b].add(a);
    seewege.push([Math.min(a, b), Math.max(a, b)]);
  };

  const nummer = new Map(def.gebiete.map((g, i) => [g.name, i]));
  for (const [a, b] of def.seewege ?? []) {
    const ia = nummer.get(a);
    const ib = nummer.get(b);
    if (ia !== undefined && ib !== undefined) verbinde(ia, ib);
  }

  // Getrennte Teilgebiete über den kürzesten Seeweg verbinden, bis alles zusammenhängt.
  for (;;) {
    const gruppen = komponenten(nachbarn);
    if (gruppen.length <= 1) break;
    let bestA = -1;
    let bestB = -1;
    let bestDistanz = Infinity;
    for (const a of gruppen[0]) {
      for (let b = 0; b < n; b++) {
        if (gruppen[0].includes(b)) continue;
        const d = abstand(punkte[a], punkte[b]);
        if (d < bestDistanz) {
          bestDistanz = d;
          bestA = a;
          bestB = b;
        }
      }
    }
    verbinde(bestA, bestB);
  }

  const gebiete: Gebiet[] = def.gebiete.map((g, id) => ({
    id,
    name: g.name,
    kontinent: g.kontinent,
    zentrum: punkte[id],
    polygon: zellen[id],
    nachbarn: [...nachbarn[id]].sort((a, b) => a - b),
  }));

  const kontinente: Kontinent[] = def.kontinente.map((k, id) => ({
    id,
    name: k.name,
    bonus: k.bonus,
    gebiete: gebiete.filter((g) => g.kontinent === id).map((g) => g.id),
  }));

  const felder: Feld[] = punkte.slice(n).map((zentrum, k) => ({
    typ: k < def.ozeane.length ? 'ozean' : 'gebirge',
    zentrum,
    polygon: zellen[n + k],
  }));

  return { name: def.name, gebiete, kontinente, felder, seewege };
}

const GEBIETSNAMEN = [
  'Aurora', 'Kepler', 'Nyx', 'Zenit', 'Atlas', 'Vega', 'Lyra', 'Orion', 'Pulsar', 'Helios',
  'Titan', 'Callisto', 'Io', 'Europa', 'Mira', 'Sirius', 'Rigel', 'Antares', 'Deneb', 'Nova',
  'Corona', 'Eclipse', 'Meridian', 'Zephyr', 'Cygnus', 'Draco', 'Perseus', 'Lynx', 'Andromeda',
  'Hydra', 'Phoenix', 'Centaur', 'Pegasus', 'Vulpes', 'Cetus', 'Lupus', 'Ara', 'Norma', 'Pyxis',
];

const KONTINENTNAMEN = ['Nordreich', 'Ostmark', 'Südlicht', 'Westfront', 'Zentralband', 'Sternenkamm'];

/** Punkte mit Mindestabstand zufällig platzieren. Der Abstand wird bei Bedarf gelockert. */
function platziere(rng: Rng, anzahl: number, minAbstand: number, bestehend: Punkt[]): Punkt[] {
  const neu: Punkt[] = [];
  let abstandMin = minAbstand;
  let versuche = 0;
  while (neu.length < anzahl) {
    const p: Punkt = [60 + rng() * 880, 60 + rng() * 880];
    if ([...bestehend, ...neu].every((q) => abstand(p, q) >= abstandMin)) neu.push(p);
    versuche++;
    if (versuche > 4000) {
      abstandMin *= 0.9;
      versuche = 0;
    }
  }
  return neu;
}

/**
 * Erzeugt eine zufällige Karte mit Gebieten, Ozeanen und Gebirgen. Die Kontinente wachsen
 * von zufälligen Startpunkten aus über Landgrenzen; Gebiete ohne Anschluss werden dem
 * nächstgelegenen Kontinent zugeschlagen.
 */
export function zufallsDefinition(
  rng: Rng,
  anzahl = 20,
  kontinentAnzahl = 4,
  ozeanAnzahl = 5,
  gebirgsAnzahl = 3,
): KartenDefinition {
  const gebietPunkte = platziere(rng, anzahl, 170, []);
  const ozeanPunkte = platziere(rng, ozeanAnzahl, 130, gebietPunkte);
  const gebirgsPunkte = platziere(rng, gebirgsAnzahl, 130, [...gebietPunkte, ...ozeanPunkte]);
  const alle = [...gebietPunkte, ...ozeanPunkte, ...gebirgsPunkte];

  // Landgrenzen: Delaunay über alle Punkte, nur Gebiet-Gebiet-Kanten behalten.
  const nb = delaunayNachbarn(alle);
  const land = Array.from({ length: anzahl }, (_, i) => nb[i].filter((j) => j < anzahl));

  // Startpunkte: einer zufällig, die weiteren jeweils am weitesten entfernt von den bisherigen.
  const seeds = [Math.floor(rng() * anzahl)];
  while (seeds.length < kontinentAnzahl) {
    let beste = -1;
    let besteDistanz = -1;
    for (let i = 0; i < anzahl; i++) {
      if (seeds.includes(i)) continue;
      const d = Math.min(...seeds.map((s) => abstand(gebietPunkte[i], gebietPunkte[s])));
      if (d > besteDistanz) {
        besteDistanz = d;
        beste = i;
      }
    }
    seeds.push(beste);
  }

  const kontinent = new Array<number>(anzahl).fill(-1);
  seeds.forEach((s, k) => (kontinent[s] = k));
  let geaendert = true;
  while (geaendert) {
    geaendert = false;
    for (let k = 0; k < kontinentAnzahl; k++) {
      const kandidaten: number[] = [];
      for (let i = 0; i < anzahl; i++) {
        if (kontinent[i] === -1 && land[i].some((j) => kontinent[j] === k)) kandidaten.push(i);
      }
      if (kandidaten.length > 0) {
        kontinent[kandidaten[Math.floor(rng() * kandidaten.length)]] = k;
        geaendert = true;
      }
    }
  }
  // Gebiete ohne Landanschluss: nächster bereits zugeordneter Kontinent.
  for (let i = 0; i < anzahl; i++) {
    if (kontinent[i] !== -1) continue;
    let nah = -1;
    let nahDistanz = Infinity;
    for (let j = 0; j < anzahl; j++) {
      if (kontinent[j] === -1) continue;
      const d = abstand(gebietPunkte[i], gebietPunkte[j]);
      if (d < nahDistanz) {
        nahDistanz = d;
        nah = j;
      }
    }
    kontinent[i] = kontinent[nah];
  }

  const namen = mische(GEBIETSNAMEN, rng);
  const kontinentNamen = mische(KONTINENTNAMEN, rng);
  return {
    name: 'Zufallskarte',
    kontinente: Array.from({ length: kontinentAnzahl }, (_, k) => ({
      name: kontinentNamen[k],
      bonus: 2 + Math.floor(rng() * 3),
    })),
    gebiete: gebietPunkte.map((p, i) => ({ name: namen[i], x: p[0], y: p[1], kontinent: kontinent[i] })),
    ozeane: ozeanPunkte.map((p) => ({ x: p[0], y: p[1] })),
    gebirge: gebirgsPunkte.map((p) => ({ x: p[0], y: p[1] })),
  };
}
