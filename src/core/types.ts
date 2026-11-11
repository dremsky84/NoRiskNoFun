export type Phase = 'verstaerken' | 'angreifen' | 'verschieben';
export type Schwierigkeit = 'lehrling' | 'geselle' | 'meister';
export type Charakter = 'mensch' | 'angreifer' | 'verteidiger' | 'expansionist';
export type Punkt = [number, number];

export interface Gebiet {
  id: number;
  name: string;
  kontinent: number;
  zentrum: Punkt;
  polygon: Punkt[];
  nachbarn: number[];
}

export interface Kontinent {
  id: number;
  name: string;
  bonus: number;
  gebiete: number[];
}

/** Unbetretbare Fläche: Ozean oder Gebirge. Trennt Gebiete, ist aber kein Gebiet. */
export interface Feld {
  typ: 'ozean' | 'gebirge';
  zentrum: Punkt;
  polygon: Punkt[];
}

export interface Karte {
  name: string;
  gebiete: Gebiet[];
  kontinente: Kontinent[];
  felder: Feld[];
  /** Seewege zwischen Gebieten, die nicht über eine Landgrenze verbunden sind. */
  seewege: [number, number][];
}

export type Mission =
  | { art: 'kontinente'; kontinente: number[] }
  | { art: 'gebiete'; anzahl: number };

export interface Spieler {
  id: number;
  name: string;
  ki: boolean;
  charakter: Charakter;
  farbe: string;
  mission: Mission;
  lebt: boolean;
}

export interface Gefecht {
  von: number;
  nach: number;
  angriffWuerfel: number[];
  verteidigWuerfel: number[];
  angreiferVerluste: number;
  verteidigerVerluste: number;
  erobert: boolean;
}

export interface AusstehendeEroberung {
  von: number;
  nach: number;
  min: number;
  max: number;
}

export interface Spielzustand {
  karte: Karte;
  spieler: Spieler[];
  besitz: number[];
  truppen: number[];
  aktiver: number;
  runde: number;
  phase: Phase;
  verstaerkung: number;
  verschoben: boolean;
  eroberung: AusstehendeEroberung | null;
  letzterAngriff: Gefecht | null;
  /** Noch zu platzierende Truppen des Menschen vor Spielbeginn (freie Aufstellung). 0 = keine Aufstellung. */
  aufstellung: number;
  schwierigkeit: Schwierigkeit;
  sieger: number | null;
  siegGrund: string;
  protokoll: string[];
}
