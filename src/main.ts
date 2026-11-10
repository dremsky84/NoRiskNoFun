import './style.css';
import { startApp } from './ui/app';

const el = document.querySelector<HTMLElement>('#app');
if (el) startApp(el);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    // Offline-Unterstützung ist optional.
  });
}
