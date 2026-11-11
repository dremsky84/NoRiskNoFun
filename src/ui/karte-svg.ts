import type { Feld, Spielzustand } from '../core/types';

export interface KarteAnsicht {
  auswahl: number | null;
  quellen: number[];
  ziele: number[];
}

const punkteText = (polygon: [number, number][]) =>
  polygon.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Ozean: Wasserfläche mit Wellenmuster. Gebirge: Felsfläche mit zwei Gipfeln. */
function feldSvg(f: Feld): string {
  const punkte = punkteText(f.polygon);
  if (f.typ === 'ozean') {
    return `<g class="feld"><polygon points="${punkte}" fill="url(#meer)"/><polygon points="${punkte}" fill="url(#wellen)"/></g>`;
  }
  const [cx, cy] = f.zentrum;
  const gipfel = `M${cx - 52} ${cy + 34} L${cx - 20} ${cy - 16} L${cx - 4} ${cy + 8} L${cx + 14} ${cy - 30} L${cx + 52} ${cy + 34} Z`;
  return `<g class="feld"><polygon points="${punkte}" fill="url(#berg)"/><path class="gipfel" d="${gipfel}"/></g>`;
}

/** Zeichnet die Karte als SVG. Nur Gebiete tragen data-id, damit Klicks zugeordnet werden. */
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

  const felder = z.karte.felder.map(feldSvg).join('');

  const seewege = z.karte.seewege
    .map(([a, b]) => {
      const [x1, y1] = z.karte.gebiete[a].zentrum;
      const [x2, y2] = z.karte.gebiete[b].zentrum;
      return `<line class="seeweg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    })
    .join('');

  // Skalierung: 1 bei 20 Gebieten, kleiner bei größeren Karten (mindestens 0,6).
  const skala = Math.max(0.6, Math.min(1, Math.pow(20 / z.karte.gebiete.length, 0.25))).toFixed(3);
  const gebiete = z.karte.gebiete
    .map((g) => {
      const besitzer = z.besitz[g.id];
      const farbe = z.spieler[besitzer].farbe;
      const klassen = ['gebiet'];
      if (ansicht.auswahl === g.id) klassen.push('auswahl');
      if (ansicht.quellen.includes(g.id)) klassen.push('quelle');
      if (ansicht.ziele.includes(g.id)) klassen.push('ziel');
      const [cx, cy] = g.zentrum;
      // Auf großen Karten schrumpfen Beschriftung und Marken, damit sie nicht überlappen.
      return `
      <g class="${klassen.join(' ')}" data-id="${g.id}">
        <polygon points="${punkteText(g.polygon)}" fill="url(#f${besitzer})"/>
        <g transform="translate(${cx} ${cy}) scale(${skala})">
          <text class="gname" x="0" y="-66">${g.name}</text>
          <circle class="marke" cx="0" cy="0" r="40" style="stroke:${farbe}"/>
          <text class="anzahl" x="0" y="13">${z.truppen[g.id]}</text>
        </g>
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
      <radialGradient id="meer" cx="50%" cy="50%" r="80%">
        <stop offset="0%" stop-color="#1d5a94"/>
        <stop offset="100%" stop-color="#0b2a4f"/>
      </radialGradient>
      <radialGradient id="berg" cx="50%" cy="40%" r="75%">
        <stop offset="0%" stop-color="#5d5448"/>
        <stop offset="100%" stop-color="#2a2521"/>
      </radialGradient>
      <pattern id="wellen" width="60" height="30" patternUnits="userSpaceOnUse">
        <path d="M0 15 Q15 5 30 15 T60 15" fill="none" stroke="rgba(160,220,255,0.18)" stroke-width="2"/>
      </pattern>
      <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="1000" height="1000" fill="#0b2a4f"/>
    ${felder}
    ${seewege}
    ${gebiete}
    ${linie}
  </svg>`;
}
