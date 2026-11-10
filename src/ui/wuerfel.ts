// Augenbild eines Würfels als 3x3-Raster. Index 0 bis 8 zeigt die Position eines Auges.
const AUGEN: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Eine Reihe Würfel. Die Würfel werden nacheinander eingeblendet und gedreht. */
export function wuerfelReihe(werte: number[], art: 'angriff' | 'verteidigung'): string {
  const wuerfel = werte
    .map((wert, i) => {
      const augen = Array.from({ length: 9 }, (_, p) =>
        `<span class="${AUGEN[wert].includes(p) ? 'an' : ''}"></span>`,
      ).join('');
      return `<div class="wuerfel" style="animation-delay:${i * 90}ms" aria-label="Würfel ${wert}">${augen}</div>`;
    })
    .join('');
  return `<div class="wuerfelreihe ${art}">${wuerfel}</div>`;
}
