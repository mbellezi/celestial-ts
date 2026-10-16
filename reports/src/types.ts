export const REPORT_BODIES = Object.freeze(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const);
export type ReportBody = typeof REPORT_BODIES[number];
export type AspectAngle = 0 | 60 | 90 | 120 | 180;
export const REPORT_DOMAINS = Object.freeze(['general', 'health', 'relationships', 'finance', 'work', 'family'] as const);
export type ReportDomain = typeof REPORT_DOMAINS[number];
export type DomainText = Record<ReportDomain, string>;
export interface ReportEvent {
  id: string;
  kind: 'aspect' | 'sign' | 'station' | 'retrograde' | 'phase' | 'eclipse';
  catalogKey: string;
  bodies: ReportBody[];
  start: string;
  end: string;
  exact: string[];
  details: Record<string, string | number | boolean>;
  boundary: { startClipped: boolean; endClipped: boolean };
}
export interface DetectionRequest {
  startMs: number;
  endMs: number;
  bodies: readonly ReportBody[];
  orbs: Record<AspectAngle, number>;
}
/** Date-only end is inclusive; an offset-bearing instant end is exclusive. Never mix the forms. */
export interface ReportInput {
  start: string;
  end: string;
  timeZone?: string;
  bodies?: readonly ReportBody[];
  orbs?: Partial<Record<AspectAngle, number>>;
}
export interface ResolvedInterpretation extends DomainText {
  key: string;
  title: string;
  sourceKeys: string[];
}
export interface ReportEntry {
  event: ReportEvent;
  interpretationKey: string;
  fullDurationDays: number | null;
  durationWithinRangeDays: number;
}
export interface DomainSummary {
  domain: ReportDomain;
  text: string;
  eventIds: string[];
  highlightCatalogKeys: string[];
  contributions: { eventIds: string[]; catalogKey: string; durationWithinRangeDays: number }[];
}
export interface AstrologyReport {
  version: string;
  locale: 'pt-BR';
  reference: 'western-tropical-geocentric';
  scope: 'collective-psychological';
  range: { start: string; endExclusive: string; timeZone: string };
  calculation: { bodies: ReportBody[]; orbs: Record<AspectAngle, number> };
  catalogVersion: string;
  disclaimer: string;
  methodology: string;
  interpretations: Record<string, ResolvedInterpretation>;
  entries: ReportEntry[];
  summaries: Record<ReportDomain, DomainSummary>;
}

export interface ReportTextOptions {
  /** Defaults to general; use all for all six editorial domains. */
  domains?: 'all' | readonly ReportDomain[];
}

export interface CompactReportOptions {
  /** Five practical domains by default; general overview is always included. */
  domains?: 'all' | 'none' | readonly ReportDomain[];
  /** Defaults to three for a local day and five for longer periods. */
  maxHighlights?: number;
}
export interface CompactHighlight {
  eventIds: string[];
  interpretationKey: string;
  title: string;
  text: string;
  timing: string;
  exact: string[];
  background: boolean;
}
export interface CompactAstrologyReport {
  version: string;
  catalogVersion: string;
  sourceReportVersion: string;
  locale: 'pt-BR';
  kind: 'day' | 'month' | 'period';
  range: AstrologyReport['range'];
  overview: string;
  highlights: CompactHighlight[];
  domains: { domain: ReportDomain; text: string; eventIds: string[]; interpretationKeys: string[] }[];
  interpretations: Record<string, { key: string; title: string; sourceKeys: string[] }>;
  selection: { totalEvents: number; selectedEvents: number; omittedEvents: number; maxHighlights: number; policy: string };
  disclaimer: string;
}
