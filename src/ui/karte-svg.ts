import type { Spielzustand } from '../core/types';

export interface KarteAnsicht {
  auswahl: number | null;
  quellen: number[];
  ziele: number[];
}

/** Zeichnet die Karte als SVG. Felder tragen data-id, damit Klicks zugeordnet werden können. */
export function renderKarte(z: Spielzustand, ansicht: KarteAnsicht): string {
  const verlaufsFarben = z.spieler
    .map(
      (s) => `
      <radialGradient id="f${s.id}" cx="50%" cy="40%" r="75%">
        <stop offset="0%" stop-color="${s.farbe}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${s.farbe}" stop-opacity="0.2"/>
      </radialGradient>`,
    )
    .join('');

  const gebiete = z.karte.gebiete
    .map((g) => {
      const besitzer = z.besitz[g.id];
      const farbe = z.spieler[besitzer].farbe;
      const klassen = ['gebiet'];
      if (ansicht.auswahl === g.id) klassen.push('auswahl');
      if (ansicht.quellen.includes(g.id)) klassen.push('quelle');
      if (ansicht.ziele.includes(g.id)) klassen.push('ziel');
      const punkte = g.polygon.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
      const [cx, cy] = g.zentrum;
      return `
      <g class="${klassen.join(' ')}" data-id="${g.id}">
        <polygon points="${punkte}" fill="url(#f${besitzer})"/>
        <text class="gname" x="${cx}" y="${cy - 66}">${g.name}</text>
        <circle class="marke" cx="${cx}" cy="${cy}" r="40" style="stroke:${farbe}"/>
        <text class="anzahl" x="${cx}" y="${cy + 13}">${z.truppen[g.id]}</text>
      </g>`;
    })
    .join('');

  const angriff = z.letzterAngriff;
  const linie = angriff
    ? (() => {
        const [x1, y1] = z.karte.gebiete[angriff.von].zentrum;
        const [x2, y2] = z.karte.gebiete[angriff.nach].zentrum;
        return `<line class="angriffslinie" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      })()
    : '';

  return `
  <svg class="karte" viewBox="0 0 1000 1000" role="img" aria-label="Spielkarte ${z.karte.name}">
    <defs>
      ${verlaufsFarben}
      <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <pattern id="raster" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M50 0H0V50" fill="none" stroke="rgba(56,225,255,0.08)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1000" height="1000" fill="#060a16"/>
    <rect width="1000" height="1000" fill="url(#raster)"/>
    ${gebiete}
    ${linie}
  </svg>`;
}
