// Spielregeln und Zustand. Reine Logik ohne Darstellung, damit der spätere
// WLAN-Modus dieselben Regeln nutzen kann.

import { wuerfelKampf } from './kampf';
import { mische, type Rng } from './rng';
import type {
  Charakter,
  Gefecht,
  Karte,
  Mission,
  Phase,
  Schwierigkeit,
  Spieler,
  Spielzustand,
} from './types';

export type { Phase } from './types';

const REIHENFOLGE: readonly Phase[] = ['verstaerken', 'angreifen', 'verschieben'];

/** Gibt die nächste Phase zurück. Nach 'verschieben' beginnt die nächste Runde wieder bei 'verstaerken'. */
export function naechstePhase(phase: Phase): { phase: Phase; neueRunde: boolean } {
  const index = REIHENFOLGE.indexOf(phase);
  if (index === REIHENFOLGE.length - 1) {
    return { phase: REIHENFOLGE[0], neueRunde: true };
  }
  return { phase: REIHENFOLGE[index + 1], neueRunde: false };
}

export const SPIELER_FARBE = '#38e1ff';
export const KI_FARBEN = ['#ff4d9d', '#ffb020', '#7cff6b'];
const KI_PROFILE: { name: string; charakter: Charakter }[] = [
  { name: 'KI Atlas', charakter: 'angreifer' },
  { name: 'KI Vesta', charakter: 'verteidiger' },
  { name: 'KI Orion', charakter: 'expansionist' },
];

export const CHARAKTER_NAMEN: Record<Charakter, string> = {
  mensch: 'Mensch',
  angreifer: 'Angreifer',
  verteidiger: 'Verteidiger',
  expansionist: 'Expansionist',
};

export const PHASE_NAMEN: Record<Phase, string> = {
  verstaerken: 'Verstärken',
  angreifen: 'Angreifen',
  verschieben: 'Verschieben',
};

/** Truppen pro Runde: ein Drittel der eigenen Gebiete, mindestens 3, plus Kontinent-Boni. */
export function verstaerkungFuer(z: Spielzustand, spielerId: number): number {
  const eigene = z.besitz.filter((b) => b === spielerId).length;
  let bonus = 0;
  for (const k of z.karte.kontinente) {
    if (k.gebiete.every((id) => z.besitz[id] === spielerId)) bonus += k.bonus;
  }
  return Math.max(3, Math.floor(eigene / 3)) + bonus;
}

export function missionFortschritt(z: Spielzustand, spielerId: number): { ist: number; soll: number } {
  const mission = z.spieler[spielerId].mission;
  if (mission.art === 'gebiete') {
    return { ist: z.besitz.filter((b) => b === spielerId).length, soll: mission.anzahl };
  }
  let ist = 0;
  let soll = 0;
  for (const kid of mission.kontinente) {
    for (const gid of z.karte.kontinente[kid].gebiete) {
      soll++;
      if (z.besitz[gid] === spielerId) ist++;
    }
  }
  return { ist, soll };
}

export function missionErfuellt(z: Spielzustand, spielerId: number): boolean {
  const { ist, soll } = missionFortschritt(z, spielerId);
  return ist >= soll;
}

export function missionText(z: Spielzustand, spielerId: number): string {
  const mission: Mission = z.spieler[spielerId].mission;
  if (mission.art === 'gebiete') return `Halte ${mission.anzahl} Gebiete`;
  const namen = mission.kontinente.map((kid) => z.karte.kontinente[kid].name).join(' und ');
  return `Kontrolliere ${namen}`;
}

function missionFuer(karte: Karte, rng: Rng): Mission {
  if (rng() < 0.5 && karte.kontinente.length >= 2) {
    const [a, b] = mische(
      karte.kontinente.map((k) => k.id),
      rng,
    );
    return { art: 'kontinente', kontinente: [a, b] };
  }
  return { art: 'gebiete', anzahl: Math.ceil(karte.gebiete.length * 0.4) };
}

function protokoll(z: Spielzustand, text: string): void {
  z.protokoll.push(text);
  if (z.protokoll.length > 60) z.protokoll.shift();
}

function siegErklaeren(z: Spielzustand, spielerId: number, grund: string): void {
  z.sieger = spielerId;
  z.siegGrund = grund;
  protokoll(z, `${z.spieler[spielerId].name} gewinnt: ${grund}.`);
}

function pruefeSieg(z: Spielzustand): void {
  const lebende = z.spieler.filter((s) => s.lebt);
  if (lebende.length === 1) {
    siegErklaeren(z, lebende[0].id, 'Alle Gegner ausgeschieden');
    return;
  }
  if (missionErfuellt(z, z.aktiver)) siegErklaeren(z, z.aktiver, 'Mission erfüllt');
}

export function neuesSpiel(
  karte: Karte,
  anzahlKi: number,
  schwierigkeit: Schwierigkeit,
  rng: Rng,
): Spielzustand {
  const anzahl = Math.min(4, Math.max(2, anzahlKi + 1));
  const spieler: Spieler[] = [
    {
      id: 0,
      name: 'Du',
      ki: false,
      charakter: 'mensch',
      farbe: SPIELER_FARBE,
      mission: missionFuer(karte, rng),
      lebt: true,
    },
  ];
  for (let i = 1; i < anzahl; i++) {
    spieler.push({
      id: i,
      name: KI_PROFILE[i - 1].name,
      ki: true,
      charakter: KI_PROFILE[i - 1].charakter,
      farbe: KI_FARBEN[i - 1],
      mission: missionFuer(karte, rng),
      lebt: true,
    });
  }

  // Gebiete gleichmäßig verteilen, danach den Startvorrat auf die eigenen Gebiete setzen.
  const n = karte.gebiete.length;
  const besitz = new Array<number>(n).fill(0);
  const truppen = new Array<number>(n).fill(1);
  mische(
    karte.gebiete.map((g) => g.id),
    rng,
  ).forEach((gid, i) => {
    besitz[gid] = i % anzahl;
  });
  const vorrat = 35 - 5 * (anzahl - 2);
  for (let s = 0; s < anzahl; s++) {
    const eigene = karte.gebiete.filter((g) => besitz[g.id] === s).map((g) => g.id);
    let rest = vorrat - eigene.length;
    while (rest > 0) {
      truppen[eigene[Math.floor(rng() * eigene.length)]]++;
      rest--;
    }
  }

  const z: Spielzustand = {
    karte,
    spieler,
    besitz,
    truppen,
    aktiver: 0,
    runde: 1,
    phase: 'verstaerken',
    verstaerkung: 0,
    verschoben: false,
    eroberung: null,
    letzterAngriff: null,
    schwierigkeit,
    sieger: null,
    siegGrund: '',
    protokoll: ['Die Partie beginnt. Verstärke zuerst deine Front.'],
  };
  z.verstaerkung = verstaerkungFuer(z, 0);
  return z;
}

/** Setzt eine Truppe auf ein eigenes Gebiet. */
export function setzeTruppe(z: Spielzustand, gebiet: number): boolean {
  if (z.phase !== 'verstaerken' || z.verstaerkung <= 0 || z.sieger !== null || z.eroberung) return false;
  if (z.besitz[gebiet] !== z.aktiver) return false;
  z.truppen[gebiet]++;
  z.verstaerkung--;
  return true;
}

export function istNachbar(z: Spielzustand, a: number, b: number): boolean {
  return z.karte.gebiete[a].nachbarn.includes(b);
}

export function kannAngreifen(z: Spielzustand, von: number, nach: number): boolean {
  return (
    z.phase === 'angreifen' &&
    z.sieger === null &&
    z.eroberung === null &&
    z.besitz[von] === z.aktiver &&
    z.besitz[nach] !== z.aktiver &&
    z.truppen[von] >= 2 &&
    istNachbar(z, von, nach)
  );
}

/** Ein Kampf zwischen zwei Gebieten. Bei Eroberung muss danach mit erobern() verschoben werden. */
export function angreifen(z: Spielzustand, von: number, nach: number, rng: Rng): Gefecht | null {
  if (!kannAngreifen(z, von, nach)) return null;
  const ergebnis = wuerfelKampf(z.truppen[von], z.truppen[nach], rng);
  z.truppen[von] -= ergebnis.angreiferVerluste;
  z.truppen[nach] -= ergebnis.verteidigerVerluste;
  const erobert = z.truppen[nach] <= 0;
  const gefecht: Gefecht = { von, nach, ...ergebnis, erobert };
  z.letzterAngriff = gefecht;

  const vName = z.karte.gebiete[von].name;
  const nName = z.karte.gebiete[nach].name;
  const kopf = `${z.spieler[z.aktiver].name}: ${vName} gegen ${nName}`;
  protokoll(z, `${kopf} – Angreifer verliert ${ergebnis.angreiferVerluste}, Verteidiger verliert ${ergebnis.verteidigerVerluste}.`);

  if (erobert) {
    z.eroberung = {
      von,
      nach,
      min: ergebnis.angriffWuerfel.length,
      max: z.truppen[von] - 1,
    };
  }
  return gefecht;
}

/** Nach einer Eroberung: Truppen in das neue Gebiet verschieben. */
export function erobern(z: Spielzustand, anzahl: number): boolean {
  const e = z.eroberung;
  if (!e || anzahl < e.min || anzahl > e.max) return false;
  const alt = z.besitz[e.nach];
  z.truppen[e.von] -= anzahl;
  z.truppen[e.nach] = anzahl;
  z.besitz[e.nach] = z.aktiver;
  z.eroberung = null;
  protokoll(z, `${z.spieler[z.aktiver].name} erobert ${z.karte.gebiete[e.nach].name} mit ${anzahl} Truppen.`);

  if (!z.besitz.includes(alt)) {
    z.spieler[alt].lebt = false;
    protokoll(z, `${z.spieler[alt].name} ist ausgeschieden.`);
  }
  pruefeSieg(z);
  return true;
}

/** Alle Gebiete, die vom Startgebiet aus über eigene, verbundene Gebiete erreichbar sind (inklusive Start). */
export function verbundeneEigene(z: Spielzustand, spielerId: number, start: number): number[] {
  if (z.besitz[start] !== spielerId) return [];
  const besucht = new Set<number>([start]);
  const warteschlange = [start];
  while (warteschlange.length > 0) {
    const v = warteschlange.shift() as number;
    for (const w of z.karte.gebiete[v].nachbarn) {
      if (!besucht.has(w) && z.besitz[w] === spielerId) {
        besucht.add(w);
        warteschlange.push(w);
      }
    }
  }
  return [...besucht];
}

export function kannVerschieben(z: Spielzustand, von: number, nach: number): boolean {
  return (
    z.phase === 'verschieben' &&
    z.sieger === null &&
    !z.verschoben &&
    z.eroberung === null &&
    von !== nach &&
    z.besitz[von] === z.aktiver &&
    z.besitz[nach] === z.aktiver &&
    z.truppen[von] >= 2 &&
    verbundeneEigene(z, z.aktiver, von).includes(nach)
  );
}

/** Einmal pro Zug: Truppen über verbundene eigene Gebiete verschieben, mindestens eine bleibt zurück. */
export function verschieben(z: Spielzustand, von: number, nach: number, anzahl: number): boolean {
  if (!kannVerschieben(z, von, nach) || anzahl < 1 || anzahl > z.truppen[von] - 1) return false;
  z.truppen[von] -= anzahl;
  z.truppen[nach] += anzahl;
  z.verschoben = true;
  protokoll(z, `${z.spieler[z.aktiver].name} verschiebt ${anzahl} Truppen nach ${z.karte.gebiete[nach].name}.`);
  return true;
}

/** Schaltet zur nächsten Phase; nach 'verschieben' ist der nächste lebende Spieler am Zug. */
export function beendePhase(z: Spielzustand): boolean {
  if (z.sieger !== null || z.eroberung !== null) return false;
  if (z.phase === 'verstaerken') {
    if (z.verstaerkung > 0) return false;
    z.phase = 'angreifen';
  } else if (z.phase === 'angreifen') {
    z.phase = 'verschieben';
  } else {
    naechsterZug(z);
  }
  z.letzterAngriff = null;
  return true;
}

function naechsterZug(z: Spielzustand): void {
  const n = z.spieler.length;
  const alt = z.aktiver;
  let neu = alt;
  do {
    neu = (neu + 1) % n;
  } while (!z.spieler[neu].lebt && neu !== alt);
  if (neu <= alt) z.runde += 1;
  z.aktiver = neu;
  z.phase = 'verstaerken';
  z.verschoben = false;
  z.verstaerkung = verstaerkungFuer(z, neu);
  protokoll(z, `Runde ${z.runde}: ${z.spieler[neu].name} ist am Zug.`);
}
