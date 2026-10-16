import assert from 'node:assert/strict';
import { test } from 'node:test';
import { celestial } from '../../wasm/tests/runtime.ts';
import { createReportGenerator, renderReportText, resolveInterpretation, REPORT_DOMAINS, DEFAULT_ORBS } from '../../pkg/reports/index.js';
import type { AstrologyReport, ReportEvent, ReportDomain } from '../src/types.ts';

const DAY = 86_400_000;
function event(key: string, start: string, end = start, overrides: Partial<ReportEvent> = {}): ReportEvent {
  return {
    id: `${key}:${start}`, kind: key.split(':')[0] as ReportEvent['kind'], catalogKey: key,
    bodies: ['sun'], start, end, exact: start === end ? [start] : [], details: {},
    boundary: { startClipped: false, endClipped: false }, ...overrides,
  };
}
function fixture(events: ReportEvent[], start: string, endExclusive: string, timeZone = 'UTC'): AstrologyReport {
  const interpretations = Object.fromEntries(events.map(e => [e.catalogKey, resolveInterpretation(e.catalogKey)]));
  const entries = events.map(e => ({ event: e, interpretationKey: e.catalogKey,
    fullDurationDays: e.boundary.startClipped || e.boundary.endClipped ? null : (Date.parse(e.end) - Date.parse(e.start)) / DAY,
    durationWithinRangeDays: (Date.parse(e.end) - Date.parse(e.start)) / DAY }));
  const summaries = Object.fromEntries(REPORT_DOMAINS.map(domain => [domain, {
    domain, text: `SENTINELA_${domain.toUpperCase()}`, eventIds: events.map(e => e.id),
    highlightCatalogKeys: [...new Set(events.map(e => e.catalogKey))], contributions: [],
  }])) as unknown as AstrologyReport['summaries'];
  return {
    version: '1.0.0', locale: 'pt-BR', reference: 'western-tropical-geocentric', scope: 'collective-psychological',
    range: { start, endExclusive, timeZone }, calculation: { bodies: ['sun'], orbs: { ...DEFAULT_ORBS } },
    catalogVersion: '1.0.0', disclaimer: 'Leitura simbólica coletiva.', methodology: 'Fixture factual para apresentação.',
    interpretations, entries, summaries,
  };
}

test('narrative orders actual February phases and states their calculated instants', () => {
  const generator = createReportGenerator(celestial);
  const report = generator.report({ start: '2026-02-01', end: '2026-02-28', bodies: ['sun', 'moon'] });
  const phases = report.entries.filter(entry => entry.event.kind === 'phase');
  assert.ok(phases.some(entry => entry.event.details.phase === 'full'));
  assert.ok(phases.some(entry => entry.event.details.phase === 'new'));
  report.entries = [...phases].reverse();
  const text = renderReportText(report, { domains: [] });
  assert.match(text, /fevereiro de 2026/);
  assert.match(text, /Lua cheia/i);
  assert.match(text, /Lua nova/i);
  assert.ok(text.indexOf('1 de fevereiro') < text.indexOf('17 de fevereiro'));
  for (const entry of phases) {
    const actual = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(entry.event.start));
    assert.ok(text.includes(actual), actual);
  }
  assert.doesNotMatch(text, /\{\w+\}|undefined|NaN/);
});

test('dates convert to the report timezone across month and year boundaries', () => {
  const phases = [event('phase:full:3', '2027-01-01T01:30:00.000Z'), event('phase:new:4', '2027-03-01T01:30:00.000Z')];
  const report = fixture(phases, '2027-01-01T00:00:00.000Z', '2027-03-02T00:00:00.000Z', 'America/Sao_Paulo');
  const text = renderReportText(report, { domains: [] });
  assert.match(text, /31 de dezembro de 2026.*22:30/);
  assert.match(text, /28 de fevereiro de 2027.*22:30/);
  assert.doesNotMatch(text, /1 de janeiro de 2027|1 de março de 2027/);
});

test('sign presence already active at the start does not invent an ingress', () => {
  const start = '2026-02-01T00:00:00.000Z', end = '2026-02-02T00:00:00.000Z';
  const presence = event('sign:sun:10', start, end, { details: { sign: 10 }, boundary: { startClipped: true, endClipped: true } });
  const text = renderReportText(fixture([presence], start, end), { domains: [] });
  assert.match(text, /Sol/); assert.match(text, /Aquário/);
  assert.doesNotMatch(text, /ingressa|entra em|entrada em/i);
  assert.match(text, /antes|anterior/i); assert.match(text, /após|depois|além|continua/i);
});

test('a half-open period retains the true exit timestamp without moving it to the prior date', () => {
  const report = fixture([event('aspect:sun:moon:60', '2026-02-28T12:00:00.000Z', '2026-03-01T00:00:00.000Z', { bodies: ['sun', 'moon'], boundary: { startClipped: true, endClipped: true } })], '2026-02-28T12:00:00.000Z', '2026-03-01T00:00:00.000Z');
  const text = renderReportText(report, { domains: [] });
  assert.match(text, /28 de fevereiro de 2026/);
  assert.match(text, /1 de março de 2026.*00:00/);
  assert.doesNotMatch(text, /23:59:59/);
});

test('a lunar phase is stated as a point and does not acquire an interval', () => {
  const phase = event('phase:new:10', '2026-02-17T12:02:08.068Z', undefined, { bodies: ['sun', 'moon'], details: { phase: 'new', sign: 10 } });
  const text = renderReportText(fixture([phase], '2026-02-17T00:00:00.000Z', '2026-02-18T00:00:00.000Z'), { domains: [] });
  assert.match(text, /Lua nova/i); assert.match(text, /17 de fevereiro de 2026/);
  assert.doesNotMatch(text, /dura|permanece de|de 17 de fevereiro.* a 17 de fevereiro/i);
});

test('eclipse narrative preserves predicted global contacts when the query clips before maximum', () => {
  const generator = createReportGenerator(celestial);
  const report = generator.report({ start: '2026-02-17T10:00:00Z', end: '2026-02-17T11:00:00Z', bodies: ['sun'] });
  report.entries = report.entries.filter(entry => entry.event.kind === 'eclipse');
  assert.equal(report.entries.length, 1);
  assert.deepEqual(report.entries[0].event.exact, []);
  const text = renderReportText(report, { domains: [] });
  assert.match(text, /eclipse solar/i); assert.match(text, /UT1/i);
  assert.match(text, /global/i); assert.match(text, /previst|estimad/i);
  assert.match(text, /09:56/); assert.match(text, /14:27/);
  assert.match(text, /12:11/);
  assert.match(text, /4h 31min 15s/);
});

test('selected domains control interpretive paragraphs while all event facts remain', () => {
  const start = '2026-02-17T12:02:08.068Z';
  const report = fixture([event('phase:new:10', start)], '2026-02-17T00:00:00.000Z', '2026-02-18T00:00:00.000Z');
  const interpretation = report.interpretations['phase:new:10'];
  for (const domain of REPORT_DOMAINS) interpretation[domain] = `TEXTO_EXCLUSIVO_${domain.toUpperCase()}`;
  const text = renderReportText(report, { domains: ['finance', 'work'] });
  assert.match(text, /Lua nova/i); assert.match(text, /TEXTO_EXCLUSIVO_FINANCE/); assert.match(text, /TEXTO_EXCLUSIVO_WORK/);
  for (const domain of ['general', 'health', 'relationships', 'family'] as ReportDomain[]) assert.ok(!text.includes(`TEXTO_EXCLUSIVO_${domain.toUpperCase()}`));
  const all = renderReportText(report, { domains: 'all' });
  for (const domain of REPORT_DOMAINS) assert.ok(all.includes(`TEXTO_EXCLUSIVO_${domain.toUpperCase()}`));
});

test('generator reportText equals rendering its structured report and reuses the text cache', () => {
  const generator = createReportGenerator(celestial);
  const request = { start: '2026-02-17', end: '2026-02-17', timeZone: 'America/Sao_Paulo', bodies: ['sun', 'moon'] as const };
  const options = { domains: ['general', 'relationships'] as const };
  const expected = renderReportText(generator.report(request), options);
  const first = generator.reportText(request, options);
  assert.equal(first, expected);
  const before = generator.cacheStats.rendered.hits;
  assert.equal(generator.reportText(request, { domains: ['relationships', 'general'] }), expected);
  assert.equal(generator.cacheStats.rendered.hits, before + 1);
  generator.clearCache(); assert.equal(generator.cacheStats.rendered.size, 0);
});

test('subsecond narrative keeps distinct query bounds with milliseconds', () => {
  const start = '2026-02-17T10:00:00.123Z', end = '2026-02-17T10:00:00.223Z';
  const report = fixture([event('aspect:sun:moon:60', start, end, { bodies: ['sun', 'moon'], boundary: { startClipped: true, endClipped: true } })], start, end);
  const text = renderReportText(report, { domains: [] });
  assert.match(text, /10:00:00,123/); assert.match(text, /10:00:00,223/);
});

test('subminute narrative displays distinct seconds rather than an empty-looking minute interval', () => {
  const start = '2026-02-17T10:00:05.000Z', end = '2026-02-17T10:00:25.000Z';
  const report = fixture([event('aspect:sun:moon:60', start, end, { bodies: ['sun', 'moon'], boundary: { startClipped: true, endClipped: true } })], start, end);
  const text = renderReportText(report, { domains: [] });
  assert.match(text, /10:00:05/); assert.match(text, /10:00:25/);
});
