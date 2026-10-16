import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { BirthTimeError, BIRTH_DATE_RANGE, resolveBirthTime } from '../src/birth-time.ts';

const saoPaulo = { latitude: -23.55052, longitude: -46.633308,
  timeZone: 'America/Sao_Paulo', label: 'São Paulo, Brasil' };
const point = (timeZone: string) => ({ latitude: 0, longitude: 0, timeZone });
const input = (date = '2000-01-01', time = '12:00', timeZone = 'UTC') =>
  ({ date, time, location: point(timeZone) });

function errorFor(value: unknown, code: string): BirthTimeError {
  let captured: unknown;
  try {
    Reflect.apply(resolveBirthTime, undefined, [value]);
  } catch (error) {
    captured = error;
  }
  assert.ok(captured instanceof BirthTimeError, `Expected BirthTimeError ${code}`);
  assert.equal(captured.code, code);
  assert.equal(captured.name, 'BirthTimeError');
  assert.ok(captured.message.length > 0);
  return captured;
}

// Expected instants are fixed fixtures from IANA rules, independent of the
// host's Intl database. In particular Amsterdam needs the backzone history.
const uniqueFixtures: Array<[string, string, string, string, number]> = [
  ['America/Sao_Paulo', '1931-10-03', '10:30', '1931-10-03T13:30:00.000Z', -10800],
  ['America/Sao_Paulo', '1931-10-03', '12:30', '1931-10-03T14:30:00.000Z', -7200],
  ['America/Sao_Paulo', '2018-11-04', '01:30', '2018-11-04T03:30:00.000Z', -7200],
  ['America/Sao_Paulo', '2019-11-03', '00:30', '2019-11-03T03:30:00.000Z', -10800],
  ['America/Sao_Paulo', '2040-01-01', '12:00', '2040-01-01T15:00:00.000Z', -10800],
  ['Europe/Amsterdam', '1930-01-01', '12:00', '1930-01-01T11:40:28.000Z', 1172],
  ['Europe/Amsterdam', '1930-07-01', '12:00', '1930-07-01T10:40:28.000Z', 4772],
  ['Asia/Kathmandu', '2024-02-29', '05:45:00.125', '2024-02-29T00:00:00.125Z', 20700],
  ['Asia/Kolkata', '2000-01-01', '05:30', '2000-01-01T00:00:00.000Z', 19800],
  ['Pacific/Chatham', '2024-07-01', '12:45', '2024-07-01T00:00:00.000Z', 45900],
  ['Australia/Lord_Howe', '2024-10-06', '02:30', '2024-10-05T15:30:00.000Z', 39600],
  ['Pacific/Apia', '2011-12-29', '12:00', '2011-12-29T22:00:00.000Z', -36000],
  ['Pacific/Apia', '2011-12-31', '12:00', '2011-12-30T22:00:00.000Z', 50400],
  ['America/New_York', '2040-07-01', '12:00', '2040-07-01T16:00:00.000Z', -14400],
];

for (const [timeZone, date, time, instant, offset] of uniqueFixtures) {
  test(`${timeZone} ${date} ${time} resolves with its historical or projected offset`, () => {
    const result = resolveBirthTime(input(date, time, timeZone));
    assert.equal(result.instant, instant);
    assert.equal(result.timestamp, Date.parse(instant));
    assert.equal(result.utcOffsetSeconds, offset);
    assert.equal(result.timeZone, timeZone);
    assert.equal(result.resolution, 'unique');
    assert.match(result.tzdbVersion, /^\d{4}[a-z]+$/);
  });
}

test('result preserves a cloned location and normalizes seconds and milliseconds', () => {
  const original = { date: '2000-01-01', time: '09:05:07.1', location: { ...saoPaulo } };
  const before = structuredClone(original);
  const result = resolveBirthTime(original);
  assert.deepEqual(original, before);
  assert.notEqual(result.location, original.location);
  assert.deepEqual(result.location, original.location);
  assert.equal(result.localDateTime, '2000-01-01T09:05:07.100');
  original.location.label = 'changed';
  original.location.latitude = 0;
  assert.equal(result.location.label, saoPaulo.label);
  assert.equal(result.location.latitude, saoPaulo.latitude);
  assert.equal(resolveBirthTime(input('2000-01-01', '09:05')).localDateTime,
    '2000-01-01T09:05:00.000');
  assert.equal(resolveBirthTime(input('2000-01-01', '09:05:07.12')).localDateTime,
    '2000-01-01T09:05:07.120');
});

const folds: Array<[string, string, string, string, number, string, number]> = [
  ['America/New_York', '2024-11-03', '01:30',
    '2024-11-03T05:30:00.000Z', -14400, '2024-11-03T06:30:00.000Z', -18000],
  ['America/Sao_Paulo', '2019-02-16', '23:30',
    '2019-02-17T01:30:00.000Z', -7200, '2019-02-17T02:30:00.000Z', -10800],
  ['Australia/Lord_Howe', '2024-04-07', '01:45',
    '2024-04-06T14:45:00.000Z', 39600, '2024-04-06T15:15:00.000Z', 37800],
];

for (const [zone, date, time, early, earlyOffset, late, lateOffset] of folds) {
  test(`${zone} ${date} ${time} rejects ambiguity by default and exposes chronological candidates`, () => {
    const value = input(date, time, zone);
    const expected = [
      { instant: early, timestamp: Date.parse(early), utcOffsetSeconds: earlyOffset },
      { instant: late, timestamp: Date.parse(late), utcOffsetSeconds: lateOffset },
    ];
    assert.deepEqual(errorFor(value, 'ambiguous_time').candidates, expected);
    assert.deepEqual(errorFor({ ...value, disambiguation: 'reject' }, 'ambiguous_time').candidates, expected);
    for (const [disambiguation, candidate] of [['earlier', expected[0]], ['later', expected[1]]] as const) {
      const result = resolveBirthTime({ ...value, disambiguation });
      assert.equal(result.instant, candidate!.instant);
      assert.equal(result.timestamp, candidate!.timestamp);
      assert.equal(result.utcOffsetSeconds, candidate!.utcOffsetSeconds);
      assert.equal(result.localDateTime, `${date}T${time}:00.000`);
      assert.equal(result.resolution, disambiguation);
    }
  });
}

const gaps = [
  ['America/Sao_Paulo', '1931-10-03', '11:30'],
  ['America/Sao_Paulo', '2018-11-04', '00:30'],
  ['America/New_York', '2024-03-10', '02:30'],
  ['Australia/Lord_Howe', '2024-10-06', '02:15'],
  ['Pacific/Apia', '2011-12-30', '12:00'],
] as const;
for (const [zone, date, time] of gaps) {
  test(`${zone} ${date} ${time} rejects nonexistent birth times for every disambiguation`, () => {
    for (const disambiguation of [undefined, 'reject', 'earlier', 'later'] as const) {
      assert.deepEqual(errorFor({ ...input(date, time, zone), disambiguation }, 'nonexistent_time').candidates, []);
    }
  });
}

test('disambiguation options preserve unique instants and their unique resolution', () => {
  const expected = resolveBirthTime(input());
  for (const disambiguation of ['reject', 'earlier', 'later'] as const) {
    assert.deepEqual(resolveBirthTime({ ...input(), disambiguation }), expected);
  }
});

test('transition interval boundaries retain their exact millisecond semantics', () => {
  assert.equal(resolveBirthTime(input('2024-03-10', '01:59:59.999', 'America/New_York')).instant,
    '2024-03-10T06:59:59.999Z');
  assert.deepEqual(errorFor(input('2024-03-10', '02:00', 'America/New_York'),
    'nonexistent_time').candidates, []);
  assert.deepEqual(errorFor(input('2024-03-10', '02:59:59.999', 'America/New_York'),
    'nonexistent_time').candidates, []);
  assert.equal(resolveBirthTime(input('2024-03-10', '03:00', 'America/New_York')).instant,
    '2024-03-10T07:00:00.000Z');
  assert.equal(resolveBirthTime(input('2024-04-07', '01:29:59.999', 'Australia/Lord_Howe')).resolution,
    'unique');
  assert.equal(errorFor(input('2024-04-07', '01:30', 'Australia/Lord_Howe'),
    'ambiguous_time').candidates.length, 2);
  assert.equal(resolveBirthTime(input('2024-04-07', '02:00', 'Australia/Lord_Howe')).instant,
    '2024-04-06T15:30:00.000Z');
});

test('inclusive date limits apply to local dates even when UTC crosses a year boundary', () => {
  assert.deepEqual(BIRTH_DATE_RANGE, { start: '1930-01-01', end: '2040-12-31' });
  assert.equal(resolveBirthTime(input('1930-01-01', '00:00', 'Asia/Tokyo')).instant,
    '1929-12-31T15:00:00.000Z');
  assert.equal(resolveBirthTime(input('2040-12-31', '23:59:59.999', 'Pacific/Honolulu')).instant,
    '2041-01-01T09:59:59.999Z');
  for (const date of ['1929-12-31', '1900-02-28', '2041-01-01']) {
    assert.deepEqual(errorFor(input(date), 'out_of_range').candidates, []);
  }
});

test('Gregorian leap days are accepted in 1932, 2000 and 2040', () => {
  for (const year of [1932, 2000, 2040]) {
    assert.equal(resolveBirthTime(input(`${year}-02-29`, '23:59:59.999')).instant,
      `${year}-02-29T23:59:59.999Z`);
  }
});

const invalid: Array<[string, unknown]> = [
  ...[null, undefined, false, 0, '', [], () => ({})].map(value => ['invalid_input', value] as [string, unknown]),
  ...['1900-02-29', '1930-02-29', '2001-02-29', '2040-04-31', '2040-00-01', '2040-13-01',
    '2040-01-00', '2040-01-32', '40-01-01', '2040-1-01', '2040-01-1', ' 2040-01-01',
    '2040-01-01T00:00:00Z', '', null, 20000101].map(date => ['invalid_date', { ...input(), date }] as [string, unknown]),
  ...['24:00', '12:60', '12:00:60', '1:00', '12:0', '12:00:0', '12:00.1', '12:00:00.',
    '12:00:00.1234', '12:00Z', '12:00+01:00', ' 12:00', '', null, 1200].map(time =>
    ['invalid_time', { ...input(), time }] as [string, unknown]),
  ...[undefined, null, [], 'UTC', { latitude: 0, longitude: 0 },
    { latitude: '0', longitude: 0, timeZone: 'UTC' }, { latitude: 0, longitude: '0', timeZone: 'UTC' },
    { latitude: NaN, longitude: 0, timeZone: 'UTC' }, { latitude: 0, longitude: Infinity, timeZone: 'UTC' },
    { latitude: -90.001, longitude: 0, timeZone: 'UTC' }, { latitude: 90.001, longitude: 0, timeZone: 'UTC' },
    { latitude: 0, longitude: -180.001, timeZone: 'UTC' }, { latitude: 0, longitude: 180.001, timeZone: 'UTC' },
    { latitude: 0, longitude: 0, timeZone: 0 }, { latitude: 0, longitude: 0, timeZone: '' },
    { latitude: 0, longitude: 0, timeZone: 'UTC', label: 0 }].map(location =>
    ['invalid_location', { ...input(), location }] as [string, unknown]),
  ...['Mars/Olympus', 'America/No_Such_City', 'toString', '__proto__'].map(zone =>
    ['unknown_time_zone', input(undefined, undefined, zone)] as [string, unknown]),
  ...['compatible', 'EARLIER', '', null, true, 0].map(disambiguation =>
    ['invalid_disambiguation', { ...input(), disambiguation }] as [string, unknown]),
];
for (const [index, [code, value]] of invalid.entries()) {
  test(`runtime validation rejects ${code}, case ${index}, without coercion`, () => {
    assert.deepEqual(errorFor(value, code).candidates, []);
  });
}

test('finite coordinate boundaries are accepted without mutating them', () => {
  for (const [latitude, longitude] of [[-90, -180], [90, 180]]) {
    const location = { latitude: latitude!, longitude: longitude!, timeZone: 'UTC' };
    assert.deepEqual(resolveBirthTime({ ...input(), location }).location, location);
  }
});

test('birth-time conversion is independent of the process TZ setting', () => {
  const source = new URL('../src/birth-time.ts', import.meta.url).href;
  const script = `import { resolveBirthTime } from ${JSON.stringify(source)};
    console.log(JSON.stringify([
      resolveBirthTime(${JSON.stringify(input('1930-01-01', '12:00', 'Europe/Amsterdam'))}),
      resolveBirthTime(${JSON.stringify({ ...input('2024-11-03', '01:30', 'America/New_York'), disambiguation: 'later' })})
    ]));`;
  const outputs = ['UTC', 'America/Los_Angeles', 'Asia/Tokyo'].map(TZ => {
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8', env: { ...process.env, TZ },
    });
    assert.ifError(child.error);
    assert.equal(child.status, 0, child.stderr);
    return JSON.parse(child.stdout);
  });
  assert.deepEqual(outputs[1], outputs[0]);
  assert.deepEqual(outputs[2], outputs[0]);
  assert.equal(outputs[0][0].instant, '1930-01-01T11:40:28.000Z');
  assert.equal(outputs[0][1].instant, '2024-11-03T06:30:00.000Z');
});
