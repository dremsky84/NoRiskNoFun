import type { Punkt } from './types';

/**
 * Nachbarschaft über Delaunay-Dreiecke (Brute Force, reicht für ~25 Punkte).
 * Zwei Punkte sind Nachbarn, wenn sie eine Kante eines leeren Umkreis-Dreiecks teilen.
 */
export function delaunayNachbarn(punkte: readonly Punkt[]): number[][] {
  const n = punkte.length;
  const nachbarn = Array.from({ length: n }, () => new Set<number>());

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const [ax, ay] = punkte[i];
        const [bx, by] = punkte[j];
        const [cx, cy] = punkte[k];
        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < 1e-9) continue;

        const a2 = ax * ax + ay * ay;
        const b2 = bx * bx + by * by;
        const c2 = cx * cx + cy * cy;
        const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d;
        const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d;
        const r2 = (ax - ux) ** 2 + (ay - uy) ** 2;

        const leer = punkte.every(
          (p, m) => m === i || m === j || m === k || (p[0] - ux) ** 2 + (p[1] - uy) ** 2 >= r2 - 1e-6,
        );
        if (!leer) continue;

        for (const [p, q] of [
          [i, j],
          [j, k],
          [i, k],
        ]) {
          nachbarn[p].add(q);
          nachbarn[q].add(p);
        }
      }
    }
  }
  return nachbarn.map((menge) => [...menge].sort((a, b) => a - b));
}

/** Voronoi-Zellen als Polygone innerhalb des Rechtecks (0,0)-(breite,hoehe). */
export function voronoiZellen(punkte: readonly Punkt[], breite: number, hoehe: number): Punkt[][] {
  return punkte.map((pi, i) => {
    let polygon: Punkt[] = [
      [0, 0],
      [breite, 0],
      [breite, hoehe],
      [0, hoehe],
    ];
    punkte.forEach((pj, j) => {
      if (j === i) return;
      // Behalte alle Punkte, die näher an pi liegen als an pj.
      const nx = 2 * (pj[0] - pi[0]);
      const ny = 2 * (pj[1] - pi[1]);
      const c = pj[0] * pj[0] + pj[1] * pj[1] - (pi[0] * pi[0] + pi[1] * pi[1]);
      polygon = halbebeneSchneiden(polygon, (x, y) => nx * x + ny * y - c);
    });
    return polygon;
  });
}

/** Sutherland-Hodgman: schneidet ein Polygon auf den Bereich f(x, y) <= 0. */
function halbebeneSchneiden(polygon: Punkt[], f: (x: number, y: number) => number): Punkt[] {
  const ergebnis: Punkt[] = [];
  const n = polygon.length;
  for (let k = 0; k < n; k++) {
    const a = polygon[k];
    const b = polygon[(k + 1) % n];
    const fa = f(a[0], a[1]);
    const fb = f(b[0], b[1]);
    if (fa <= 0) ergebnis.push(a);
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) {
      const t = fa / (fa - fb);
      ergebnis.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return ergebnis;
}
