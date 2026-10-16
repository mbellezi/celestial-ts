import assert from 'node:assert/strict';
import test from 'node:test';
import { celestial } from '../../wasm/tests/runtime.ts';
import { astroReport, renderAstroReportText, createReportGenerator, resolveInterpretation, REPORT_DOMAINS, DEFAULT_ORBS, ASTRO_REPORT_VERSION } from '../../pkg/reports/index.js';
import type { AstrologyReport, ReportEvent, AstroReport } from '../src/types.ts';

function event(key: string, start: string, end = start, overrides: Partial<ReportEvent> = {}): ReportEvent {
  return { id: `${key}:${start}`, kind: key.split(':')[0] as ReportEvent['kind'], catalogKey: key, bodies: ['sun'], start, end,
    exact: start === end ? [start] : [], details: {}, boundary: { startClipped: false, endClipped: false }, ...overrides };
}
function fixture(events: ReportEvent[], start = '2026-02-01T00:00:00.000Z', endExclusive = '2026-03-01T00:00:00.000Z', timeZone = 'UTC'): AstrologyReport {
  return { version: '1.0.0', locale: 'pt-BR', reference: 'western-tropical-geocentric', scope: 'collective-psychological',
    range: { start, endExclusive, timeZone }, calculation: { bodies: ['sun'], orbs: { ...DEFAULT_ORBS } }, catalogVersion: '1.0.0',
    disclaimer: 'Leitura simbólica coletiva.', methodology: 'Fixture.',
    interpretations: Object.fromEntries(events.map(e => [e.catalogKey, resolveInterpretation(e.catalogKey)])),
    entries: events.map(e => ({ event: e, interpretationKey: e.catalogKey, fullDurationDays: null,
      durationWithinRangeDays: (Date.parse(e.end) - Date.parse(e.start)) / 86_400_000 })),
    summaries: Object.fromEntries(REPORT_DOMAINS.map(domain => [domain, { domain, text: '', eventIds: [], highlightCatalogKeys: [], contributions: [] }])) as unknown as AstrologyReport['summaries'] };
}
function checkEvidence(result: AstroReport, full: AstrologyReport) {
  const selected = new Set(result.passages.flatMap(p => p.eventIds));
  assert.equal(result.selection.totalEvents, full.entries.length);
  assert.equal(result.selection.selectedEvents, selected.size);
  assert.equal(result.selection.selectedEvents + result.selection.omittedEvents, result.selection.totalEvents);
  assert.ok(selected.size <= result.selection.maxEvents);
  for (const passage of result.passages) {
    assert.ok(passage.eventIds.length); assert.ok(passage.paragraphs.length);
    const entries = full.entries.filter(e => passage.eventIds.includes(e.event.id));
    assert.equal(entries.length, new Set(passage.eventIds).size);
    const exact = new Set(entries.flatMap(e => e.event.exact).filter(at => Date.parse(at) >= Date.parse(full.range.start) && Date.parse(at) < Date.parse(full.range.endExclusive)));
    for (const at of passage.exact) assert.ok(exact.has(at), at);
    for (const key of passage.interpretationKeys) assert.ok(entries.some(e => e.interpretationKey === key), key);
    assert.ok(passage.sourceKeys.length, 'prose must identify its editorial sources');
    for (const key of passage.sourceKeys) assert.ok(typeof key === 'string' && key.trim().length > 0);
  }
}

test('astro recognizes local calendar days across DST and only complete calendar months', () => {
  for (const [start, end] of [['2026-03-29T00:00:00Z', '2026-03-29T23:00:00Z'], ['2026-10-24T23:00:00Z', '2026-10-26T00:00:00Z']]) {
    const result = astroReport(fixture([], start, end, 'Europe/London'));
    assert.equal(result.kind, 'day'); assert.equal(result.selection.maxEvents, 4);
    assert.match(result.title, /O DIA/i);
  }
  const month = astroReport(fixture([], '2026-09-30T23:00:00Z', '2026-11-01T00:00:00Z', 'Europe/London'));
  assert.equal(month.kind, 'month'); assert.equal(month.selection.maxEvents, 18); assert.match(month.title, /O MÊS DE OUTUBRO/i);
  for (const [start, end] of [['2026-02-01T12:00:00Z', '2026-03-01T00:00:00Z'], ['2026-02-20T00:00:00Z', '2026-03-20T00:00:00Z']]) {
    assert.equal(astroReport(fixture([], start, end)).kind, 'period');
  }
  for (const maxEvents of [0, -1, 33, 1.5, NaN, Infinity]) assert.throws(() => astroReport(fixture([]), { maxEvents }));
});

test('astro selection is deterministic, bounded and chronological without changing its source', () => {
  const events = [event('station:mercury:retrograde', '2026-02-26T12:00:00.000Z', undefined, { bodies: ['mercury'] }),
    event('aspect:saturn:neptune:0', '2026-02-20T12:00:00.000Z', undefined, { bodies: ['saturn', 'neptune'] }),
    event('phase:full:4', '2026-02-01T12:00:00.000Z', undefined, { bodies: ['sun', 'moon'] })];
  const full = fixture(events), before = JSON.stringify(full), result = astroReport(full, { maxEvents: 2 });
  assert.deepEqual(result, astroReport(fixture([...events].reverse()), { maxEvents: 2 }));
  assert.equal(JSON.stringify(full), before); assert.equal(result.selection.selectedEvents, 2);
  assert.deepEqual(result.passages.map(p => p.at), result.passages.map(p => p.at).sort()); checkEvidence(result, full);
});

test('clipped background presence does not invent an ingress or an exact aspect', () => {
  const start = '2026-02-17T00:00:00.000Z', end = '2026-02-18T00:00:00.000Z';
  const events = [event('sign:sun:10', start, end, { details: { sign: 10 }, boundary: { startClipped: true, endClipped: true } }),
    event('aspect:saturn:neptune:0', start, end, { bodies: ['saturn', 'neptune'], boundary: { startClipped: true, endClipped: true } })];
  const full = fixture(events, start, end), result = astroReport(full), text = renderAstroReportText(result);
  assert.doesNotMatch(text, /ingressa|entra em|entrada em|atinge.*exat|conjunção exata/i);
  assert.ok(result.passages.every(p => p.exact.length === 0)); checkEvidence(result, full);
});

test('repeated exact occurrences retain their dates and never become one continuous influence', () => {
  const dates = ['2026-02-02T12:00:00.000Z', '2026-02-20T12:00:00.000Z'];
  const events = dates.map(at => event('aspect:venus:mars:60', at, undefined, { bodies: ['venus', 'mars'] }));
  const full = fixture(events), result = astroReport(full);
  assert.deepEqual(new Set(result.passages.flatMap(p => p.exact)), new Set(dates));
  assert.deepEqual(new Set(result.passages.flatMap(p => p.eventIds)), new Set(events.map(e => e.id)));
  assert.doesNotMatch(renderAstroReportText(result), /2 de fevereiro.*(?:até| a )20 de fevereiro/i); checkEvidence(result, full);
});

test('exclusive end does not supply a selected event or exact occurrence', () => {
  const end = '2026-03-01T00:00:00.000Z', outside = event('station:mercury:direct', end, undefined, { bodies: ['mercury'] });
  const result = astroReport(fixture([outside]));
  assert.ok(!result.passages.some(p => p.eventIds.includes(outside.id)));
  assert.ok(!result.passages.some(p => p.exact.includes(end)));
});

test('partial global eclipse does not claim its maximum falls inside the query', () => {
  const start = '2026-02-17T09:00:00.000Z', end = '2026-02-17T11:00:00.000Z';
  const eclipse = event('eclipse:solar:10', '2026-02-17T09:56:00.000Z', end, { bodies: ['sun', 'moon'], exact: [],
    details: { maximum: '2026-02-17T12:11:00.000Z' }, boundary: { startClipped: false, endClipped: true } });
  const full = fixture([eclipse], start, end), result = astroReport(full), text = renderAstroReportText(result);
  assert.ok(result.passages.some(p => p.eventIds.includes(eclipse.id)));
  assert.doesNotMatch(text, /atinge seu máximo|máximo.*12:11/i); assert.deepEqual(result.passages.flatMap(p => p.exact), []); checkEvidence(result, full);
});

test('real month and day produce traceable prose and leave the full report intact', () => {
  const generator = createReportGenerator(celestial), texts: string[] = [];
  for (const [start, end, kind] of [['2026-10-01', '2026-10-31', 'month'], ['2026-10-16', '2026-10-16', 'day']] as const) {
    const input = { start, end }, full = generator.report(input), before = JSON.stringify(full);
    const result = generator.reportAstro(input), text = generator.reportAstroText(input); texts.push(text);
    assert.equal(result.version, ASTRO_REPORT_VERSION); assert.equal(result.style, 'astro'); assert.equal(result.kind, kind);
    assert.match(text, /O MOMENTO ATUAL/); assert.match(text, kind === 'month' ? /O MÊS DE OUTUBRO/i : /O DIA/i);
    assert.doesNotMatch(text, /undefined|NaN|\uFFFD|Quíron|pipa|\[imagem|image\s*:/i);
    assert.doesNotMatch(text, /aspect:sun|sign:|station:|sourceKeys|eventIds/);
    assert.ok(result.passages.length > 0); checkEvidence(result, full);
    assert.equal(JSON.stringify(generator.report(input)), before);
  }
  assert.ok(texts[1].length < texts[0].length * 0.7, 'daily prose must be meaningfully shorter than monthly prose');
});

test('astro caches isolate mutations, options and generator instances and clear alongside rendered prose', () => {
  const generator = createReportGenerator(celestial), other = createReportGenerator(celestial), input = { start: '2026-10-16', end: '2026-10-16' };
  const first = generator.reportAstro(input), expected = JSON.stringify(first); first.passages[0].eventIds.push('mutation'); first.overview = 'mutation';
  const hits = generator.cacheStats.astro.hits;
  assert.equal(JSON.stringify(generator.reportAstro(input)), expected); assert.equal(generator.cacheStats.astro.hits, hits + 1);
  assert.equal(generator.reportAstro(input, { maxEvents: 1 }).selection.maxEvents, 1);
  const text = generator.reportAstroText(input), renderedHits = generator.cacheStats.astroRendered.hits;
  assert.equal(generator.reportAstroText(input), text); assert.equal(generator.cacheStats.astroRendered.hits, renderedHits + 1);
  assert.equal(other.cacheStats.astro.size, 0); assert.equal(other.cacheStats.astroRendered.size, 0);
  generator.clearCache(); assert.equal(generator.cacheStats.astro.size, 0); assert.equal(generator.cacheStats.astroRendered.size, 0);
});

test('eclipse prose suppresses nearby phase and Sun–Moon duplication while retaining independent evidence', () => {
  const at = '2026-02-17T12:00:00.000Z';
  const eclipse = event('eclipse:solar:10', at, undefined, { bodies: ['sun', 'moon'] });
  const phase = event('phase:new:10', '2026-02-17T12:02:00.000Z', undefined, { bodies: ['sun', 'moon'], details: { phase: 'new' } });
  const conjunction = event('aspect:sun:moon:0', '2026-02-17T12:02:00.000Z', undefined, { bodies: ['sun', 'moon'], details: { angle: 0 } });
  const independent = event('aspect:venus:mars:0', at, undefined, { bodies: ['venus', 'mars'], details: { angle: 0 } });
  const remote = event('phase:new:11', '2026-02-28T12:00:00.000Z', undefined, { bodies: ['sun', 'moon'], details: { phase: 'new' } });
  const full = fixture([eclipse, phase, conjunction, independent, remote]), result = astroReport(full, { maxEvents: 32 });
  const selected = new Set(result.passages.flatMap(p => p.eventIds));
  assert.ok(selected.has(eclipse.id)); assert.ok(selected.has(independent.id)); assert.ok(selected.has(remote.id));
  // The same sky event may retain merged evidence, but must not receive three separate passages.
  const nearby = result.passages.filter(p => p.eventIds.some(id => [eclipse.id, phase.id, conjunction.id].includes(id)));
  assert.equal(nearby.length, 1); checkEvidence(result, full);
});

test('retrograde background retains its terminal exact evidence without describing an onset there', () => {
  const terminal = '2026-02-10T18:00:00.000Z';
  const retrograde = event('retrograde:mercury:10', '2026-02-01T00:00:00.000Z', terminal, {
    bodies: ['mercury'], exact: [terminal], details: { direction: 'retrograde', sign: 10 },
    boundary: { startClipped: true, endClipped: false },
  });
  const full = fixture([retrograde]), result = astroReport(full);
  assert.deepEqual(result.passages.flatMap(p => p.exact), [terminal]);
  assert.ok(result.passages.every(p => p.background));
  assert.doesNotMatch(renderAstroReportText(result), /começará a retrogradar|iniciará.*retrógrad|18:00/i);
  checkEvidence(result, full);
});

test('one aspect with repeated exacts yields dated passages while selection counts its source only once', () => {
  const dates = ['2026-02-02T12:00:00.000Z', '2026-02-20T12:00:00.000Z'];
  const aspect = event('aspect:venus:mars:60', '2026-01-30T00:00:00.000Z', '2026-03-02T00:00:00.000Z', {
    bodies: ['venus', 'mars'], exact: [...dates, '2026-03-01T12:00:00.000Z'], boundary: { startClipped: true, endClipped: true },
  });
  const full = fixture([aspect]), result = astroReport(full);
  assert.deepEqual(result.passages.map(p => p.at), dates);
  assert.deepEqual(result.passages.flatMap(p => p.exact), dates);
  assert.ok(result.passages.every(p => p.eventIds.length === 1 && p.eventIds[0] === aspect.id));
  assert.equal(result.selection.selectedEvents, 1); assert.equal(result.selection.omittedEvents, 0);
  const text = renderAstroReportText(result);
  assert.match(text, /2 de fevereiro/); assert.match(text, /20 de fevereiro/);
  assert.doesNotMatch(text, /1 de março|2 de fevereiro.*(?:até| a )20 de fevereiro/i);
  checkEvidence(result, full);
});

test('explicit default selection limits reuse both structured and rendered astro caches', () => {
  const generator = createReportGenerator(celestial);
  for (const [start, end, maxEvents] of [['2026-10-16', '2026-10-16', 4], ['2026-10-01', '2026-10-31', 18]] as const) {
    generator.clearCache();
    const input = { start, end }, expected = generator.reportAstro(input), hits = generator.cacheStats.astro.hits;
    assert.deepEqual(generator.reportAstro(input, { maxEvents }), expected);
    assert.equal(generator.cacheStats.astro.hits, hits + 1); assert.equal(generator.cacheStats.astro.size, 1);
    const text = generator.reportAstroText(input), renderedHits = generator.cacheStats.astroRendered.hits;
    assert.equal(generator.reportAstroText(input, { maxEvents }), text);
    assert.equal(generator.cacheStats.astroRendered.hits, renderedHits + 1); assert.equal(generator.cacheStats.astroRendered.size, 1);
  }
});

test('monthly selection represents successive thirds while a single slot favors a rare event', () => {
  const early = event('aspect:mercury:venus:60', '2026-02-02T12:00:00.000Z', undefined, { bodies: ['mercury', 'venus'] });
  const middle = event('aspect:venus:mars:60', '2026-02-15T12:00:00.000Z', undefined, { bodies: ['venus', 'mars'] });
  const late = event('aspect:sun:mars:60', '2026-02-25T12:00:00.000Z', undefined, { bodies: ['sun', 'mars'] });
  const rare = event('eclipse:solar:10', '2026-02-26T12:00:00.000Z', undefined, { bodies: ['sun', 'moon'] });
  const full = fixture([early, middle, late, rare]);
  const broad = astroReport(full, { maxEvents: 3 }), selected = new Set(broad.passages.flatMap(p => p.eventIds));
  assert.ok(selected.has(early.id)); assert.ok(selected.has(middle.id)); assert.ok(selected.has(rare.id));
  assert.equal(broad.selection.selectedEvents, 3); checkEvidence(broad, full);
  const focused = astroReport(full, { maxEvents: 1 });
  assert.deepEqual(focused.passages.flatMap(p => p.eventIds), [rare.id]); checkEvidence(focused, full);
});
