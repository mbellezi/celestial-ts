export type ChartLocale = 'pt-BR' | 'en';
export type ChartKind = 'natal' | 'planetary';
export type BodyKey = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter'
  | 'saturn' | 'uranus' | 'neptune' | 'pluto' | 'trueNode' | 'chiron';
export type ZodiacSign = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type HouseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type HouseSystem = 'P' | 'W' | 'E';
export type AspectAngle = 0 | 60 | 90 | 120 | 180;
export type ElementKey = 'fire' | 'earth' | 'air' | 'water';
export type HouseCusps = [number, number, number, number, number, number, number,
  number, number, number, number, number, number];

export interface ChartLocation {
  label?: string;
  latitude: number;
  longitude: number;
}

export type DateTimeInput =
  | { instant: string; timeZone?: string; date?: never; time?: never }
  | { date: string; time: string; timeZone: string; instant?: never };

export interface CalculationOptions {
  locale?: ChartLocale;
  bodies?: readonly BodyKey[];
  houseSystem?: HouseSystem;
}

export type NatalChartInput = DateTimeInput & CalculationOptions & { location: ChartLocation };
export type PlanetaryChartInput = DateTimeInput & CalculationOptions & { location?: ChartLocation };

export interface BodyPosition {
  id: number;
  key: BodyKey;
  longitude: number;
  latitude: number;
  distance: number;
  speedLongitude: number;
  retrograde: boolean;
  sign: ZodiacSign;
  degreeInSign: number;
  house?: HouseNumber;
}

export interface ChartHouses {
  cusps: HouseCusps;
  ascendant: number;
  midheaven: number;
  system: HouseSystem;
}

export interface ChartAspect {
  body1: number;
  body2: number;
  angle: AspectAngle;
  orb: number;
  applying: boolean;
}

export interface ChartData {
  kind: ChartKind;
  instant: string;
  displayDateTime: string;
  timeZone: string;
  location?: ChartLocation;
  julianDay: number;
  bodies: BodyPosition[];
  houses?: ChartHouses;
  aspects: ChartAspect[];
  elements: Record<ElementKey, number>;
}

export interface ChartCalculator {
  natal(input: NatalChartInput): ChartData;
  planetary(input: PlanetaryChartInput): ChartData;
}
