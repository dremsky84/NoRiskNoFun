import { wuerfel, type Rng } from './rng';

// Risiko-Würfelkampf: Angreifer würfelt mit bis zu 3 Würfeln (mindestens 1 Truppe bleibt zurück),
// Verteidiger mit bis zu 2. Die höchsten Würfel werden paarweise verglichen.
// Gleichstand gewinnt der Verteidiger.

export interface WuerfelAusgang {
  la: number; // Verluste des Angreifers
  ld: number; // Verluste des Verteidigers
  p: number; // Wahrscheinlichkeit
}

const ausgangsCache = new Map<string, WuerfelAusgang[]>();

/** Exakte Verteilung der Verluste für na Angreifer- und nd Verteidiger-Würfel. */
export function ausgaenge(na: number, nd: number): WuerfelAusgang[] {
  const schluessel = `${na}:${nd}`;
  const vorhanden = ausgangsCache.get(schluessel);
  if (vorhanden) return vorhanden;

  const anzahlWuerfel = na + nd;
  const gesamt = 6 ** anzahlWuerfel;
  const zaehler = new Map<string, { la: number; ld: number; n: number }>();

  for (let r = 0; r < gesamt; r++) {
    let rest = r;
    const werte: number[] = [];
    for (let i = 0; i < anzahlWuerfel; i++) {
      werte.push((rest % 6) + 1);
      rest = Math.floor(rest / 6);
    }
    const angriff = werte.slice(0, na).sort((x, y) => y - x);
    const verteidigung = werte.slice(na).sort((x, y) => y - x);
    let la = 0;
    let ld = 0;
    for (let m = 0; m < Math.min(na, nd); m++) {
      if (angriff[m] > verteidigung[m]) ld++;
      else la++;
    }
    const k = `${la}:${ld}`;
    const eintrag = zaehler.get(k);
    if (eintrag) eintrag.n++;
    else zaehler.set(k, { la, ld, n: 1 });
  }

  const ergebnis = [...zaehler.values()].map((e) => ({ la: e.la, ld: e.ld, p: e.n / gesamt }));
  ausgangsCache.set(schluessel, ergebnis);
  return ergebnis;
}

const chanceCache = new Map<number, number>();

/** Wahrscheinlichkeit, dass der Angreifer das Gebiet mit diesen Truppen vollständig erobert. */
export function siegChance(angreifer: number, verteidiger: number): number {
  if (verteidiger <= 0) return 1;
  if (angreifer < 2) return 0;
  const schluessel = angreifer * 10000 + verteidiger;
  const vorhanden = chanceCache.get(schluessel);
  if (vorhanden !== undefined) return vorhanden;

  const na = Math.min(3, angreifer - 1);
  const nd = Math.min(2, verteidiger);
  let p = 0;
  for (const o of ausgaenge(na, nd)) {
    p += o.p * siegChance(angreifer - o.la, verteidiger - o.ld);
  }
  chanceCache.set(schluessel, p);
  return p;
}

export interface KampfErgebnis {
  angriffWuerfel: number[];
  verteidigWuerfel: number[];
  angreiferVerluste: number;
  verteidigerVerluste: number;
}

/** Wirft eine einzelne Kampfrunde mit echten Würfeln. */
export function wuerfelKampf(angreifer: number, verteidiger: number, rng: Rng): KampfErgebnis {
  const na = Math.min(3, angreifer - 1);
  const nd = Math.min(2, verteidiger);
  const angriff = Array.from({ length: na }, () => wuerfel(rng)).sort((x, y) => y - x);
  const verteidigung = Array.from({ length: nd }, () => wuerfel(rng)).sort((x, y) => y - x);
  let angreiferVerluste = 0;
  let verteidigerVerluste = 0;
  for (let m = 0; m < Math.min(na, nd); m++) {
    if (angriff[m] > verteidigung[m]) verteidigerVerluste++;
    else angreiferVerluste++;
  }
  return {
    angriffWuerfel: angriff,
    verteidigWuerfel: verteidigung,
    angreiferVerluste,
    verteidigerVerluste,
  };
}
