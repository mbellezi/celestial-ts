import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resolveBirthTime } from '../../../pkg/locations/index.js';
import { formatUtcOffset, isReportDate, reportRange, todayInTimeZone } from '../calendar.js';

test('calendar preserves civil day/month limits, leap days and local time-zone boundaries', () => {
  assert.deepEqual(reportRange('month', '2028-02'), { start: '2028-02-01', end: '2028-02-29' });
  assert.deepEqual(reportRange('month', '2035-12'), { start: '2035-12-01', end: '2035-12-31' });
  assert.deepEqual(reportRange('day', '2026-01-01'), { start: '2026-01-01', end: '2026-01-01' });
  for (const value of ['2027-02-29', '2026-02-30', '2025-12-31', '2036-01-01', '2026-1-01']) {
    assert.equal(isReportDate('day', value), false, value);
    assert.throws(() => reportRange('day', value), RangeError);
  }
  assert.equal(todayInTimeZone('America/Sao_Paulo', '2028-02-01T01:00:00Z'), '2028-01-31');
  assert.equal(todayInTimeZone('Asia/Tokyo', '2028-01-31T23:00:00Z'), '2028-02-01');
  assert.equal(todayInTimeZone('UTC', '2020-01-01T00:00:00Z'), '2026-01-01');
  assert.equal(todayInTimeZone('UTC', '2040-01-01T00:00:00Z'), '2035-12-31');
  assert.equal(formatUtcOffset(-11188), 'UTC−03:06:28');
  assert.equal(formatUtcOffset(19800), 'UTC+05:30');
});

test('worker initializes real WASM, reports actual transfer progress and produces canonical output', async t => {
  const messages = [];
  let listener;
  const originalSelf = globalThis.self;
  const originalFetch = globalThis.fetch;
  const wasmUrl = new URL('../../../pkg/celestial_wasm_bg.wasm', import.meta.url);
  const bytes = await readFile(wasmUrl);
  globalThis.self = {
    addEventListener(type, handler) {
      assert.equal(type, 'message');
      listener = handler;
    },
    postMessage(message) { messages.push(message); },
  };
  globalThis.fetch = async url => {
    assert.equal(String(url), String(wasmUrl));
    return new Response(bytes, { headers: { 'Content-Length': String(bytes.length), 'Content-Type': 'application/wasm' } });
  };
  t.after(() => {
    globalThis.self = originalSelf;
    globalThis.fetch = originalFetch;
  });
  await import('../worker.js');
  async function send(id, type, input) {
    messages.length = 0;
    await listener({ data: { id, type, input } });
    assert.ok(messages.every(message => message.id === id));
    return messages.at(-1);
  }

  assert.equal((await send(1, 'init')).type, 'ready');
  const download = messages.filter(message => message.phase === 'loading' && message.total !== undefined).at(-1);
  assert.equal(download.loaded, bytes.length);
  assert.equal(download.total, bytes.length);
  assert.equal(download.percent, 100);

  const day = await send(2, 'astro', { kind: 'day', date: '2028-02-01', timeZone: 'Asia/Tokyo' });
  assert.equal(day.type, 'result');
  assert.equal(day.result.range.start, '2028-01-31T15:00:00.000Z');
  assert.equal(day.result.range.endExclusive, '2028-02-01T15:00:00.000Z');
  assert.equal(day.result.range.timeZone, 'Asia/Tokyo');
  assert.deepEqual(JSON.parse(day.result.json), day.result.report);
  for (const key of ['html', 'text', 'markdown']) assert.ok(day.result[key].length > 100, key);

  const month = await send(3, 'astro', { kind: 'month', date: '2028-02', timeZone: 'Asia/Tokyo' });
  assert.equal(month.type, 'result');
  assert.equal(month.result.range.start, '2028-01-31T15:00:00.000Z');
  assert.equal(month.result.range.endExclusive, '2028-02-29T15:00:00.000Z');

  const birth = resolveBirthTime({ date: '1994-04-15', time: '14:30', location: {
    latitude: -23.5505, longitude: -46.6333, timeZone: 'America/Sao_Paulo', label: 'Cidade de exemplo',
  } });
  const natal = await send(4, 'natal', { birth, name: 'Pessoa Exemplo', houseSystem: 'P' });
  assert.equal(natal.type, 'result');
  assert.equal(natal.result.chart.instant, birth.instant);
  assert.equal(natal.result.chart.bodies.length, 11);
  assert.deepEqual(JSON.parse(natal.result.json), natal.result.report);
  assert.equal(natal.result.report.scope, 'natal-psychological');
  for (const key of ['chart', 'wheel', 'tables', 'positions', 'houses', 'aspects', 'aspectList']) {
    assert.match(natal.result.svgs[key], /^<svg\b/, key);
  }
  assert.equal((await send(5, 'astro', { kind: 'day', date: '2027-02-29', timeZone: 'UTC' })).type, 'error');
  assert.equal((await send(6, 'natal', {})).type, 'error');
  assert.equal((await send(7, 'unknown')).type, 'error');

  await t.test('historical second-level offset preserves confirmed civil time in every output', async () => {
    const historicBirth = resolveBirthTime({ date: '1930-01-01', time: '12:00', location: {
      latitude: 52.37, longitude: 4.89, timeZone: 'Europe/Amsterdam', label: 'Cidade histórica de exemplo',
    } });
    assert.equal(historicBirth.instant, '1930-01-01T11:40:28.000Z');
    assert.equal(historicBirth.utcOffsetSeconds, 1172);
    const historic = await send(8, 'natal', { birth: historicBirth, houseSystem: 'P' });
    assert.equal(historic.type, 'result');
    assert.equal(historic.result.chart.instant, historicBirth.instant);
    assert.match(historic.result.chart.displayDateTime, /12:00:00/);
    assert.equal(historic.result.report.chart.displayDateTime, historic.result.chart.displayDateTime);
    assert.deepEqual(JSON.parse(historic.result.json), historic.result.report);
    for (const key of ['html', 'text', 'markdown']) assert.match(historic.result[key], /12:00:00/, key);
    for (const [key, svg] of Object.entries(historic.result.svgs)) {
      const visible = [...svg.matchAll(/<(?:text|desc)\b[^>]*>(.*?)<\/(?:text|desc)>/gs)].map(match => match[1]).join(' ');
      assert.match(visible, /12:00:00/, key);
      assert.doesNotMatch(visible, /11:40:28/, key);
    }
    assert.match(historic.result.svgs.chart, /1930-01-01T11:40:28\.000Z/, 'complete chart retains UTC metadata');
  });

  await t.test('repeated civil hour requires a choice and preserves distinct UTC occurrences', async () => {
    const input = { date: '2019-02-16', time: '23:30', location: {
      latitude: -23.5505, longitude: -46.6333, timeZone: 'America/Sao_Paulo', label: 'Cidade de exemplo',
    } };
    assert.throws(() => resolveBirthTime(input), error => error.code === 'ambiguous_time' && error.candidates.length === 2);
    const earlierBirth = resolveBirthTime({ ...input, disambiguation: 'earlier' });
    const laterBirth = resolveBirthTime({ ...input, disambiguation: 'later' });
    assert.equal(earlierBirth.instant, '2019-02-17T01:30:00.000Z');
    assert.equal(laterBirth.instant, '2019-02-17T02:30:00.000Z');
    assert.equal(earlierBirth.localDateTime, laterBirth.localDateTime);
    const earlier = await send(9, 'natal', { birth: earlierBirth });
    const later = await send(10, 'natal', { birth: laterBirth });
    assert.equal(earlier.type, 'result');
    assert.equal(later.type, 'result');
    assert.notEqual(earlier.result.chart.instant, later.result.chart.instant);
    assert.notEqual(earlier.result.chart.julianDay, later.result.chart.julianDay);
    assert.equal(earlier.result.chart.displayDateTime, later.result.chart.displayDateTime);
    for (const output of [earlier.result, later.result]) {
      assert.match(output.chart.displayDateTime, /23:30:00/);
      assert.equal(output.report.chart.displayDateTime, output.chart.displayDateTime);
      for (const key of ['html', 'text', 'markdown']) assert.match(output[key], /23:30:00/, key);
      for (const svg of Object.values(output.svgs)) assert.match(svg, /23:30:00/);
    }
  });

  await t.test('nonexistent civil hour is rejected for every disambiguation', () => {
    for (const disambiguation of ['reject', 'earlier', 'later']) {
      assert.throws(() => resolveBirthTime({ date: '2018-11-04', time: '00:30', disambiguation,
        location: { latitude: -23.5505, longitude: -46.6333, timeZone: 'America/Sao_Paulo' },
      }), error => error.code === 'nonexistent_time');
    }
  });

  await t.test('polar house calculation and unsupported natal dates return useful Portuguese errors', async () => {
    const polarBirth = resolveBirthTime({ date: '1994-04-15', time: '14:30', location: {
      latitude: 78.2, longitude: 15.65, timeZone: 'Arctic/Longyearbyen', label: 'Localidade polar de exemplo',
    } });
    const polar = await send(11, 'natal', { birth: polarBirth, houseSystem: 'P' });
    assert.equal(polar.type, 'error');
    assert.match(polar.message, /Casas iguais \(E\).*Signos inteiros \(W\)/);
    for (const houseSystem of ['E', 'W']) {
      assert.equal((await send(12, 'natal', { birth: polarBirth, houseSystem })).type, 'result');
    }
    for (const instant of ['1929-12-31T12:00:00.000Z', '2041-01-01T12:00:00.000Z']) {
      const invalid = await send(13, 'natal', { birth: { ...birth, instant } });
      assert.equal(invalid.type, 'error');
      assert.match(invalid.message, /fora do intervalo de 1930 a 2040/);
    }
  });
});
