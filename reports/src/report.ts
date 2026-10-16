import { compactReport, renderCompactReportText, normalizeCompactOptions, COMPACT_REPORT_VERSION } from './compact.ts';
import { renderReportText, normalizeTextOptions } from './text.ts';
import { LruCache } from './cache.ts';
import { CATALOG_VERSION, DISCLAIMER, METHODOLOGY, resolveInterpretation } from './catalog.ts';
import { detectEvents, type ReportWasmApi } from './events.ts';
import { normalizeRange } from './range.ts';
import { REPORT_DOMAINS, type CompactAstrologyReport, type CompactReportOptions, type AstrologyReport, type DomainSummary, type ReportEvent, type ReportInput, type ReportTextOptions } from './types.ts';
export const REPORT_VERSION = '1.0.0';
/** Own caches belong to one WASM instance; callers must clear after changing its calculation configuration. */
export function createReportGenerator(core: ReportWasmApi, options: { cacheSize?: number } = {}) {
  const capacity = options.cacheSize ?? 128;
  const reports = new LruCache<AstrologyReport>(capacity, 8 * 1024 * 1024);
  const eventsCache = new LruCache<ReportEvent[]>(capacity, 8 * 1024 * 1024);
  const serialized = new LruCache<string>(capacity, 8 * 1024 * 1024);
  const rendered = new LruCache<string>(capacity, 8 * 1024 * 1024);
  const compact = new LruCache<CompactAstrologyReport>(capacity, 8 * 1024 * 1024);
  const compactRendered = new LruCache<string>(capacity, 8 * 1024 * 1024);
  const samples = new LruCache<unknown>(capacity * 128, 8 * 1024 * 1024);
  function report(input: ReportInput): AstrologyReport {
    const range = normalizeRange(input);
    const key = JSON.stringify([REPORT_VERSION, CATALOG_VERSION, range]);
    const existing = reports.get(key);
    if (existing) return structuredClone(existing);
    // The event engine receives the entire requested interval so cross-boundary intervals remain connected.
    const eventKey = JSON.stringify([REPORT_VERSION, range.startMs, range.endMs, range.bodies, range.orbs]);
    let events = eventsCache.get(eventKey);
    if (!events) {
      events = detectEvents(core, range, samples);
      eventsCache.set(eventKey, events, JSON.stringify(events).length * 2);
    }
    const interpretations = Object.fromEntries([...new Set(events.map(event => event.catalogKey))].map(key => [key, resolveInterpretation(key)]));
    const entries = events.map(event => ({ event, interpretationKey: event.catalogKey,
      fullDurationDays: typeof event.details.fullStart === 'string' && typeof event.details.fullEnd === 'string' ? (Date.parse(event.details.fullEnd) - Date.parse(event.details.fullStart)) / 86_400_000 : event.start === event.end ? 0 : null,
      durationWithinRangeDays: Math.max(0, Math.min(range.endMs, Date.parse(event.end)) - Math.max(range.startMs, Date.parse(event.start))) / 86_400_000 }));
    const summaries = Object.fromEntries(REPORT_DOMAINS.map(domain => {
      const groups = new Map<string, DomainSummary['contributions'][number]>();
      for (const entry of entries) {
        const key = entry.event.catalogKey;
        const group = groups.get(key);
        if (group) { group.eventIds.push(entry.event.id); group.durationWithinRangeDays += entry.durationWithinRangeDays; }
        else groups.set(key, { eventIds: [entry.event.id], catalogKey: key, durationWithinRangeDays: entry.durationWithinRangeDays });
      }
      // Editorial prominence only: rare event classes first, then longer overlap, then canonical key.
      const priority = ['eclipse', 'station', 'phase', 'aspect', 'retrograde', 'sign'];
      const contributions = [...groups.values()].sort((a, b) => priority.indexOf(a.catalogKey.split(':')[0]) - priority.indexOf(b.catalogKey.split(':')[0])
        || b.durationWithinRangeDays - a.durationWithinRangeDays || a.catalogKey.localeCompare(b.catalogKey));
      const paragraphs = [...new Set(contributions.slice(0, 6).flatMap(c => interpretations[c.catalogKey][domain].split('\n\n')))];
      const summary: DomainSummary = { domain,
        text: paragraphs.length ? paragraphs.join('\n\n') : 'Nenhum evento do escopo selecionado foi encontrado neste período.',
        eventIds: contributions.flatMap(c => c.eventIds), highlightCatalogKeys: contributions.slice(0, 6).map(c => c.catalogKey), contributions };
      return [domain, summary];
    })) as AstrologyReport['summaries'];
    const result: AstrologyReport = { version: REPORT_VERSION, locale: 'pt-BR', reference: 'western-tropical-geocentric', scope: 'collective-psychological',
      range: { start: new Date(range.startMs).toISOString(), endExclusive: new Date(range.endMs).toISOString(), timeZone: range.timeZone },
      calculation: { bodies: [...range.bodies], orbs: { ...range.orbs } }, catalogVersion: CATALOG_VERSION, disclaimer: DISCLAIMER, methodology: METHODOLOGY, interpretations, entries, summaries };
    reports.set(key, result, JSON.stringify(result).length * 2);
    return structuredClone(result);
  }
  function reportCompact(input: ReportInput, options: CompactReportOptions = {}): CompactAstrologyReport {
    const key = JSON.stringify([COMPACT_REPORT_VERSION, CATALOG_VERSION, normalizeRange(input), normalizeCompactOptions(options)]);
    const existing = compact.get(key);
    if (existing) return structuredClone(existing);
    const value = compactReport(report(input), options);
    compact.set(key, value, JSON.stringify(value).length * 2);
    return structuredClone(value);
  }
  return { report, reportCompact,
    reportCompactText(input: ReportInput, options: CompactReportOptions = {}): string {
      const key = JSON.stringify([COMPACT_REPORT_VERSION, CATALOG_VERSION, normalizeRange(input), normalizeCompactOptions(options)]);
      const existing = compactRendered.get(key);
      if (existing !== undefined) return existing;
      const value = renderCompactReportText(reportCompact(input, options));
      compactRendered.set(key, value, value.length * 2);
      return value;
    },
    reportText(input: ReportInput, textOptions: ReportTextOptions = {}): string {
      const key = JSON.stringify([REPORT_VERSION, CATALOG_VERSION, normalizeRange(input), normalizeTextOptions(textOptions)]);
      const existing = rendered.get(key);
      if (existing !== undefined) return existing;
      const value = renderReportText(report(input), textOptions);
      rendered.set(key, value, value.length * 2);
      return value;
    },
    reportJSON(input: ReportInput, space?: number): string {
      if (space !== undefined && (!Number.isInteger(space) || space < 0 || space > 10)) throw new RangeError('space must be an integer from 0 to 10');
      const key = JSON.stringify([REPORT_VERSION, CATALOG_VERSION, normalizeRange(input), space ?? 0]);
      const existing = serialized.get(key);
      if (existing !== undefined) return existing;
      const value = JSON.stringify(report(input), null, space);
      serialized.set(key, value, value.length * 2);
      return value;
    },
    clearCache() { compact.clear(); compactRendered.clear(); reports.clear(); eventsCache.clear(); samples.clear(); serialized.clear(); rendered.clear(); },
    get cacheStats() { return { compact: compact.stats, compactRendered: compactRendered.stats, reports: reports.stats, events: eventsCache.stats, samples: samples.stats, serialized: serialized.stats, rendered: rendered.stats }; },
  };
}
