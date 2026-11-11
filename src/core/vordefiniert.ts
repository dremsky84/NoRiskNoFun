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

/** Weltenring: 44 Gebiete rund um ein Binnenmeer. Sechs Kontinente, Meere und Gebirgspässe außen. */
export const WELTENRING: KartenDefinition = {
  name: 'Weltenring',
  kontinente: [
    { name: 'Nordpol', bonus: 3 },
    { name: 'Morgenlicht', bonus: 3 },
    { name: 'Sonnenbogen', bonus: 4 },
    { name: 'Südkrone', bonus: 4 },
    { name: 'Abendland', bonus: 4 },
    { name: 'Tiefenkamm', bonus: 5 },
  ],
  gebiete: [
    g('Aegis', 460, 117, 0), g('Boreas', 436, 212, 0), g('Cirrus', 374, 136, 0), g('Dione', 372, 234, 0),
    g('Eos', 294, 175, 0), g('Fjord', 315, 270, 0), g('Glacia', 226, 230, 0), g('Halo', 268, 318, 0),
    g('Ilias', 148, 343, 1), g('Jovia', 217, 417, 1), g('Kairos', 119, 442, 1), g('Lumen', 205, 495, 1),
    g('Marra', 118, 545, 1), g('Nereus', 214, 573, 1), g('Oriel', 143, 644, 1), g('Pyrrha', 189, 726, 2),
    g('Qadira', 287, 704, 2), g('Rhea', 259, 801, 2), g('Solis', 348, 753, 2), g('Thalia', 348, 854, 2),
    g('Umbra', 420, 784, 2), g('Vanta', 446, 881, 2), g('Xenia', 540, 883, 3), g('Yara', 564, 788, 3),
    g('Zoran', 626, 864, 3), g('Azura', 628, 766, 3), g('Brisa', 706, 825, 3), g('Calyx', 685, 730, 3),
    g('Delta', 774, 770, 3), g('Echo', 732, 682, 3), g('Fenix', 852, 657, 4), g('Glimmer', 783, 583, 4),
    g('Haven', 881, 558, 4), g('Iris', 795, 505, 4), g('Jolt', 882, 455, 4), g('Kessel', 786, 427, 4),
    g('Lyon', 857, 356, 4), g('Morrow', 811, 274, 5), g('Nimbus', 713, 296, 5), g('Orbit', 741, 199, 5),
    g('Pegel', 652, 247, 5), g('Rift', 652, 146, 5), g('Sable', 580, 216, 5), g('Tundra', 554, 119, 5),
  ],
  ozeane: [o(500, 500), o(420, 430), o(590, 600), o(560, 400), o(93, 265), o(93, 735), o(500, 970), o(907, 735), o(907, 265), o(500, 30), o(214, 665), o(786, 665), o(500, 170)],
  gebirge: [o(214, 335), o(500, 830), o(786, 335)],
};

/** Sternenmeer: 44 Gebiete auf fünf Inselgruppen, dazwischen Meere und Gebirgsketten. */
export const STERNENMEER: KartenDefinition = {
  name: 'Sternenmeer',
  kontinente: [
    { name: 'Glutinsel', bonus: 4 },
    { name: 'Eisinsel', bonus: 4 },
    { name: 'Dunkelfeld', bonus: 3 },
    { name: 'Grünwelt', bonus: 5 },
    { name: 'Silberküste', bonus: 4 },
  ],
  gebiete: [
    g('Ember', 65, 85, 0), g('Flare', 170, 85, 0), g('Gleam', 275, 85, 0), g('Hiber', 65, 190, 0),
    g('Inferno', 170, 190, 0), g('Kindle', 275, 190, 0), g('Lava', 65, 295, 0), g('Magma', 170, 295, 0),
    g('Pyre', 275, 295, 0), g('Frost', 421, 75, 1), g('Glacier', 526, 75, 1), g('Hailstorm', 631, 75, 1),
    g('Icicle', 421, 180, 1), g('Jetstream', 526, 180, 1), g('Krios', 631, 180, 1), g('Lumi', 421, 285, 1),
    g('Mistral', 526, 285, 1), g('Nevado', 631, 285, 1), g('Umbra', 735, 145, 2), g('Vanta', 840, 145, 2),
    g('Wraith', 945, 145, 2), g('Xylem', 735, 250, 2), g('Yonder', 945, 250, 2), g('Ashen', 735, 355, 2),
    g('Basalt', 840, 355, 2), g('Cinder', 945, 355, 2), g('Verdant', 201, 455, 3), g('Bloom', 306, 455, 3),
    g('Canopy', 411, 455, 3), g('Dew', 201, 560, 3), g('Eden', 306, 560, 3), g('Fern', 411, 560, 3),
    g('Grove', 201, 665, 3), g('Harvest', 306, 665, 3), g('Ivy', 411, 665, 3), g('Argent', 615, 495, 4),
    g('Brine', 720, 495, 4), g('Coral', 825, 495, 4), g('Dune', 615, 600, 4), g('Estuary', 720, 600, 4),
    g('Fathom', 825, 600, 4), g('Gull', 615, 705, 4), g('Harbor', 720, 705, 4), g('Isle', 825, 705, 4),
  ],
  ozeane: [o(330, 380), o(680, 400), o(170, 420), o(500, 400), o(840, 430), o(500, 860), o(170, 760), o(680, 820), o(330, 780), o(860, 800)],
  gebirge: [o(250, 420), o(760, 450), o(520, 720), o(470, 300)],
};

export const VORDEFINIERT: Record<string, KartenDefinition> = {
  archipel: ARCHIPEL,
  gebirgsbogen: GEBIRGSBOGEN,
  dreifachmeer: DREIFACHMEER,
  weltenring: WELTENRING,
  sternenmeer: STERNENMEER,
};
