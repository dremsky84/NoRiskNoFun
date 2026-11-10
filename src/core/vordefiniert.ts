import type { KartenDefinition } from './karten';

// Handgebaute Karten mit Ozeanen und Gebirgen im Stil von Risiko. Gebiete müssen nicht
// alle aneinander liegen: Inseln und Halbinseln sind über Seewege verbunden.

const g = (name: string, x: number, y: number, kontinent: number) => ({ name, x, y, kontinent });
const o = (x: number, y: number) => ({ x, y });

/** Archipel: Festland im Nordwesten und Westen, Inselgruppen im Osten und Süden. */
export const ARCHIPEL: KartenDefinition = {
  name: 'Archipel',
  kontinente: [
    { name: 'Nordfestland', bonus: 3 },
    { name: 'Ostinseln', bonus: 3 },
    { name: 'Südarchipel', bonus: 4 },
    { name: 'Westfestland', bonus: 4 },
  ],
  gebiete: [
    g('Aurelia', 110, 120, 0), g('Kepler', 250, 100, 0), g('Nyx', 180, 240, 0), g('Zenit', 320, 220, 0), g('Atlas', 90, 330, 0),
    g('Vega', 650, 140, 1), g('Lyra', 780, 110, 1), g('Orion', 700, 270, 1), g('Pulsar', 850, 230, 1), g('Helios', 780, 360, 1),
    g('Titan', 640, 620, 2), g('Callisto', 790, 590, 2), g('Io', 700, 760, 2), g('Europa', 860, 780, 2), g('Ganymed', 900, 640, 2),
    g('Mira', 120, 640, 3), g('Sirius', 260, 600, 3), g('Rigel', 150, 820, 3), g('Antares', 320, 780, 3), g('Deneb', 420, 660, 3),
  ],
  ozeane: [o(470, 130), o(540, 330), o(440, 470), o(800, 480), o(540, 780), o(950, 400)],
  gebirge: [o(230, 430), o(110, 480), o(340, 480)],
  seewege: [
    ['Zenit', 'Vega'],
    ['Helios', 'Ganymed'],
  ],
};

/** Gebirgsbogen: Ein Gebirgskamm teilt die Karte. Die Lücken dazwischen sind die Pässe. */
export const GEBIRGSBOGEN: KartenDefinition = {
  name: 'Gebirgsbogen',
  kontinente: [
    { name: 'Nordhochland', bonus: 3 },
    { name: 'Saphirküste', bonus: 3 },
    { name: 'Rubinebene', bonus: 4 },
    { name: 'Diamantsteppe', bonus: 4 },
  ],
  gebiete: [
    g('Quarz', 120, 110, 0), g('Basalt', 270, 100, 0), g('Obsidian', 170, 230, 0), g('Jade', 330, 190, 0), g('Onyx', 430, 110, 0),
    g('Saphir', 580, 120, 1), g('Opal', 720, 100, 1), g('Achat', 650, 240, 1), g('Turmalin', 800, 200, 1), g('Beryll', 900, 300, 1),
    g('Ruby', 780, 600, 2), g('Smaragd', 900, 540, 2), g('Karneol', 620, 600, 2), g('Zirkon', 800, 740, 2), g('Topas', 660, 780, 2),
    g('Diamant', 120, 600, 3), g('Perle', 260, 580, 3), g('Granat', 150, 800, 3), g('Kobalt', 310, 820, 3), g('Lapis', 460, 760, 3),
    // Passhöhe: ein Gebiet in der Lücke des Kamms, verbindet Nord und Süd.
    g('Passhöhe', 470, 420, 0),
  ],
  ozeane: [o(40, 300), o(520, 250), o(960, 130), o(560, 930), o(50, 840)],
  gebirge: [o(110, 430), o(240, 430), o(380, 430), o(560, 440), o(700, 430), o(850, 440)],
};

/** Dreifachmeer: Drei Meere trennen Nord, Ost, Süd und Tiefland. */
export const DREIFACHMEER: KartenDefinition = {
  name: 'Dreifachmeer',
  kontinente: [
    { name: 'Nordkamm', bonus: 3 },
    { name: 'Ostinsel', bonus: 3 },
    { name: 'Südsteppe', bonus: 4 },
    { name: 'Tiefland', bonus: 4 },
  ],
  gebiete: [
    g('Nova', 120, 140, 0), g('Corona', 250, 110, 0), g('Eclipse', 190, 260, 0), g('Meridian', 340, 230, 0), g('Zephyr', 430, 120, 0),
    g('Cygnus', 640, 120, 1), g('Draco', 780, 130, 1), g('Perseus', 700, 270, 1), g('Lynx', 850, 250, 1), g('Andromeda', 930, 380, 1),
    g('Hydra', 100, 560, 2), g('Phoenix', 230, 520, 2), g('Centaur', 150, 700, 2), g('Pegasus', 300, 680, 2), g('Vulpes', 400, 540, 2), g('Ara', 330, 840, 2),
    g('Cetus', 600, 580, 3), g('Lupus', 740, 540, 3), g('Norma', 880, 660, 3), g('Hydrus', 640, 780, 3),
  ],
  ozeane: [o(530, 160), o(520, 400), o(960, 520), o(60, 380), o(480, 720)],
  gebirge: [o(200, 400), o(350, 420), o(690, 420)],
  seewege: [
    ['Zephyr', 'Cygnus'],
    ['Lupus', 'Perseus'],
  ],
};

export const VORDEFINIERT: Record<string, KartenDefinition> = {
  archipel: ARCHIPEL,
  gebirgsbogen: GEBIRGSBOGEN,
  dreifachmeer: DREIFACHMEER,
};
