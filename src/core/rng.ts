export type Rng = () => number;

/** Kleiner Zufallsgenerator mit Startwert (mulberry32), damit Partien und Tests reproduzierbar sind. */
export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ein Würfel mit 1 bis 6. */
export function wuerfel(rng: Rng): number {
  return 1 + Math.floor(rng() * 6);
}

/** Mischt eine Liste (Fisher-Yates), ohne die Originalliste zu verändern. */
export function mische<T>(liste: readonly T[], rng: Rng): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}
