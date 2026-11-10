import './style.css';
import { naechstePhase, type Phase } from './core/spiel';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  // Platzhalter-Startbildschirm. Das eigentliche Spiel folgt nach Freigabe.
  let phase: Phase = 'verstaerken';
  let runde = 1;

  const zeichne = (): void => {
    app.innerHTML = `
      <main class="start">
        <h1>No Risk No Fun</h1>
        <p>Runde ${runde}</p>
        <p>Phase: ${phase}</p>
        <button id="weiter">Nächste Phase</button>
      </main>`;
    document.querySelector<HTMLButtonElement>('#weiter')?.addEventListener('click', () => {
      const next = naechstePhase(phase);
      phase = next.phase;
      if (next.neueRunde) runde += 1;
      zeichne();
    });
  };

  zeichne();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    // Offline-Unterstützung ist optional.
  });
}
