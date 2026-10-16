import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { Worker } from 'node:worker_threads';
import { createCitySearchClient, resolveBirthTime } from 'celestial-wasm/locations';
import type { BirthTimeInput, BirthTimeResult, City } from 'celestial-wasm/locations';

test('compiled package supports search, explicit selection and UTC conversion without WASM', async () => {
  const first = { id: 3448439, name: 'São Paulo', latitude: -23.5475,
    longitude: -46.63611, timezone: 'America/Sao_Paulo', country: 'Brasil' };
  const selected = { id: 3450376, name: 'Santa Maria', latitude: -29.68417,
    longitude: -53.80694, timezone: 'America/Sao_Paulo', country: 'Brasil' };
  const client = createCitySearchClient({ fetch: async url => Response.json(
    url.pathname.endsWith('/search') ? { results: [first, selected] } : selected,
  ) });
  const choices: City[] = await client.search('San');
  const location = await client.get(choices[1]!.id);
  assert.equal(location.name, 'Santa Maria');
  const input: BirthTimeInput = { date: '1990-01-15', time: '10:30', location };
  const result: BirthTimeResult = resolveBirthTime(input);
  assert.equal(result.instant, '1990-01-15T12:30:00.000Z');
  assert.equal(result.location.latitude, selected.latitude);
  assert.equal(result.location.longitude, selected.longitude);
  assert.equal(result.utcOffsetSeconds, -7200);
});

test('compiled module runs in a worker without Intl time-zone support', async () => {
  const moduleUrl = new URL('../../pkg/locations/index.js', import.meta.url).href;
  const worker = new Worker(`
    const { parentPort } = require('node:worker_threads');
    globalThis.Intl = undefined;
    import(${JSON.stringify(moduleUrl)}).then(({ resolveBirthTime }) => {
      parentPort.postMessage(resolveBirthTime({ date: '1930-01-01', time: '12:00',
        location: { latitude: 52.37, longitude: 4.89, timeZone: 'Europe/Amsterdam' } }));
    });
  `, { eval: true });
  try {
    const [result] = await once(worker, 'message');
    assert.equal(result.instant, '1930-01-01T11:40:28.000Z');
  } finally {
    await worker.terminate();
  }
});
