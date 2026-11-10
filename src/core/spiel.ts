// Spielphasen einer Runde (wie bei Risiko). Reine Logik ohne Darstellung,
// damit sie später auch für den WLAN-Modus wiederverwendet werden kann.

export type Phase = 'verstaerken' | 'angreifen' | 'verschieben';

const REIHENFOLGE: readonly Phase[] = ['verstaerken', 'angreifen', 'verschieben'];

/** Gibt die nächste Phase zurück. Nach 'verschieben' beginnt die nächste Runde wieder bei 'verstaerken'. */
export function naechstePhase(phase: Phase): { phase: Phase; neueRunde: boolean } {
  const index = REIHENFOLGE.indexOf(phase);
  if (index === REIHENFOLGE.length - 1) {
    return { phase: REIHENFOLGE[0], neueRunde: true };
  }
  return { phase: REIHENFOLGE[index + 1], neueRunde: false };
}
