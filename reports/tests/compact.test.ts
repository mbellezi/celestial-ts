import assert from 'node:assert/strict';
import test from 'node:test';
import { celestial } from '../../wasm/tests/runtime.ts';
import { compactReport, createReportGenerator, renderCompactReportText, resolveInterpretation, REPORT_DOMAINS, DEFAULT_ORBS } from '../../pkg/reports/index.js';
import type { AstrologyReport, ReportEvent, CompactAstrologyReport } from '../src/types.ts';

const DAY = 86_400_000;
function event(key: string, start: string, end = start, overrides: Partial<ReportEvent> = {}): ReportEvent {
  return { id: `${key}:${start}`, kind: key.split(':')[0] as ReportEvent['kind'], catalogKey: key,
    bodies: ['sun'], start, end, exact: start === end ? [start] : [], details: {},
    boundary: { startClipped: false, endClipped: false }, ...overrides };
}
function fixture(events: ReportEvent[], start = '2026-02-01T00:00:00.000Z', endExclusive = '2026-03-01T00:00:00.000Z', timeZone = 'UTC'): AstrologyReport {
  return { version: '1.0.0', locale: 'pt-BR', reference: 'western-tropical-geocentric', scope: 'collective-psychological',
    range: { start, endExclusive, timeZone }, calculation: { bodies: ['sun'], orbs: { ...DEFAULT_ORBS } },
    catalogVersion: '1.0.0', disclaimer: 'Leitura simbólica coletiva.', methodology: 'Fixture.',
    interpretations: Object.fromEntries(events.map(e => [e.catalogKey, resolveInterpretation(e.catalogKey)])),
    entries: events.map(e => ({ event: e, interpretationKey: e.catalogKey, fullDurationDays: null,
      durationWithinRangeDays: (Date.parse(e.end) - Date.parse(e.start)) / DAY })),
    summaries: Object.fromEntries(REPORT_DOMAINS.map(domain => [domain, { domain, text: '', eventIds: [], highlightCatalogKeys: [], contributions: [] }])) as unknown as AstrologyReport['summaries'] };
}
function checkEvidence(compact: CompactAstrologyReport, full: AstrologyReport) {
  const ids = new Set(full.entries.map(e => e.event.id));
  const selected = new Set(compact.highlights.flatMap(h => h.eventIds));
  assert.equal(compact.selection.totalEvents, full.entries.length);
  assert.equal(compact.selection.selectedEvents, selected.size);
  assert.equal(compact.selection.selectedEvents + compact.selection.omittedEvents, compact.selection.totalEvents);
  for (const highlight of compact.highlights) {
    assert.ok(highlight.eventIds.length);
    for (const id of highlight.eventIds) assert.ok(ids.has(id), id);
    const sourceExact = new Set(full.entries.filter(e => highlight.eventIds.includes(e.event.id)).flatMap(e => e.event.exact));
    for (const exact of highlight.exact) assert.ok(sourceExact.has(exact), exact);
    assert.ok(compact.interpretations[highlight.interpretationKey]);
  }
  for (const domain of compact.domains) {
    for (const id of domain.eventIds) assert.ok(selected.has(id));
    for (const key of domain.interpretationKeys) assert.ok(compact.interpretations[key]);
  }
}

test('compact kind uses local calendar dates, including short and long DST days', () => {
  for (const [start, end] of [['2026-03-29T00:00:00Z', '2026-03-29T23:00:00Z'], ['2026-10-24T23:00:00Z', '2026-10-26T00:00:00Z']]) {
    const compact = compactReport(fixture([], start, end, 'Europe/London'));
    assert.equal(compact.kind, 'day'); assert.equal(compact.selection.maxHighlights, 3);
  }
  assert.equal(compactReport(fixture([], '2026-02-01T12:00:00Z', '2026-02-02T12:00:00Z')).kind, 'period');
  assert.equal(compactReport(fixture([])).kind, 'month');
});

test('compact selection is deterministic, bounded, and favors a station and ingress over lunar aspects', () => {
  const events = Array.from({ length: 20 }, (_, i) => event('aspect:sun:moon:60', `2026-02-${String(i + 1).padStart(2, '0')}T12:00:00.000Z`, undefined, { bodies: ['sun', 'moon'] }));
  events.push(event('station:mercury:retrograde', '2026-02-26T12:00:00.000Z', undefined, { bodies: ['mercury'], details: { direction: 'retrograde' } }));
  events.push(event('sign:sun:11', '2026-02-18T12:00:00.000Z', '2026-03-01T00:00:00.000Z', { details: { sign: 11 }, boundary: { startClipped: false, endClipped: true } }));
  const full = fixture(events), result = compactReport(full, { maxHighlights: 2 });
  assert.equal(result.highlights.length, 2);
  assert.ok(result.highlights.some(h => h.interpretationKey.startsWith('station:')));
  assert.ok(result.highlights.some(h => h.interpretationKey.startsWith('sign:')));
  assert.deepEqual(compactReport(fixture([...events].reverse()), { maxHighlights: 2 }), result);
  checkEvidence(result, full);
});

test('a daily exact event outranks a background interval and clipped sign presence never invents ingress', () => {
  const start = '2026-02-17T00:00:00.000Z', end = '2026-02-18T00:00:00.000Z';
  const background = event('aspect:saturn:neptune:0', start, end, { bodies: ['saturn', 'neptune'], boundary: { startClipped: true, endClipped: true } });
  const exact = event('aspect:sun:moon:60', '2026-02-17T12:00:00.000Z', undefined, { bodies: ['sun', 'moon'] });
  const result = compactReport(fixture([background, exact], start, end), { maxHighlights: 1 });
  assert.deepEqual(result.highlights[0].eventIds, [exact.id]);
  const presence = event('sign:sun:10', start, end, { details: { sign: 10 }, boundary: { startClipped: true, endClipped: true } });
  const text = renderCompactReportText(compactReport(fixture([presence], start, end)));
  assert.doesNotMatch(text, /ingressa|entra em|entrada em/i);
});

test('recurrences preserve their separate evidence and do not invent a continuous interval', () => {
  const events = [event('aspect:sun:moon:60', '2026-02-02T12:00:00.000Z', '2026-02-02T16:00:00.000Z', { bodies: ['sun', 'moon'] }), event('aspect:sun:moon:60', '2026-02-20T12:00:00.000Z', '2026-02-20T16:00:00.000Z', { bodies: ['sun', 'moon'] })];
  const full = fixture(events), result = compactReport(full);
  assert.equal(result.highlights.length, 1);
  assert.deepEqual(new Set(result.highlights[0].eventIds), new Set(events.map(e => e.id)));
  assert.doesNotMatch(result.highlights[0].timing, /2 de fevereiro.*(?:até| a )20 de fevereiro/i);
  checkEvidence(result, full);
});

test('real month and eclipse day are concise, traceable, and leave full reports unchanged', () => {
  const generator = createReportGenerator(celestial);
  for (const [start, end, limit, words] of [['2026-02-01', '2026-02-28', 5, 500], ['2026-02-17', '2026-02-17', 3, 250]] as const) {
    const input = { start, end }, full = generator.report(input), before = JSON.stringify(full);
    const compact = generator.reportCompact(input), text = generator.reportCompactText(input);
    assert.ok(compact.highlights.length <= limit); assert.ok(compact.highlights.some(h => h.interpretationKey.startsWith('eclipse:')));
    assert.ok(text.trim().split(/\s+/u).length <= words, `${start}: ${text.trim().split(/\s+/u).length} words`);
    assert.ok(text.length < JSON.stringify(full).length / 4);
    assert.doesNotMatch(text, /undefined|NaN|\{\w+\}|\uFFFD/);
    checkEvidence(compact, full);
    assert.equal(JSON.stringify(generator.report(input)), before);
  }
});

test('compact domain options canonicalize cache keys and isolate caller mutation', () => {
  const generator = createReportGenerator(celestial), input = { start: '2026-02-17', end: '2026-02-17' };
  const first = generator.reportCompact(input, { domains: ['work', 'health'] }), expected = JSON.stringify(first);
  first.highlights[0].eventIds.push('mutation'); first.domains[0].text = 'mutation';
  const hits = generator.cacheStats.compact.hits;
  const next = generator.reportCompact(input, { domains: ['health', 'work'] });
  assert.equal(JSON.stringify(next), expected); assert.equal(generator.cacheStats.compact.hits, hits + 1);
  assert.deepEqual(next.domains.map(d => d.domain), ['health', 'work']);
  assert.deepEqual(generator.reportCompact(input, { domains: [] }).domains, []);
  assert.deepEqual(generator.reportCompact(input, { domains: 'none' }).domains, []);
  const text = generator.reportCompactText(input, { domains: ['work', 'health'] });
  const renderedHits = generator.cacheStats.compactRendered.hits;
  assert.equal(generator.reportCompactText(input, { domains: ['health', 'work'] }), text);
  assert.equal(generator.cacheStats.compactRendered.hits, renderedHits + 1);
  generator.clearCache(); assert.equal(generator.cacheStats.compact.size, 0); assert.equal(generator.cacheStats.compactRendered.size, 0);
});

test('no selected highlights is described without claiming that no events exist', () => {
  const result = compactReport(fixture([]), { domains: [] });
  assert.equal(result.highlights.length, 0);
  assert.match(renderCompactReportText(result), /destaque/i);
  assert.doesNotMatch(renderCompactReportText(result), /nenhum evento/i);
  for (const maxHighlights of [0, -1, 9, 1.5, NaN]) assert.throws(() => compactReport(fixture([]), { maxHighlights }));
});

test('lunar eclipse suppresses only its nearby full phase and Sun–Moon opposition', () => {
  const at = '2026-02-17T12:00:00.000Z';
  const eclipse = event('eclipse:lunar:5', at, undefined, { bodies: ['sun', 'moon'] });
  const full = event('phase:full:5', at, undefined, { bodies: ['sun', 'moon'], details: { phase: 'full' } });
  const opposition = event('aspect:sun:moon:180', at, undefined, { bodies: ['sun', 'moon'], details: { angle: 180 } });
  const unrelated = event('aspect:venus:mars:180', at, undefined, { bodies: ['venus', 'mars'], details: { angle: 180 } });
  const report = fixture([eclipse, full, opposition, unrelated]), result = compactReport(report, { maxHighlights: 8 });
  const keys = result.highlights.map(h => h.interpretationKey);
  assert.ok(keys.includes(eclipse.catalogKey)); assert.ok(keys.includes(unrelated.catalogKey));
  assert.ok(!keys.includes(full.catalogKey)); assert.ok(!keys.includes(opposition.catalogKey));
  checkEvidence(result, report);
});

test('partial and cross-month periods do not claim a full calendar month', () => {
  for (const [start, end] of [['2026-02-01T12:00:00Z', '2026-03-01T00:00:00Z'], ['2026-03-01T00:00:00Z', '2026-03-29T00:00:00Z'], ['2026-02-20T00:00:00Z', '2026-03-20T00:00:00Z']]) {
    assert.equal(compactReport(fixture([], start, end)).kind, 'period');
  }
});

test('rank ties remain deterministic when recurring source entries are reordered', () => {
  const events = [event('aspect:sun:venus:60', '2026-02-20T12:00:00.000Z', undefined, { bodies: ['sun', 'venus'] }), event('aspect:sun:mars:60', '2026-02-10T12:00:00.000Z', undefined, { bodies: ['sun', 'mars'] }), event('aspect:sun:venus:60', '2026-02-01T12:00:00.000Z', undefined, { bodies: ['sun', 'venus'] })];
  assert.deepEqual(compactReport(fixture(events), { maxHighlights: 1 }), compactReport(fixture([...events].reverse()), { maxHighlights: 1 }));
});

test('domain content and supporting evidence stay stable when other domains are requested', () => {
  const generator = createReportGenerator(celestial), input = { start: '2026-02-01', end: '2026-02-28' };
  const family = generator.reportCompact(input, { domains: ['family'] }).domains[0];
  const allFamily = generator.reportCompact(input, { domains: 'all' }).domains.find(d => d.domain === 'family');
  assert.deepEqual(family, allFamily);
});

test('compact text identifies both years when a period crosses New Year', () => {
  const events = [event('phase:full:3', '2027-01-01T01:30:00.000Z', undefined, { bodies: ['sun', 'moon'] }), event('phase:new:8', '2026-12-20T12:00:00.000Z', undefined, { bodies: ['sun', 'moon'] })];
  const result = compactReport(fixture(events, '2026-12-01T00:00:00.000Z', '2027-01-02T00:00:00.000Z'));
  const text = renderCompactReportText(result);
  assert.match(text, /2026/); assert.match(text, /2027/);
});

test('selected highlights are presented by date after importance determines inclusion', () => {
  const events = [event('station:mercury:retrograde', '2026-02-26T12:00:00.000Z', undefined, { bodies: ['mercury'], details: { direction: 'retrograde' } }), event('phase:full:4', '2026-02-01T12:00:00.000Z', undefined, { bodies: ['sun', 'moon'] }), event('sign:sun:11', '2026-02-18T12:00:00.000Z', '2026-03-01T00:00:00.000Z', { details: { sign: 11 }, boundary: { startClipped: false, endClipped: true } })];
  const result = compactReport(fixture(events), { maxHighlights: 3 });
  const times = result.highlights.map(h => Math.min(...h.eventIds.map(id => Date.parse(events.find(e => e.id === id)!.start))));
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  assert.deepEqual(result.domains.map(d => d.domain), ['health', 'relationships', 'finance', 'work', 'family']);
});

test('retrograde timing describes each observed interval rather than its terminal direct station', () => {
  const station = '2026-02-10T18:00:00.000Z';
  const intervals = [event('retrograde:mercury:10', '2026-02-01T00:00:00.000Z', station, { bodies: ['mercury'], exact: [station], details: { direction: 'retrograde', sign: 10 }, boundary: { startClipped: true, endClipped: false } }), event('retrograde:mercury:10', '2026-02-20T06:00:00.000Z', '2026-02-24T12:00:00.000Z', { bodies: ['mercury'], exact: [], details: { direction: 'retrograde', sign: 10 } })];
  const full = fixture(intervals), result = compactReport(full);
  const highlight = result.highlights[0];
  const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
  assert.ok(highlight.timing.includes(`${date(intervals[0].start)} até ${date(station)}`));
  assert.ok(highlight.timing.includes(`${date(intervals[1].start)} até ${date(intervals[1].end)}`));
  assert.ok(highlight.timing.includes('; '));
  assert.deepEqual(highlight.exact, [station]);
  assert.notEqual(highlight.timing, date(station));
  assert.ok(!highlight.timing.includes(`${date(intervals[0].start)} até ${date(intervals[1].end)}`));
  checkEvidence(result, full);
});

test('an eclipse starting inside a query does not claim its outside maximum occurs there', () => {
  const start = '2026-02-17T09:00:00.000Z', end = '2026-02-17T11:00:00.000Z';
  const eclipse = event('eclipse:solar:10', '2026-02-17T09:56:00.000Z', end, { bodies: ['sun', 'moon'], exact: [], details: { maximum: '2026-02-17T12:11:00.000Z' }, boundary: { startClipped: false, endClipped: true } });
  const full = fixture([eclipse], start, end), result = compactReport(full), text = renderCompactReportText(result);
  assert.match(text, /intervalo físico global/i);
  assert.doesNotMatch(text, /atinge seu máximo|máximo.*12:11/i);
  assert.deepEqual(result.highlights[0].exact, []);
  checkEvidence(result, full);
});

test('monthly slow-planet ingress and exact slow pair outrank a fast Mercury aspect', () => {
  const fast = event('aspect:mercury:uranus:90', '2026-02-01T12:00:00.000Z', undefined, { bodies: ['mercury', 'uranus'], details: { angle: 90 } });
  const ingress = event('sign:saturn:0', '2026-02-14T12:00:00.000Z', '2026-03-01T00:00:00.000Z', { bodies: ['saturn'], details: { sign: 0 }, boundary: { startClipped: false, endClipped: true } });
  const slow = event('aspect:saturn:neptune:0', '2026-02-20T12:00:00.000Z', undefined, { bodies: ['saturn', 'neptune'], details: { angle: 0 } });
  for (const important of [ingress, slow]) {
    const result = compactReport(fixture([fast, important]), { maxHighlights: 1 });
    assert.deepEqual(result.highlights[0].eventIds, [important.id]);
  }
});
