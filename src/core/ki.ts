import { siegChance } from './kampf';
import {
  angreifen,
  beendePhase,
  erobern,
  kannAngreifen,
  setzeTruppe,
  verbundeneEigene,
  verschieben,
} from './spiel';
import type { Rng } from './rng';
import type { Charakter, Schwierigkeit, Spielzustand } from './types';

interface Profil {
  schwelle: number; // Mindest-Siegchance für einen Angriff
  nachziehen: number; // Anteil der möglichen Truppen, die nach einer Eroberung nachrücken
  verschiebeChance: number;
  expansion: boolean; // bevorzugt schwache Ziele
}

const BASIS: Record<Schwierigkeit, Profil> = {
  lehrling: { schwelle: 0.7, nachziehen: 0, verschiebeChance: 0.4, expansion: false },
  geselle: { schwelle: 0.5, nachziehen: 0.5, verschiebeChance: 0.9, expansion: false },
  meister: { schwelle: 0.35, nachziehen: 1, verschiebeChance: 1, expansion: false },
};

export function kiProfil(schwierigkeit: Schwierigkeit, charakter: Charakter): Profil {
  const p: Profil = { ...BASIS[schwierigkeit] };
  if (charakter === 'angreifer') p.schwelle -= 0.08;
  if (charakter === 'verteidiger') {
    p.schwelle += 0.12;
    p.nachziehen = 0;
  }
  if (charakter === 'expansionist') p.expansion = true;
  return p;
}

const feindTruppen = (z: Spielzustand, spieler: number, gebiet: number): number =>
  z.karte.gebiete[gebiet].nachbarn
    .filter((n) => z.besitz[n] !== spieler)
    .reduce((summe, n) => summe + z.truppen[n], 0);

const istGrenze = (z: Spielzustand, spieler: number, gebiet: number): boolean =>
  z.karte.gebiete[gebiet].nachbarn.some((n) => z.besitz[n] !== spieler);

function besterGrenzplatz(z: Spielzustand, spieler: number, rng: Rng): number {
  const eigene = z.karte.gebiete.filter((g) => z.besitz[g.id] === spieler).map((g) => g.id);
  let beste = eigene[0];
  let besterWert = -Infinity;
  for (const id of eigene) {
    const wert = feindTruppen(z, spieler, id) + rng() * 0.5;
    if (wert > besterWert) {
      besterWert = wert;
      beste = id;
    }
  }
  return beste;
}

function besterAngriff(z: Spielzustand, spieler: number, profil: Profil): { von: number; nach: number } | null {
  let beste: { von: number; nach: number; wert: number } | null = null;
  for (const g of z.karte.gebiete) {
    if (z.besitz[g.id] !== spieler || z.truppen[g.id] < 2) continue;
    for (const nach of g.nachbarn) {
      if (!kannAngreifen(z, g.id, nach)) continue;
      const p = siegChance(z.truppen[g.id], z.truppen[nach]);
      if (p < profil.schwelle) continue;
      const wert = p + (profil.expansion && z.truppen[nach] <= 2 ? 0.1 : 0);
      if (!beste || wert > beste.wert) beste = { von: g.id, nach, wert };
    }
  }
  return beste ? { von: beste.von, nach: beste.nach } : null;
}

function besterVerschieben(
  z: Spielzustand,
  spieler: number,
): { von: number; nach: number; anzahl: number } | null {
  let beste: { von: number; nach: number; anzahl: number; wert: number } | null = null;
  for (const g of z.karte.gebiete) {
    const v = g.id;
    if (z.besitz[v] !== spieler || z.truppen[v] < 2 || istGrenze(z, spieler, v)) continue;
    for (const w of verbundeneEigene(z, spieler, v)) {
      if (w === v || !istGrenze(z, spieler, w)) continue;
      const wert = feindTruppen(z, spieler, w);
      if (wert > 0 && (!beste || wert > beste.wert)) {
        beste = { von: v, nach: w, anzahl: z.truppen[v] - 1, wert };
      }
    }
  }
  return beste ? { von: beste.von, nach: beste.nach, anzahl: beste.anzahl } : null;
}

/**
 * Führt den Zug einer KI Schritt für Schritt aus. Nach jedem Schritt wird pausiert,
 * damit die Oberfläche die Züge sichtbar machen kann.
 */
export function* kiZug(z: Spielzustand, rng: Rng): Generator<void> {
  const ki = z.aktiver;
  const profil = kiProfil(z.schwierigkeit, z.spieler[ki].charakter);

  while (z.verstaerkung > 0 && z.sieger === null) {
    setzeTruppe(z, besterGrenzplatz(z, ki, rng));
    yield;
  }
  beendePhase(z);
  yield;

  for (let i = 0; i < 60 && z.sieger === null; i++) {
    const zug = besterAngriff(z, ki, profil);
    if (!zug) break;
    angreifen(z, zug.von, zug.nach, rng);
    yield;
    const e = z.eroberung;
    if (e) {
      erobern(z, e.min + Math.round((e.max - e.min) * profil.nachziehen));
      yield;
    }
  }
  if (z.sieger !== null) return;

  beendePhase(z);
  yield;

  if (rng() < profil.verschiebeChance) {
    const zug = besterVerschieben(z, ki);
    if (zug) {
      verschieben(z, zug.von, zug.nach, zug.anzahl);
      yield;
    }
  }
  beendePhase(z);
  yield;
}
