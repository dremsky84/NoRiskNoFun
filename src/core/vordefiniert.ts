import type { KartenDefinition } from './karten';

// Handgebaute Karten: je vier Kontinente mit fünf Gebieten. Die Koordinaten legen
// Lage und Engpässe fest, die Nachbarschaften ergeben sich daraus.

const g = (name: string, x: number, y: number, kontinent: number) => ({ name, x, y, kontinent });

/** Orbitalring: vier Kontinente in den Quadranten, Konflikte an den Übergängen. */
export const ORBITALRING: KartenDefinition = {
  name: 'Orbitalring',
  kontinente: [
    { name: 'Nordhalo', bonus: 3 },
    { name: 'Ostfeld', bonus: 3 },
    { name: 'Südbogen', bonus: 4 },
    { name: 'Westkern', bonus: 4 },
  ],
  gebiete: [
    g('Aurelia', 110, 130, 0), g('Kepler', 230, 100, 0), g('Nyx', 170, 250, 0), g('Zenit', 300, 220, 0), g('Atlas', 90, 320, 0),
    g('Vega', 560, 120, 1), g('Lyra', 690, 90, 1), g('Orion', 640, 240, 1), g('Pulsar', 780, 200, 1), g('Helios', 850, 330, 1),
    g('Titan', 660, 580, 2), g('Callisto', 840, 560, 2), g('Io', 780, 720, 2), g('Europa', 640, 800, 2), g('Ganymed', 880, 820, 2),
    g('Mira', 110, 650, 3), g('Sirius', 260, 600, 3), g('Rigel', 170, 800, 3), g('Antares', 330, 760, 3), g('Deneb', 430, 660, 3),
  ],
};

/** Kristallbucht: vier Küstenbänder entlang der Diagonale. */
export const KRISTALLBUCHT: KartenDefinition = {
  name: 'Kristallbucht',
  kontinente: [
    { name: 'Quarzbucht', bonus: 3 },
    { name: 'Saphirgrat', bonus: 3 },
    { name: 'Rubinhafen', bonus: 4 },
    { name: 'Diamantfeld', bonus: 4 },
  ],
  gebiete: [
    g('Quarz', 120, 120, 0), g('Basalt', 260, 90, 0), g('Obsidian', 180, 260, 0), g('Jade', 330, 200, 0), g('Onyx', 90, 380, 0),
    g('Saphir', 520, 150, 1), g('Opal', 640, 110, 1), g('Achat', 560, 300, 1), g('Turmalin', 720, 260, 1), g('Beryll', 470, 400, 1),
    g('Ruby', 780, 520, 2), g('Smaragd', 900, 450, 2), g('Karneol', 640, 560, 2), g('Zirkon', 860, 680, 2), g('Topas', 700, 700, 2),
    g('Diamant', 230, 640, 3), g('Perle', 380, 600, 3), g('Granat', 160, 800, 3), g('Kobalt', 340, 820, 3), g('Lapis', 480, 760, 3),
  ],
};

/** Titanenkette: zwei Gebirgsreihen mit engen Pässen dazwischen. */
export const TITANENKETTE: KartenDefinition = {
  name: 'Titanenkette',
  kontinente: [
    { name: 'Nordkamm', bonus: 3 },
    { name: 'Ostgipfel', bonus: 3 },
    { name: 'Südsteppe', bonus: 4 },
    { name: 'Tiefland', bonus: 4 },
  ],
  gebiete: [
    g('Nova', 120, 160, 0), g('Corona', 260, 120, 0), g('Eclipse', 200, 300, 0), g('Meridian', 360, 260, 0), g('Zephyr', 420, 140, 0),
    g('Cygnus', 580, 140, 1), g('Draco', 720, 110, 1), g('Perseus', 640, 300, 1), g('Lynx', 820, 220, 1), g('Andromeda', 900, 360, 1),
    g('Hydra', 120, 560, 2), g('Phoenix', 250, 520, 2), g('Centaur', 180, 720, 2), g('Pegasus', 340, 690, 2), g('Vulpes', 430, 520, 2),
    g('Cetus', 600, 560, 3), g('Lupus', 720, 520, 3), g('Ara', 640, 700, 3), g('Norma', 800, 680, 3), g('Pyxis', 880, 820, 3),
  ],
};

export const VORDEFINIERT: Record<string, KartenDefinition> = {
  orbitalring: ORBITALRING,
  kristallbucht: KRISTALLBUCHT,
  titanenkette: TITANENKETTE,
};
