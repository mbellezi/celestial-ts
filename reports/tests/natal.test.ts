import test from 'node:test';
import assert from 'node:assert/strict';
import { celestial } from '../../wasm/tests/runtime.ts';
import { createChartCalculator } from '../../pkg/charts/index.js';
import type { BodyPosition, ChartData, HouseCusps } from '../../pkg/charts/index.js';
import { createNatalReportGenerator, interpretNatalChart, NATAL_BODIES, NATAL_ASPECT_ANGLES,
  DEFAULT_NATAL_ORBS, normalizeNatalOptions, getNatalCatalog, getNatalCatalogInfo,
  resolveNatalInterpretation, renderNatalReportText, renderNatalReportMarkdown, renderNatalReportHTML } from '../../pkg/reports/index.js';

const input = { instant: '1972-05-28T04:00:00Z', location: { latitude: -21.1666667, longitude: -47.8 } };
const calculator = createChartCalculator(celestial);
const chart = (): ChartData => calculator.natal({ ...input, bodies: [...NATAL_BODIES, 'trueNode'] });
function move(source: ChartData, key: BodyPosition['key'], value: number): void {
  const body = source.bodies.find(body => body.key === key)!;
  Object.assign(body, { longitude: value, sign: Math.floor(value / 30), degreeInSign: value % 30,
    house: celestial.planetHouseNumber(value, source.houses!.cusps) });
}

test('natal calculations preserve the actual 1972 birth chart and reference all readings', () => {
  const generator = createNatalReportGenerator(celestial);
  const report = generator.report(input);
  assert.equal(report.locale, 'pt-BR');
  assert.equal(report.chart.instant, '1972-05-28T04:00:00.000Z');
  assert.equal(report.chart.houses.system, 'P');
  assert.equal(report.chart.bodies.length, 11);
  assert.ok(Math.abs(report.chart.bodies[0].longitude - 66.92268354027487) < 1e-7);
  assert.ok(Math.abs(report.chart.houses.ascendant - 348.81087552122403) < 1e-7);
  assert.ok(Math.abs(report.chart.houses.midheaven - 258.96139301537005) < 1e-7);
  assert.deepEqual(report.sections.map(section => section.id), ['ascendant', 'midheaven', ...NATAL_BODIES, 'nodes', 'aspects']);
  assert.equal(report.coverage.nodesIncluded, true);
  assert.equal(report.coverage.readingCount, report.readings.length);
  assert.equal(report.coverage.aspectCount, report.aspects.length);
  assert.equal(report.readings.filter(reading => reading.kind === 'sign').length, 10);
  assert.equal(report.readings.filter(reading => reading.kind === 'house').length, 10);
  assert.deepEqual(report.readings.filter(reading => reading.kind === 'retrograde').map(reading => reading.evidence.points[0]), ['venus', 'jupiter', 'uranus', 'neptune', 'pluto']);
  assert.ok(!report.readings.some(reading => reading.kind === 'retrograde' && reading.evidence.points.includes('trueNode')));
  const readings = new Map(report.readings.map(reading => [reading.id, reading]));
  for (const section of report.sections) for (const id of section.readingIds) assert.ok(readings.has(id));
  for (const reading of report.readings) assert.ok(report.interpretations[reading.interpretationKey]);
  for (const regent of report.regents) for (const id of regent.readingIds) {
    assert.ok(readings.get(id)!.evidence.points.some(point => point === regent.traditional || point === regent.modern));
  }
  assert.deepEqual(report.regents.map(regent => [regent.point, regent.traditional, regent.modern]), [['ascendant', 'jupiter', 'neptune'], ['midheaven', 'jupiter', undefined]]);
});

test('all presentations render the same canonical report and preserve every selected paragraph', () => {
  const generator = createNatalReportGenerator(celestial);
  const report = generator.report(input);
  assert.deepEqual(JSON.parse(generator.reportJSON(input)), report);
  assert.deepEqual(JSON.parse(generator.reportJSON(input, {}, 2)), report);
  assert.equal(generator.reportText(input), renderNatalReportText(report));
  assert.equal(generator.reportMarkdown(input), renderNatalReportMarkdown(report));
  assert.equal(generator.reportHTML(input), renderNatalReportHTML(report));
  for (const perspective of ['personal', 'professional'] as const) {
    const text = renderNatalReportText(report, { perspectives: [perspective] });
    const markdown = renderNatalReportMarkdown(report, { perspectives: [perspective] });
    const html = renderNatalReportHTML(report, { perspectives: [perspective] });
    const decodedMarkdown = markdown.replace(/\\(.)/gu, '$1');
    const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" };
    const decodedHTML = html.replace(/&(amp|lt|gt|quot|#39);/gu, (_, entity: string) => entities[entity]);
    for (const entry of Object.values(report.interpretations)) for (const paragraph of entry[perspective]) {
      assert.ok(text.includes(paragraph), `${entry.key}/text`);
      assert.ok(decodedMarkdown.includes(paragraph), `${entry.key}/markdown`);
      assert.ok(decodedHTML.includes(paragraph), `${entry.key}/html`);
    }
  }
  assert.equal(generator.cacheStats.reports.misses, 1);
  assert.ok(generator.cacheStats.reports.hits >= 4);
  assert.throws(() => generator.reportJSON(input, {}, NaN));
});

test('natal cache canonicalizes dates, remains bounded, and isolates caller mutations', () => {
  const generator = createNatalReportGenerator(celestial, { cacheSize: 2 });
  const first = generator.report({ ...input, name: 'Exemplo' });
  const expected = structuredClone(first);
  first.chart.bodies[0].longitude = -1;
  first.chart.houses.cusps[1] = -1;
  first.sections[0].readingIds.push('mutation');
  first.interpretations[first.readings[0].interpretationKey].personal.push('mutation');
  assert.deepEqual(generator.report({ ...input, instant: '1972-05-28T01:00:00-03:00', houseSystem: 'P', name: 'Exemplo' }), expected);
  assert.equal(generator.cacheStats.reports.hits, 1);
  generator.report({ ...input, name: 'Segundo' });
  generator.report({ ...input, name: 'Terceiro' });
  assert.equal(generator.cacheStats.reports.size, 2);
  assert.equal(generator.cacheStats.reports.maxBytes, 8 * 1024 * 1024);
  assert.ok(generator.cacheStats.reports.bytes <= generator.cacheStats.reports.maxBytes);
  generator.clearCache();
  assert.equal(generator.cacheStats.reports.size, 0);
  assert.equal(generator.cacheStats.reports.hits, 0);
  assert.equal(generator.cacheStats.reports.misses, 0);
  assert.throws(() => createNatalReportGenerator(celestial, { cacheSize: 0 }));
});

test('supported UTC range includes leap day and both full endpoint years', () => {
  const generator = createNatalReportGenerator(celestial);
  for (const instant of ['1930-01-01T00:00:00Z', '1930-01-01T01:00:00+01:00', '2000-02-29T12:00:00Z', '2040-02-29T12:00:00Z', '2040-12-31T23:59:59.999Z']) {
    assert.doesNotThrow(() => generator.report({ ...input, instant }), instant);
  }
  for (const instant of ['1929-12-31T23:59:59.999Z', '1930-01-01T00:00:00+01:00', '2041-01-01T00:00:00Z', '1931-02-29T12:00:00Z', '2040-02-30T12:00:00Z']) {
    assert.throws(() => generator.report({ ...input, instant }), instant);
  }
  for (const local of [
    { date: '2026-03-29', time: '01:30', timeZone: 'Europe/London' },
    { date: '2026-10-25', time: '01:30', timeZone: 'Europe/London' },
  ]) assert.throws(() => generator.report({ ...local, location: input.location }));
  assert.equal(generator.report({ date: '1972-05-28', time: '01:00', timeZone: 'America/Sao_Paulo', location: input.location }).chart.instant, '1972-05-28T04:00:00.000Z');
});

test('all supported house systems propagate into facts and house readings', () => {
  const generator = createNatalReportGenerator(celestial);
  for (const system of ['P', 'E', 'W'] as const) {
    const report = generator.report({ ...input, houseSystem: system });
    assert.equal(report.chart.houses.system, system);
    for (const body of report.chart.bodies) assert.equal(body.house, celestial.planetHouseNumber(body.longitude, report.chart.houses.cusps));
  }
});

test('the complete natal interpretation pipeline covers one birth in every year from 1930 through 2040', () => {
  const generator = createNatalReportGenerator(celestial, { cacheSize: 4 });
  const latitudes = [-45, -21.166666666666668, 0, 45, 80];
  for (let year = 1930; year <= 2040; year++) {
    const index = year - 1930, latitude = latitudes[index % latitudes.length];
    const houseSystem = latitude === 80 ? 'W' : (['P', 'E', 'W'] as const)[index % 3];
    const instant = `${year}-${String(index % 12 + 1).padStart(2, '0')}-15T12:34:56Z`;
    const report = generator.report({ instant, houseSystem, location: { latitude, longitude: -160 + (index * 31) % 320 } });
    assert.equal(report.chart.instant, instant.replace('Z', '.000Z'));
    assert.equal(report.chart.bodies.length, 11);
    assert.equal(report.coverage.nodesIncluded, true);
    assert.equal(report.sections.filter(section => section.id !== 'aspects').length, 13);
    for (const reading of report.readings) {
      const interpretation = report.interpretations[reading.interpretationKey];
      assert.ok(interpretation, `${year}/${reading.id}`);
      assert.ok(interpretation.personal.length > 0 && interpretation.professional.length > 0);
    }
  }
  assert.ok(generator.cacheStats.reports.size <= 4);
  assert.throws(() => generator.report({ ...input, houseSystem: 'P', location: { latitude: 80, longitude: 0 } }));
});

test('aspects cover all nine angles, one canonical pair once, and never claim applying for angles', () => {
  const report = interpretNatalChart(chart());
  const seen = new Set<string>();
  const positions = new Map(report.chart.bodies.map(body => [body.key as string, body.longitude]));
  positions.set('ascendant', report.chart.houses.ascendant);
  positions.set('midheaven', report.chart.houses.midheaven);
  const aspectsSection = report.sections.find(section => section.id === 'aspects')!;
  for (const aspect of report.aspects) {
    const pair = [aspect.first, aspect.second].join(':');
    assert.ok(!seen.has(pair)); seen.add(pair);
    const difference = Math.abs(positions.get(aspect.first)! - positions.get(aspect.second)!);
    assert.equal(aspect.separation, Math.min(difference, 360 - difference));
    assert.equal(aspect.orb, Math.abs(aspect.separation - aspect.angle));
    assert.ok(aspect.orb <= aspect.maxOrb);
    assert.equal(Object.hasOwn(aspect, 'applying'), false);
    assert.ok(aspectsSection.readingIds.includes(aspect.id));
    assert.equal(report.readings.filter(reading => reading.id === aspect.id).length, 1);
    assert.equal(report.sections.filter(section => section.id !== 'aspects').flatMap(section => section.readingIds).includes(aspect.id), false);
    assert.deepEqual(report.interpretations[aspect.interpretationKey].sourceKeys, [`pair:${aspect.first}:${aspect.second}`, `aspect:${aspect.angle}`]);
  }
  assert.ok(report.aspects.some(aspect => [30, 45, 135, 150].includes(aspect.angle)));
  const major = interpretNatalChart(chart(), { includeMinorAspects: false });
  assert.ok(major.aspects.every(aspect => [0, 60, 90, 120, 180].includes(aspect.angle)));
  assert.deepEqual(major.aspects, report.aspects.filter(aspect => [0, 60, 90, 120, 180].includes(aspect.angle)));
  const coincident = chart();
  coincident.houses!.system = 'E';
  coincident.houses!.cusps = [0, ...Array.from({ length: 12 }, (_, index) => index * 30)] as HouseCusps;
  coincident.houses!.ascendant = 0; coincident.houses!.midheaven = 0;
  for (const body of coincident.bodies) move(coincident, body.key, 0);
  assert.equal(interpretNatalChart(coincident).aspects.length, 75);
});

test('orbs and longitude wrapping produce exact conjunctions without stale chart aspects', () => {
  const source = chart();
  move(source, 'sun', 359); move(source, 'moon', 1);
  source.aspects = [{ body1: 0, body2: 1, angle: 180, orb: 0, applying: true }];
  const result = interpretNatalChart(source, { orbs: { 0: 2 } });
  assert.equal(result.aspects.find(aspect => aspect.first === 'sun' && aspect.second === 'moon')?.angle, 0);
  assert.equal(result.aspects.find(aspect => aspect.first === 'sun' && aspect.second === 'moon')?.orb, 2);
  assert.ok(!interpretNatalChart(source, { orbs: { 0: 1.999 } }).aspects.some(aspect => aspect.first === 'sun' && aspect.second === 'moon'));
  move(source, 'sun', 0); move(source, 'moon', 30);
  const exact = interpretNatalChart(source, { orbs: { 30: 0 } }).aspects.find(aspect => aspect.first === 'sun' && aspect.second === 'moon')!;
  assert.equal(exact.angle, 30); assert.equal(exact.orb, 0); assert.equal(exact.relativeOrb, 0);
  move(source, 'moon', 40);
  assert.equal(interpretNatalChart(source, { orbs: { 30: 12, 45: 12 } }).aspects.find(aspect => aspect.first === 'sun' && aspect.second === 'moon')!.angle, 45);
  move(source, 'moon', 37.5);
  assert.equal(interpretNatalChart(source, { orbs: { 30: 12, 45: 12 } }).aspects.find(aspect => aspect.first === 'sun' && aspect.second === 'moon')!.angle, 30);
  assert.deepEqual(normalizeNatalOptions().orbs, DEFAULT_NATAL_ORBS);
  for (const value of [-1, NaN, Infinity, 12.0001]) assert.throws(() => normalizeNatalOptions({ orbs: { 90: value } }));
  assert.throws(() => normalizeNatalOptions({ orbs: { 15: 2 } } as never));
  assert.throws(() => normalizeNatalOptions({ includeMinorAspects: 1 } as never));
  assert.throws(() => normalizeNatalOptions({ extra: true } as never));
  assert.throws(() => { (DEFAULT_NATAL_ORBS as Record<string, number>)['90'] = 12; });
  assert.equal(normalizeNatalOptions().orbs[90], 6);
});

test('node axis uses the actual opposite longitude and actual half-open house cusps', () => {
  const source = chart();
  source.houses!.cusps = [0, 0, 1, 2, 20, 40, 60, 180, 181, 182, 200, 220, 240] as HouseCusps;
  source.houses!.ascendant = 0;
  source.houses!.midheaven = 200;
  for (const body of source.bodies) move(source, body.key, body.longitude);
  move(source, 'trueNode', 0);
  const report = interpretNatalChart(source);
  const reading = report.readings.find(reading => reading.kind === 'nodeSign')!;
  assert.equal(reading.evidence.southNodeLongitude, 180);
  assert.equal(reading.evidence.southNodeSign, 6);
  assert.equal(reading.evidence.house, 1);
  assert.equal(reading.evidence.southNodeHouse, 7);
  move(source, 'sun', 1);
  assert.equal(interpretNatalChart(source).chart.bodies[0].house, 2);
  const noNode = chart(); noNode.bodies = noNode.bodies.filter(body => body.key !== 'trueNode');
  const partial = interpretNatalChart(noNode);
  assert.equal(partial.coverage.nodesIncluded, false);
  assert.ok(partial.readings.every(reading => !['nodeSign', 'nodeHouse'].includes(reading.kind)));
  const chiron = { ...source.bodies[0], id: 15, key: 'chiron' as const };
  source.bodies.push(chiron);
  const unsupported = interpretNatalChart(source);
  assert.deepEqual(unsupported.coverage.unsupportedBodies, ['chiron']);
  assert.ok(!unsupported.readings.some(reading => (reading.evidence.points as string[]).includes('chiron')));
});

test('precomputed chart validation rejects incomplete, malformed or inconsistent facts', () => {
  const invalidCharts: ((chart: ChartData) => void)[] = [
    chart => { chart.kind = 'planetary'; },
    chart => { chart.bodies.pop(); chart.bodies.pop(); },
    chart => { chart.bodies.push({ ...chart.bodies[0] }); },
    chart => { chart.bodies[0].id = 1; },
    chart => { chart.bodies[0].longitude = 360; },
    chart => { chart.bodies[0].longitude = NaN; },
    chart => { chart.bodies[0].latitude = Infinity; },
    chart => { chart.bodies[0].distance = -1; },
    chart => { chart.bodies[0].speedLongitude = NaN; },
    chart => { chart.bodies[0].retrograde = true; },
    chart => { chart.bodies[0].sign = 1; },
    chart => { chart.bodies[0].degreeInSign += 1; },
    chart => { move(chart, 'sun', 0); chart.bodies[0].degreeInSign = -1e-8; },
    chart => { move(chart, 'sun', 29.99999999); chart.bodies[0].degreeInSign = 30; },
    chart => { chart.bodies[0].house = 1; },
    chart => { delete chart.houses; },
    chart => { delete chart.location; },
    chart => { chart.location!.latitude = 91; },
    chart => { chart.houses!.ascendant = -1; },
    chart => { chart.houses!.cusps[0] = 1; },
    chart => { Reflect.deleteProperty(chart.houses!.cusps, '6'); },
    chart => { chart.houses!.ascendant += 1; },
    chart => { chart.houses!.midheaven += 1; },
    chart => { chart.houses!.system = 'E'; },
    chart => { chart.houses!.system = 'W'; },
    chart => { chart.houses!.cusps[4] = chart.houses!.cusps[3]; },
    chart => { chart.houses!.cusps[7] += 1; },
    chart => { [chart.houses!.cusps[2], chart.houses!.cusps[3]] = [chart.houses!.cusps[3], chart.houses!.cusps[2]]; },
    chart => { chart.julianDay += 1; },
    chart => { chart.instant = '1972-02-30T04:00:00Z'; },
    chart => { chart.instant = '1929-12-31T23:59:59Z'; },
    chart => { chart.timeZone = 'Unknown/Zone'; },
    chart => { (chart.bodies[0] as unknown as { key: string }).key = 'unknown'; },
  ];
  for (const mutate of invalidCharts) { const source = chart(); mutate(source); assert.throws(() => interpretNatalChart(source), RangeError, String(mutate)); }
  assert.throws(() => interpretNatalChart(chart(), { name: 1 } as never), RangeError);
});

test('precomputed input order and untrusted derived metadata cannot contaminate the canonical report', () => {
  const source = chart(), expected = interpretNatalChart(source);
  source.bodies.reverse();
  source.elements.fire = NaN;
  source.displayDateTime = '<script>not a date</script>';
  source.aspects = [];
  Object.assign(source, { extra: '<script>extra</script>' });
  Object.assign(source.bodies[0], { extra: '<script>body</script>' });
  Object.assign(source.houses!, { extra: '<script>house</script>' });
  Object.assign(source.location!, { extra: '<script>location</script>' });
  const snapshot = structuredClone(source), result = interpretNatalChart(source);
  assert.deepEqual(result, expected);
  result.chart.bodies[0].longitude = -1;
  assert.deepEqual(source, snapshot);
});

test('catalog offers every canonical combination and source arrays remain isolated', () => {
  const catalog = getNatalCatalog(), info = getNatalCatalogInfo();
  assert.equal(catalog.length, 971);
  assert.equal(info.resolvedEntryCount, 971);
  assert.equal(info.editorialEntryCount, 380);
  assert.equal(info.categories.aspectPairs, 75);
  assert.equal(info.categories.aspectAngles, NATAL_ASPECT_ANGLES.length);
  assert.equal(new Set(catalog.map(entry => entry.key)).size, 971);
  for (const entry of catalog) {
    assert.ok(entry.personal.length && entry.professional.length);
    assert.ok(entry.personal.every(text => text.length > 40));
    assert.ok(entry.professional.every(text => text.length > 40));
    assert.ok(!entry.personal.concat(entry.professional).some(text => /\{(?:first|second)\}/u.test(text)));
  }
  const entry = resolveNatalInterpretation('sign:sun:0'), original = structuredClone(entry);
  entry.personal.push('mutation'); entry.sourceKeys.push('mutation');
  assert.deepEqual(resolveNatalInterpretation('sign:sun:0'), original);
  for (const key of ['sign:sun:00', 'sign:sun:0:extra', 'aspect:moon:sun:0', 'aspect:ascendant:midheaven:0', 'retrograde:trueNode']) assert.throws(() => resolveNatalInterpretation(key));
});

test('rendering escapes user names while preserving the canonical name in JSON', () => {
  const generator = createNatalReportGenerator(celestial);
  const request = { ...input, name: '<script>alert("x")</script> **nome**' };
  const report = generator.report(request);
  assert.equal(JSON.parse(generator.reportJSON(request)).name, request.name);
  const html = generator.reportHTML(request);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  const markdown = generator.reportMarkdown(request);
  assert.ok(!markdown.includes('<script>'));
  assert.equal(report.name, request.name);
});
