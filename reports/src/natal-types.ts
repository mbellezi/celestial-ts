import type { ChartData, ChartHouses, ChartLocation, DateTimeInput, HouseSystem } from '../../pkg/charts/index.js';

export const NATAL_BODIES = Object.freeze(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const);
export type NatalBody = typeof NATAL_BODIES[number];
export type NatalPoint = NatalBody | 'trueNode' | 'ascendant' | 'midheaven';
export const NATAL_ASPECT_ANGLES = Object.freeze([0, 30, 45, 60, 90, 120, 135, 150, 180] as const);
export type NatalAspectAngle = typeof NATAL_ASPECT_ANGLES[number];
export type NatalPerspective = 'personal' | 'professional';
export type NatalReportInput = DateTimeInput & { location: ChartLocation; houseSystem?: HouseSystem; name?: string };
export interface NatalReportOptions {
  /** Minor aspects (30, 45, 135, 150 degrees) are included by default. */
  includeMinorAspects?: boolean;
  /** Absolute angular orbs, in degrees; zero requires an exact aspect. */
  orbs?: Partial<Record<NatalAspectAngle, number>>;
}
export interface NatalRenderOptions {
  /** Both perspectives by default, in personal/professional order. */
  perspectives?: readonly NatalPerspective[];
}
export interface NatalInterpretation {
  key: string;
  sourceKeys: string[];
  title: string;
  personal: string[];
  professional: string[];
}
export interface NatalAspect {
  id: string;
  first: NatalPoint;
  second: NatalPoint;
  angle: NatalAspectAngle;
  separation: number;
  orb: number;
  maxOrb: number;
  /** Angular distance within the configured orb, not a measure of influence. */
  relativeOrb: number;
  interpretationKey: string;
}
export interface NatalEvidence {
  points: NatalPoint[];
  longitude?: number;
  sign?: number;
  house?: number;
  speedLongitude?: number;
  retrograde?: boolean;
  southNodeLongitude?: number;
  southNodeSign?: number;
  southNodeHouse?: number;
  aspectId?: string;
}
export interface NatalReading {
  id: string;
  kind: 'ascendant' | 'midheaven' | 'sign' | 'house' | 'retrograde' | 'nodeSign' | 'nodeHouse' | 'aspect';
  interpretationKey: string;
  evidence: NatalEvidence;
}
export interface NatalSection {
  id: NatalBody | 'ascendant' | 'midheaven' | 'nodes' | 'aspects';
  title: string;
  readingIds: string[];
  relatedAspectIds: string[];
}
export interface NatalRegent {
  point: 'ascendant' | 'midheaven';
  sign: number;
  traditional: NatalBody;
  modern?: NatalBody;
  readingIds: string[];
}
export interface NatalReport {
  version: string;
  catalogVersion: string;
  locale: 'pt-BR';
  reference: 'western-tropical-geocentric';
  scope: 'natal-psychological';
  name?: string;
  title: string;
  introduction: string;
  methodology: string;
  disclaimer: string;
  authorship: { model: 'gpt-6-astra'; skill: 'humanizar-pt-br'; generation: 'static-editorial-catalog' };
  chart: Pick<ChartData, 'instant' | 'timeZone' | 'displayDateTime' | 'julianDay' | 'bodies' | 'elements'> & {
    kind: 'natal'; houses: ChartHouses; location: ChartLocation;
  };
  calculation: { supportedYears: [1930, 2040]; includeMinorAspects: boolean; orbs: Record<NatalAspectAngle, number>; houseAssignment: 'ecliptic-longitude'; node: 'true' };
  coverage: { nodesIncluded: boolean; unsupportedBodies: string[]; readingCount: number; aspectCount: number };
  regents: NatalRegent[];
  aspects: NatalAspect[];
  sections: NatalSection[];
  readings: NatalReading[];
  interpretations: Record<string, NatalInterpretation>;
}
