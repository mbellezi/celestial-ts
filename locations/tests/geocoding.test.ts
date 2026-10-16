import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CitySearchError, createCitySearchClient } from '../src/geocoding.ts';
import type { CitySearchErrorCode, CitySearchFetch } from '../src/geocoding.ts';

const saoPaulo = {
  id: 3448439,
  name: 'São Paulo',
  latitude: -23.547512345678,
  longitude: -46.636112345678,
  timezone: 'America/Sao_Paulo',
  country_code: 'BR',
  country: 'Brasil',
  admin1: 'São Paulo',
  admin2: 'São Paulo',
  elevation: 769,
  population: 12400000,
  postcodes: ['01000-000'],
};

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status });
}

function hasCode(code: CitySearchErrorCode, status?: number): (error: unknown) => boolean {
  return error => error instanceof CitySearchError && error.code === code && (status === undefined || error.status === status);
}

test('partial search returns all homonyms, Portuguese defaults, labels and full precision', async () => {
  let requested: URL | undefined;
  const client = createCitySearchClient({ fetch: async url => {
    requested = url;
    return json({ results: [saoPaulo, { ...saoPaulo, id: 123, admin1: 'Rio Grande do Sul', admin2: 'Outra região' }] });
  } });
  const cities = await client.search('  São Pau  ');
  assert.equal(requested?.origin, 'https://geocoding-api.open-meteo.com');
  assert.equal(requested?.pathname, '/v1/search');
  assert.equal(requested?.searchParams.get('name'), 'São Pau');
  assert.equal(requested?.searchParams.get('language'), 'pt');
  assert.equal(requested?.searchParams.get('count'), '10');
  assert.equal(requested?.searchParams.get('format'), 'json');
  assert.equal(requested?.searchParams.has('countryCode'), false);
  assert.equal(cities.length, 2);
  assert.equal(cities[0]?.latitude, saoPaulo.latitude);
  assert.equal(cities[0]?.longitude, saoPaulo.longitude);
  assert.equal(cities[0]?.timeZone, 'America/Sao_Paulo');
  assert.equal(cities[0]?.label, 'São Paulo, Brasil');
  assert.equal(cities[1]?.label, 'São Paulo, Outra região, Rio Grande do Sul, Brasil');
  assert.deepEqual(cities[0]?.postcodes, ['01000-000']);
});

test('short names return no candidates and do not call fetch, including qualified short names', async () => {
  const client = createCitySearchClient({ fetch: async () => { assert.fail('fetch must not be called'); } });
  for (const query of ['', '  ', 'a', 'a, Brasil']) assert.deepEqual(await client.search(query), []);
});

test('two-character names request the exact matches supported by Open-Meteo', async () => {
  const client = createCitySearchClient({ fetch: async url => {
    assert.equal(url.searchParams.get('name'), 'Eu, France');
    return json({ results: [{ ...saoPaulo, id: 3019317, name: 'Eu', timezone: 'Europe/Paris', country_code: 'FR', country: 'França' }] });
  } });
  const cities = await client.search('Eu, France');
  assert.equal(cities.length, 1);
  assert.equal(cities[0]?.name, 'Eu');
});

test('time zone validation uses bundled data without consulting Intl', async context => {
  context.mock.method(Intl, 'DateTimeFormat', () => { throw new Error('Host Intl unavailable'); });
  const client = createCitySearchClient({ fetch: async () => json({ results: [saoPaulo] }) });
  const cities = await client.search('São');
  assert.equal(cities[0]?.timeZone, saoPaulo.timezone);
});

test('commercial endpoint, API key, country filter, overrides and AbortSignal are forwarded', async () => {
  const controller = new AbortController();
  const client = createCitySearchClient({
    endpoint: 'https://customer-geocoding-api.open-meteo.com/v1',
    apiKey: 'secret&key', language: 'EN', count: 5,
    fetch: async (url, init) => {
      assert.equal(url.origin, 'https://customer-geocoding-api.open-meteo.com');
      assert.equal(url.pathname, '/v1/search');
      assert.equal(url.searchParams.get('apikey'), 'secret&key');
      assert.equal(url.searchParams.get('countryCode'), 'PT');
      assert.equal(url.searchParams.get('language'), 'pt');
      assert.equal(url.searchParams.get('count'), '20');
      assert.equal(init?.signal, controller.signal);
      return json({ results: [] });
    },
  });
  assert.deepEqual(await client.search('Lis', { countryCode: 'pt', language: 'PT', count: 20, signal: controller.signal }), []);
});

test('selection fetches the requested ID, returns a normalized city, and needs no administrative fields', async () => {
  const client = createCitySearchClient({ language: 'en', fetch: async url => {
    assert.equal(url.pathname, '/v1/get');
    assert.equal(url.searchParams.get('id'), '3448439');
    assert.equal(url.searchParams.get('language'), 'pt');
    return json({ id: saoPaulo.id, name: saoPaulo.name, latitude: saoPaulo.latitude, longitude: saoPaulo.longitude, timezone: saoPaulo.timezone });
  } });
  assert.deepEqual(await client.get(saoPaulo.id, { language: 'pt' }), {
    id: saoPaulo.id, name: saoPaulo.name, latitude: saoPaulo.latitude,
    longitude: saoPaulo.longitude, timeZone: saoPaulo.timezone, label: saoPaulo.name,
  });
});

test('missing and empty result arrays represent no matches', async () => {
  for (const payload of [{ generationtime_ms: 0.2 }, {}, { results: [] }]) {
    const client = createCitySearchClient({ fetch: async () => json(payload) });
    assert.deepEqual(await client.search('unknown'), []);
  }
});

test('not found is distinct from HTTP and API failures', async () => {
  for (const [status, payload, code] of [
    [400, { error: true, reason: 'Location ID not found.' }, 'not_found'],
    [404, { error: true }, 'not_found'],
    [400, { error: true, reason: 'Invalid parameter' }, 'http'],
    [429, { error: true }, 'http'],
    [200, { error: true, reason: 'Unexpected error' }, 'api'],
  ] as const) {
    const client = createCitySearchClient({ fetch: async () => json(payload, status) });
    await assert.rejects(client.get(123), hasCode(code, status));
  }
  const client = createCitySearchClient({ fetch: async () => new Response('unavailable', { status: 503 }) });
  await assert.rejects(client.search('São'), hasCode('http', 503));
});

test('malformed JSON, DTOs and mismatched selection IDs fail explicitly', async () => {
  const malformed = createCitySearchClient({ fetch: async () => new Response('not JSON') });
  await assert.rejects(malformed.search('São'), hasCode('invalid_response'));
  for (const payload of [null, [], { results: null }, { results: {} }, { results: [null] },
    { results: [{ ...saoPaulo, latitude: 91 }] }, { results: [{ ...saoPaulo, longitude: '0' }] },
    { results: [{ ...saoPaulo, timezone: '' }] }, { results: [{ ...saoPaulo, timezone: 'Mars/Olympus' }] },
    { results: [{ ...saoPaulo, id: 1.5 }] },
    { results: [{ ...saoPaulo, population: -1 }] }, { results: [{ ...saoPaulo, admin1: 12 }] },
    { results: [{ ...saoPaulo, postcodes: [12] }] }]) {
    const client = createCitySearchClient({ fetch: async () => json(payload) });
    await assert.rejects(client.search('São'), hasCode('invalid_response'));
  }
  const wrongId = createCitySearchClient({ fetch: async () => json(saoPaulo) });
  await assert.rejects(wrongId.get(123), hasCode('invalid_response'));
});

test('invalid inputs and client settings are rejected before network access', async () => {
  const fetch: CitySearchFetch = async () => { assert.fail('fetch must not be called'); };
  const client = createCitySearchClient({ fetch });
  assert.throws(() => createCitySearchClient(null as never), hasCode('invalid_input'));
  await assert.rejects(client.search('São', null as never), hasCode('invalid_input'));
  await assert.rejects(client.get(saoPaulo.id, null as never), hasCode('invalid_input'));
  for (const id of [0, -1, 0.5, NaN, Infinity, 2_147_483_648]) await assert.rejects(client.get(id), hasCode('invalid_input'));
  for (const count of [0, 101, 1.2, NaN]) await assert.rejects(client.search('São', { count }), hasCode('invalid_input'));
  await assert.rejects(client.search('São', { countryCode: 'Brasil' }), hasCode('invalid_input'));
  await assert.rejects(client.search('São', { language: '' }), hasCode('invalid_input'));
  for (const options of [{ count: 0 }, { language: '' }, { endpoint: '/v1' }, { endpoint: 'file:///tmp/' },
    { endpoint: 'https://example.com/v1/?apikey=secret' }, { apiKey: '' }]) {
    assert.throws(() => createCitySearchClient({ ...options, fetch }), hasCode('invalid_input'));
  }
});

test('network failures and cancellations have separate typed errors', async () => {
  const unavailable = createCitySearchClient({ fetch: async () => { throw new TypeError('Failed to fetch'); } });
  await assert.rejects(unavailable.search('São'), hasCode('network'));
  const controller = new AbortController();
  controller.abort();
  const client = createCitySearchClient({ fetch: async () => { assert.fail('fetch must not be called'); } });
  await assert.rejects(client.search('São', { signal: controller.signal }), hasCode('aborted'));
  const during = new AbortController();
  const aborting = createCitySearchClient({ fetch: async (_url, init) => {
    during.abort();
    throw init?.signal?.reason;
  } });
  await assert.rejects(aborting.get(123, { signal: during.signal }), hasCode('aborted'));
});
