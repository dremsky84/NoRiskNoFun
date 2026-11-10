import { baueKarte, zufallsDefinition, type KartenDefinition } from '../core/karten';
import { siegChance } from '../core/kampf';
import { kiZug } from '../core/ki';
import { mulberry32, type Rng } from '../core/rng';
import {
  angreifen,
  beendePhase,
  CHARAKTER_NAMEN,
  erobern,
  kannAngreifen,
  kannVerschieben,
  missionFortschritt,
  missionText,
  neuesSpiel,
  PHASE_NAMEN,
  setzeTruppe,
  verbundeneEigene,
  verschieben,
} from '../core/spiel';
import { VORDEFINIERT } from '../core/vordefiniert';
import type { Gefecht, Schwierigkeit, Spielzustand } from '../core/types';
import { renderKarte, type KarteAnsicht } from './karte-svg';
import { wuerfelReihe } from './wuerfel';

type Modal =
  | { typ: 'kampf'; von: number; nach: number }
  | { typ: 'erobern' }
  | { typ: 'verschieben'; von: number; nach: number };

interface Ui {
  karte: string;
  anzahlKi: number;
  schwierigkeit: Schwierigkeit;
  z: Spielzustand | null;
  rng: Rng;
  auswahl: number | null;
  modal: Modal | null;
  kiAktiv: boolean;
  zeigeChance: boolean;
}

const KARTENWAHL = [
  { id: 'archipel', name: 'Archipel', beschreibung: 'Festland und Inseln, getrennt durch Meer' },
  { id: 'gebirgsbogen', name: 'Gebirgsbogen', beschreibung: 'Ein Gebirgskamm teilt die Welt' },
  { id: 'dreifachmeer', name: 'Dreifachmeer', beschreibung: 'Drei Meere, viele Seewege' },
  { id: 'zufall', name: 'Zufallskarte', beschreibung: 'Jede Partie eine neue Welt' },
];

const SCHWIERIGKEITEN: { id: Schwierigkeit; name: string }[] = [
  { id: 'lehrling', name: 'Lehrling' },
  { id: 'geselle', name: 'Geselle' },
  { id: 'meister', name: 'Meister' },
];

const ui: Ui = {
  karte: 'archipel',
  anzahlKi: 2,
  schwierigkeit: 'geselle',
  z: null,
  rng: mulberry32(1),
  auswahl: null,
  modal: null,
  kiAktiv: false,
  zeigeChance: true,
};

let root: HTMLElement;

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const menschAmZug = (z: Spielzustand) => z.aktiver === 0 && !ui.kiAktiv && z.sieger === null;

function render(): void {
  root.innerHTML = ui.z ? renderSpiel(ui.z) : renderStart();
}

function renderStart(): string {
  const karten = KARTENWAHL.map(
    (k) => `
      <button class="option${ui.karte === k.id ? ' an' : ''}" data-aktion="karte" data-wert="${k.id}">
        <b>${k.name}</b><small>${k.beschreibung}</small>
      </button>`,
  ).join('');
  const gegner = [2, 3]
    .map(
      (n) =>
        `<button class="chip-btn${ui.anzahlKi === n ? ' an' : ''}" data-aktion="ki" data-wert="${n}">${n} KI-Gegner</button>`,
    )
    .join('');
  const schwer = SCHWIERIGKEITEN.map(
    (s) =>
      `<button class="chip-btn${ui.schwierigkeit === s.id ? ' an' : ''}" data-aktion="schwer" data-wert="${s.id}">${s.name}</button>`,
  ).join('');

  return `
    <main class="start">
      <div class="logo">
        <h1>No Risk<span>No Fun</span></h1>
        <p>Erobere die Welt. Würfle mutig.</p>
      </div>
      <section><h2>Karte</h2><div class="optionen">${karten}</div></section>
      <section><h2>Gegner</h2><div class="reihe">${gegner}</div></section>
      <section><h2>Schwierigkeit</h2><div class="reihe">${schwer}</div></section>
      <button class="primaer gross" data-aktion="start">Partie starten</button>
      <details class="regeln">
        <summary>Kurz erklärt</summary>
        <ul>
          <li><b>Verstärken:</b> Neue Truppen je nach Gebieten und vollständig gehaltenen Kontinenten.</li>
          <li><b>Angreifen:</b> Würfelkampf wie bei Risiko. Die Siegchance siehst du vor jeder Schlacht.</li>
          <li><b>Verschieben:</b> Einmal pro Zug Truppen über eigene, verbundene Gebiete bewegen.</li>
          <li><b>Meer und Gebirge:</b> Unbetretbar. Gebiete sind nur über Landgrenzen oder gestrichelte Seewege erreichbar.</li>
          <li><b>Sieg:</b> Alle Gegner ausschalten oder deine Missionskarte erfüllen.</li>
        </ul>
      </details>
    </main>`;
}

function ansichtFuer(z: Spielzustand): KarteAnsicht {
  const leer: KarteAnsicht = { auswahl: null, quellen: [], ziele: [] };
  if (!menschAmZug(z)) return leer;
  const meine = z.karte.gebiete.map((g) => g.id).filter((id) => z.besitz[id] === 0 && z.truppen[id] >= 2);
  if (z.phase === 'angreifen' && !z.eroberung) {
    const ziele =
      ui.auswahl !== null ? z.karte.gebiete[ui.auswahl].nachbarn.filter((n) => z.besitz[n] !== 0) : [];
    return { auswahl: ui.auswahl, quellen: meine, ziele };
  }
  if (z.phase === 'verschieben' && !z.verschoben) {
    const ziele =
      ui.auswahl !== null ? verbundeneEigene(z, 0, ui.auswahl).filter((n) => n !== ui.auswahl) : [];
    return { auswahl: ui.auswahl, quellen: meine, ziele };
  }
  return leer;
}

function hinweisText(z: Spielzustand): string {
  if (!menschAmZug(z)) return `${z.spieler[z.aktiver].name} ist am Zug …`;
  switch (z.phase) {
    case 'verstaerken':
      return z.verstaerkung > 0
        ? `Setze noch ${z.verstaerkung} Truppen. Tippe auf eines deiner Gebiete.`
        : 'Alle Truppen gesetzt. Weiter zum Angriff.';
    case 'angreifen':
      if (z.eroberung) return 'Gebiet erobert – Truppen festlegen.';
      return ui.auswahl !== null
        ? 'Tippe auf einen Feind neben deinem Gebiet.'
        : 'Wähle ein Gebiet mit mindestens 2 Truppen zum Angreifen.';
    case 'verschieben':
      if (z.verschoben) return 'Du hast schon verschoben. Beende deinen Zug.';
      return ui.auswahl !== null
        ? 'Tippe auf ein verbundenes eigenes Gebiet.'
        : 'Optional: Wähle ein Gebiet, von dem aus du verschieben willst.';
  }
}

function renderSpiel(z: Spielzustand): string {
  const chips = z.spieler
    .map((s) => {
      const gebiete = z.besitz.filter((b) => b === s.id).length;
      const truppen = z.truppen.reduce((summe, t, i) => (z.besitz[i] === s.id ? summe + t : summe), 0);
      const klassen = ['chip'];
      if (s.id === z.aktiver) klassen.push('aktiv');
      if (!s.lebt) klassen.push('tot');
      return `
        <div class="${klassen.join(' ')}" style="--farbe:${s.farbe}">
          <b>${s.name}</b>
          <small>${CHARAKTER_NAMEN[s.charakter]} · ${gebiete} Geb. · ${truppen} Tr.</small>
        </div>`;
    })
    .join('');

  const fortschritt = missionFortschritt(z, 0);
  const naechster: Record<string, string> = {
    verstaerken: 'Zum Angriff',
    angreifen: 'Zur Verschiebung',
    verschieben: 'Zug beenden',
  };
  const weiterGesperrt = !menschAmZug(z) || (z.phase === 'verstaerken' && z.verstaerkung > 0) || z.eroberung !== null;

  const protokoll = z.protokoll
    .slice(-4)
    .map((zeile) => `<li>${zeile}</li>`)
    .join('');

  return `
    <div class="spiel">
      <header class="kopf">
        <div class="titel">Runde ${z.runde} · ${PHASE_NAMEN[z.phase]}</div>
        <div class="chips">${chips}</div>
      </header>
      <div class="ziel">Dein Ziel: <b>${missionText(z, 0)}</b> (${fortschritt.ist}/${fortschritt.soll})</div>
      <div class="karte-wrap">${renderKarte(z, ansichtFuer(z))}</div>
      <div class="kontinente">${kontinentLegende(z)}</div>
      <div class="info">
        <p class="hinweis">${hinweisText(z)}</p>
        <div class="knoepfe">
          <button class="primaer" data-aktion="weiter" ${weiterGesperrt ? 'disabled' : ''}>${naechster[z.phase]}</button>
          <button data-aktion="chance">Chancen: ${ui.zeigeChance ? 'an' : 'aus'}</button>
          <button data-aktion="menue">Menü</button>
        </div>
      </div>
      <ul class="protokoll">${protokoll}</ul>
      ${renderModal(z)}
      ${z.sieger !== null ? renderEnde(z) : ''}
    </div>`;
}

/** Legende mit Kontinent-Bonus und dem Besitzer, falls ein Kontinent komplett gehalten wird. */
function kontinentLegende(z: Spielzustand): string {
  return z.karte.kontinente
    .map((k) => {
      const besitzer = z.besitz[k.gebiete[0]];
      const komplett = k.gebiete.every((id) => z.besitz[id] === besitzer);
      const farbe = komplett ? z.spieler[besitzer].farbe : 'rgba(230,247,255,0.5)';
      return `<span class="kontinent" style="--farbe:${farbe}">${k.name} · +${k.bonus}${komplett ? ` · ${z.spieler[besitzer].name}` : ''}</span>`;
    })
    .join('');
}

function renderModal(z: Spielzustand): string {
  const m = ui.modal;
  if (!m) return '';

  if (m.typ === 'kampf') {
    const a = z.truppen[m.von];
    const d = z.truppen[m.nach];
    const pCent = Math.round(siegChance(a, d) * 100);
    const letzter: Gefecht | null =
      z.letzterAngriff && z.letzterAngriff.von === m.von && z.letzterAngriff.nach === m.nach
        ? z.letzterAngriff
        : null;
    const kann = kannAngreifen(z, m.von, m.nach);
    const ergebnis = letzter
      ? `${wuerfelReihe(letzter.angriffWuerfel, 'angriff')}${wuerfelReihe(letzter.verteidigWuerfel, 'verteidigung')}
         <p class="ausgang">Angreifer verliert ${letzter.angreiferVerluste}, Verteidiger verliert ${letzter.verteidigerVerluste}.</p>`
      : '';
    return modal(`
      <h2>${z.karte.gebiete[m.von].name} ⚔ ${z.karte.gebiete[m.nach].name}</h2>
      <p class="zahlen">Angreifer: ${a} Truppen · Verteidiger: ${d} Truppen</p>
      ${
        ui.zeigeChance
          ? `<div class="chance"><span style="width:${pCent}%"></span></div><p>Siegchance: <b>${pCent} %</b></p>`
          : '<p>Siegchance: <b>verborgen</b></p>'
      }
      ${ergebnis}
      <div class="knoepfe">
        <button class="primaer" data-aktion="schlacht" ${kann ? '' : 'disabled'}>${letzter ? 'Erneut kämpfen' : 'Schlacht'}</button>
        <button data-aktion="bisEnde" ${kann ? '' : 'disabled'}>Bis zum Ende</button>
        <button data-aktion="schliessen">Schließen</button>
      </div>`);
  }

  if (m.typ === 'erobern') {
    const e = z.eroberung;
    if (!e) return '';
    return modal(`
      <h2>${z.karte.gebiete[e.nach].name} erobert</h2>
      <p class="zahlen">Wie viele Truppen rücken nach? (${e.min} bis ${e.max})</p>
      <input id="anzahl" type="range" min="${e.min}" max="${e.max}" value="${e.min}" />
      <p class="wert">Truppen: <output id="anzahlWert">${e.min}</output></p>
      <div class="knoepfe">
        <button class="primaer" data-aktion="bestaetigeEroberung">Truppen verschieben</button>
      </div>`);
  }

  // verschieben
  const max = z.truppen[m.von] - 1;
  return modal(`
    <h2>${z.karte.gebiete[m.von].name} → ${z.karte.gebiete[m.nach].name}</h2>
    <p class="zahlen">Wie viele Truppen verschieben? (1 bis ${max})</p>
    <input id="anzahl" type="range" min="1" max="${max}" value="1" />
    <p class="wert">Truppen: <output id="anzahlWert">1</output></p>
    <div class="knoepfe">
      <button class="primaer" data-aktion="bestaetigeVerschieben">Verschieben</button>
      <button data-aktion="abbrechen">Abbrechen</button>
    </div>`);
}

function modal(inhalt: string): string {
  return `<div class="modal"><div class="modal-karte">${inhalt}</div></div>`;
}

function renderEnde(z: Spielzustand): string {
  const gewonnen = z.sieger === 0;
  return modal(`
    <h2 class="${gewonnen ? 'sieg' : 'niederlage'}">${gewonnen ? 'Sieg!' : 'Niederlage'}</h2>
    <p>${z.spieler[z.sieger ?? 0].name} gewinnt: ${z.siegGrund}.</p>
    <div class="knoepfe">
      <button class="primaer" data-aktion="start">Neue Partie</button>
      <button data-aktion="menue">Menü</button>
    </div>`);
}

function kartenDefinition(): KartenDefinition {
  return ui.karte === 'zufall' ? zufallsDefinition(ui.rng) : VORDEFINIERT[ui.karte];
}

function starte(): void {
  ui.rng = mulberry32((Math.random() * 2 ** 32) >>> 0);
  const karte = baueKarte(kartenDefinition());
  ui.z = neuesSpiel(karte, ui.anzahlKi, ui.schwierigkeit, ui.rng);
  ui.auswahl = null;
  ui.modal = null;
  render();
  void kiWeiter();
}

/** Lässt alle KI-Spieler am Stück ihren Zug machen, mit kurzer Pause zwischen den Schritten. */
async function kiWeiter(): Promise<void> {
  const z = ui.z;
  if (!z || ui.kiAktiv) return;
  ui.kiAktiv = true;
  try {
    while (ui.z === z && z.sieger === null && z.spieler[z.aktiver].ki) {
      const gen = kiZug(z, ui.rng);
      while (!gen.next().done) {
        if (ui.z !== z) return;
        render();
        await pause(420);
      }
      render();
      await pause(300);
    }
  } finally {
    ui.kiAktiv = false;
    if (ui.z === z) render();
  }
}

function klickFeld(id: number): void {
  const z = ui.z;
  if (!z || !menschAmZug(z) || ui.modal) return;

  if (z.phase === 'verstaerken') {
    if (setzeTruppe(z, id)) render();
    return;
  }

  if (z.phase === 'angreifen') {
    if (z.eroberung) return;
    if (ui.auswahl !== null && kannAngreifen(z, ui.auswahl, id)) {
      ui.modal = { typ: 'kampf', von: ui.auswahl, nach: id };
    } else if (z.besitz[id] === 0 && z.truppen[id] >= 2) {
      ui.auswahl = ui.auswahl === id ? null : id;
    }
    render();
    return;
  }

  if (z.phase === 'verschieben') {
    if (z.verschoben) return;
    if (ui.auswahl !== null && kannVerschieben(z, ui.auswahl, id)) {
      ui.modal = { typ: 'verschieben', von: ui.auswahl, nach: id };
    } else if (z.besitz[id] === 0 && z.truppen[id] >= 2) {
      ui.auswahl = ui.auswahl === id ? null : id;
    }
    render();
  }
}

function aktion(name: string, wert: string): void {
  const z = ui.z;
  switch (name) {
    case 'karte':
      ui.karte = wert;
      break;
    case 'ki':
      ui.anzahlKi = Number(wert);
      break;
    case 'schwer':
      ui.schwierigkeit = wert as Schwierigkeit;
      break;
    case 'start':
      starte();
      return;
    case 'menue':
      ui.z = null;
      ui.modal = null;
      ui.auswahl = null;
      break;
    case 'chance':
      ui.zeigeChance = !ui.zeigeChance;
      break;
    case 'weiter':
      if (z && menschAmZug(z) && beendePhase(z)) {
        ui.auswahl = null;
        ui.modal = null;
        render();
        if (z.sieger === null && z.spieler[z.aktiver].ki) void kiWeiter();
        return;
      }
      break;
    case 'schlacht':
      if (z && ui.modal?.typ === 'kampf') {
        const m = ui.modal;
        angreifen(z, m.von, m.nach, ui.rng);
        if (z.eroberung) ui.modal = { typ: 'erobern' };
      }
      break;
    case 'bisEnde':
      if (z && ui.modal?.typ === 'kampf') {
        const m = ui.modal;
        while (kannAngreifen(z, m.von, m.nach)) {
          angreifen(z, m.von, m.nach, ui.rng);
          if (z.eroberung) break;
        }
        if (z.eroberung) ui.modal = { typ: 'erobern' };
      }
      break;
    case 'schliessen':
    case 'abbrechen':
      ui.modal = null;
      break;
    case 'bestaetigeEroberung':
      if (z && erobern(z, leseAnzahl())) {
        ui.modal = null;
        ui.auswahl = null;
      }
      break;
    case 'bestaetigeVerschieben':
      if (z && ui.modal?.typ === 'verschieben' && verschieben(z, ui.modal.von, ui.modal.nach, leseAnzahl())) {
        ui.modal = null;
        ui.auswahl = null;
      }
      break;
    default:
      return;
  }
  render();
}

function leseAnzahl(): number {
  const feld = root.querySelector<HTMLInputElement>('#anzahl');
  return feld ? Number(feld.value) : 0;
}

export function startApp(el: HTMLElement): void {
  root = el;
  el.addEventListener('click', (ev) => {
    const ziel = ev.target as Element;
    const knopf = ziel.closest<HTMLElement>('[data-aktion]');
    if (knopf) {
      aktion(knopf.dataset.aktion ?? '', knopf.dataset.wert ?? '');
      return;
    }
    const feld = ziel.closest<SVGGElement>('svg.karte [data-id]');
    if (feld) klickFeld(Number(feld.dataset.id));
  });
  el.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.id === 'anzahl') {
      const ausgabe = root.querySelector('#anzahlWert');
      if (ausgabe) ausgabe.textContent = t.value;
    }
  });
  render();
}
