import { Worker } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { celestial } from '../../wasm/tests/runtime.ts';
import { createReportGenerator, getCatalog, resolveInterpretation, REPORT_DOMAINS, REPORT_BODIES, DEFAULT_ORBS } from '../../pkg/reports/index.js';
import { normalizeRange } from '../src/range.ts';
import { LruCache } from '../src/cache.ts';

test('calendar boundaries respect timezone DST and inclusive end dates', () => {
  const range = normalizeRange({ start: '2026-03-29', end: '2026-03-29', timeZone: 'Europe/London' });
  assert.equal(range.endMs - range.startMs, 23 * 3_600_000);
  assert.equal(new Date(range.endMs).toISOString(), '2026-03-29T23:00:00.000Z');
  assert.doesNotThrow(() => normalizeRange({ start: '2035-12-31', end: '2035-12-31', timeZone: 'America/Sao_Paulo' }));
});
test('validation rejects malformed calendars, mixed boundaries and unsupported options', () => {
  for (const input of [
    { start: '2026-02-30', end: '2026-03-01' },
    { start: '2025-12-31', end: '2026-01-01' },
    { start: '2035-12-31', end: '2036-01-01' },
    { start: '2026-01-01', end: '2026-01-02T00:00:00Z' },
    { start: '2026-01-01', end: '2026-01-02', orbs: { 90: NaN } },
    { start: '2026-01-01', end: '2026-01-02', orbs: { 90: 0.0001 } },
    { start: '2026-01-01', end: '2026-01-02', bodies: ['sun', 'sun'] as const },
  ]) assert.throws(() => normalizeRange(input));
});
test('resolved catalog has 529 transparent combinations with all six domains', () => {
  const catalog = getCatalog();
  assert.equal(catalog.length, 529);
  assert.equal(new Set(catalog.map(record => record.key)).size, 529);
  for (const record of catalog) {
    assert.ok(record.sourceKeys.length >= 2);
    for (const domain of REPORT_DOMAINS) assert.ok(record[domain].length > 40, `${record.key}/${domain}`);
  }
});
test('report cache canonicalizes bodies and protects stored results from caller mutation', () => {
  const generator = createReportGenerator(celestial, { cacheSize: 2 });
  const request = { start: '2026-01-01', end: '2026-01-02', bodies: ['sun', 'moon'] as const };
  const original = generator.report(request);
  assert.ok(original.entries.length);
  const expected = JSON.stringify(original);
  original.interpretations[original.entries[0].interpretationKey].health = 'changed';
  original.entries[0].event.exact.push('changed');
  const again = generator.report({ ...request, bodies: ['moon', 'sun'] });
  assert.equal(JSON.stringify(again), expected);
  assert.equal(generator.cacheStats.reports.hits, 1);
  for (const domain of REPORT_DOMAINS) {
    assert.ok(again.summaries[domain].contributions.length <= again.entries.length);
    for (const contribution of again.summaries[domain].contributions) for (const eventId of contribution.eventIds) assert.ok(again.entries.some(entry => entry.event.id === eventId));
  }
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(again)));
  generator.clearCache();
  assert.equal(generator.cacheStats.reports.size, 0);
});
test('LRU evicts least recently accessed full keys', () => {
  const cache = new LruCache<number>(2);
  cache.set('a', 1); cache.set('b', 2); cache.get('a'); cache.set('c', 3);
  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.stats.size, 2);
});

test('JSON results are cached as strings and summaries contain editorial paragraphs', () => {
  const generator = createReportGenerator(celestial);
  const request = { start: '2026-01-01', end: '2026-01-02' };
  const json = generator.reportJSON(request);
  assert.equal(generator.reportJSON(request), json);
  assert.equal(generator.cacheStats.serialized.hits, 1);
  const report = JSON.parse(json);
  assert.notEqual(report.summaries.general.text, report.summaries.health.text);
  assert.ok(report.summaries.general.text.length > 100);
});

test('catalog memo remains isolated from caller edits and rejects noncanonical keys', () => {
  const entry = resolveInterpretation('sign:sun:0');
  const original = entry.general;
  entry.general = 'mutation'; entry.sourceKeys.push('mutation');
  assert.equal(resolveInterpretation('sign:sun:0').general, original);
  assert.equal(resolveInterpretation('sign:sun:0').sourceKeys.length, 2);
  assert.throws(() => resolveInterpretation('sign:sun:00'));
  assert.throws(() => resolveInterpretation('sign:sun:0:extra'));
});
test('weighted LRU bypasses oversized records and enforces budget', () => {
  const cache = new LruCache<number>(10, 5);
  cache.set('a', 1, 3); cache.set('b', 2, 3);
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.stats.bytes, 3);
  cache.set('large', 10, 6);
  assert.equal(cache.get('large'), undefined);
  assert.equal(cache.get('b'), 2);
});

test('compiled reports execute in an ESM worker with preloaded WASM bytes', async () => {
  const bytes = await readFile(new URL('../../pkg/celestial_wasm_bg.wasm', import.meta.url));
  const source = `import { parentPort, workerData } from 'node:worker_threads';
    const core = await import(workerData.core);
    const reports = await import(workerData.reports);
    await core.default({ module_or_path: workerData.bytes });
    const generator = reports.createReportGenerator(core);
    const report = generator.report({ start: '2026-02-01', end: '2026-02-28', bodies: ['sun'], orbs: { 90: 3 } });
    parentPort.postMessage({ count: report.entries.length, calculation: report.calculation, text: report.summaries.health.text });`;
  const worker = new Worker(new URL(`data:text/javascript,${encodeURIComponent(source)}`), {
    workerData: { bytes, core: new URL('../../pkg/celestial_wasm.js', import.meta.url).href, reports: new URL('../../pkg/reports/index.js', import.meta.url).href },
  });
  try {
    const result = await new Promise<{ count: number; calculation: { bodies: string[]; orbs: Record<string, number> }; text: string }>((resolve, reject) => {
      worker.once('message', resolve); worker.once('error', reject);
      worker.once('exit', code => { if (code !== 0) reject(new Error(`Worker exited ${code}`)); });
    });
    assert.ok(result.count > 0);
    assert.deepEqual(result.calculation.bodies, ['sun']);
    assert.equal(result.calculation.orbs['90'], 3);
    assert.ok(result.text.length > 100);
  } finally { await worker.terminate(); }
});

test('public defaults cannot be mutated to contaminate later reports', () => {
  assert.throws(() => { (DEFAULT_ORBS as Record<string, number>)['90'] = NaN; });
  assert.throws(() => { (REPORT_BODIES as unknown as string[]).splice(0, 1); });
  assert.equal(normalizeRange({ start: '2026-01-01', end: '2026-01-02' }).orbs[90], 6);
  assert.equal(REPORT_BODIES.length, 10);
});
