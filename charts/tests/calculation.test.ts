import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { celestial as api } from '../../wasm/tests/runtime.ts';
import { createChartCalculator, DEFAULT_BODIES } from '../src/calculate.ts';
import { resolveDateTime } from '../src/datetime.ts';
import { ChartError, getMessages } from '../src/locales.ts';
import type { ChartErrorCode } from '../src/locales.ts';
import type { DateTimeInput, NatalChartInput } from '../src/types.ts';

const calculator = createChartCalculator(api);
const instant = '2026-10-16T00:04:57Z';
const timeZone = 'America/Sao_Paulo';
const location = { label: 'São Paulo', latitude: -23.55052, longitude: -46.633308 };
const k = api.constants();

function hasCode(code: ChartErrorCode): (error: unknown) => boolean {
  return function check(error: unknown): boolean {
    return error instanceof ChartError && error.code === code;
  };
}

afterEach(() => {
  api.setSidMode(k.SIDM_FAGAN_BRADLEY);
  api.setTopo(0, 0, 0);
  api.setDeltaTUserdef(NaN);
});

test('the requested São Paulo instant uses real geocentric tropical positions and southern houses', () => {
  const reference = api.calcUt(2461329.5034375, k.SUN, k.FLG_BUILTIN | k.FLG_SPEED);
  const chart = calculator.natal({ instant, timeZone, location });
  assert.equal(chart.julianDay, 2461329.5034375);
  assert.equal(chart.instant, '2026-10-16T00:04:57.000Z');
  assert.equal(chart.timeZone, timeZone);
  assert.match(chart.displayDateTime, /21:04:57/);
  assert.deepEqual(chart.location, location);
  assert.deepEqual(chart.bodies.map(body => body.key), DEFAULT_BODIES);
  const expected = api.houses(chart.julianDay, location.latitude, location.longitude, 80);
  assert.deepEqual(chart.houses?.cusps, expected.cusps);
  assert.equal(chart.houses?.cusps.length, 13);
  assert.equal(chart.houses?.ascendant, expected.ascmc[0]);
  assert.equal(chart.houses?.midheaven, expected.ascmc[1]);
  assert.equal(chart.houses?.system, 'P');
  const sun = chart.bodies.find(body => body.key === 'sun')!;
  assert.equal(sun.sign, 6);
  assert.deepEqual([sun.longitude, sun.latitude, sun.distance, sun.speedLongitude],
    [reference.lon, reference.lat, reference.dist, reference.speedLon]);
  assert.equal(chart.bodies.find(body => body.key === 'venus')?.retrograde, true);
  assert.equal(chart.bodies.find(body => body.key === 'pluto')?.retrograde, false);
  assert.equal(Object.values(chart.elements).reduce((sum, count) => sum + count, 0), 10);
});

test('local São Paulo time, explicit offset and UTC identify the same chart', () => {
  const local = calculator.natal({ date: '2026-10-15', time: '21:04:57', timeZone, location });
  const utc = calculator.natal({ instant, timeZone, location });
  const offset = calculator.natal({ instant: '2026-10-15T21:04:57-03:00', timeZone, location });
  assert.deepEqual(local, utc);
  assert.deepEqual(offset, utc);
});

test('J2000 UTC is JD 2451545 and zodiac sign fields retain their angular units', () => {
  const chart = calculator.planetary({ instant: '2000-01-01T12:00:00Z' });
  assert.equal(chart.julianDay, 2451545);
  const sun = chart.bodies.find(body => body.key === 'sun')!;
  assert.equal(sun.sign, 9);
  assert.ok(sun.degreeInSign > 10 && sun.degreeInSign < 11);
  for (const body of chart.bodies) {
    assert.ok(body.longitude >= 0 && body.longitude < 360);
    assert.ok(body.degreeInSign >= 0 && body.degreeInSign < 30);
    assert.ok([body.latitude, body.distance, body.speedLongitude].every(Number.isFinite));
  }
});

test('planetary charts have no houses and geocentric positions do not depend on observer location', () => {
  const plain = calculator.planetary({ instant });
  const south = calculator.planetary({ instant, location });
  const north = calculator.planetary({ instant, location: { latitude: 51.5072, longitude: -0.1276 } });
  assert.equal(plain.kind, 'planetary');
  assert.equal(Object.hasOwn(plain, 'houses'), false);
  assert.equal(Object.hasOwn(south, 'houses'), false);
  assert.equal(Object.hasOwn(plain, 'location'), false);
  assert.ok(plain.bodies.every(body => !Object.hasOwn(body, 'house')));
  assert.deepEqual(south.bodies, plain.bodies);
  assert.deepEqual(north.bodies, plain.bodies);
  assert.deepEqual(south.aspects, plain.aspects);
});

test('equal houses assign real planets on both sides of the zero-degree wrap', () => {
  const chart = calculator.natal({ instant: '2000-01-01T12:00:00Z',
    location: { latitude: 0, longitude: -14 }, houseSystem: 'E' });
  assert.ok(chart.houses!.cusps[1] > 350);
  assert.ok(chart.houses!.cusps[2] < 30);
  assert.equal(chart.bodies.find(body => body.key === 'jupiter')?.house, 1);
  assert.equal(chart.bodies.find(body => body.key === 'mars')?.house, 12);
});

test('the core determines the sign after an Aries crossing without TypeScript ephemeris math', () => {
  const jd = api.solcrossUt(0, 2451545, k.FLG_BUILTIN) + 2 / 86400;
  const crossing = api.jdToIsoString(jd, 1).replace(' ', 'T').replace(' UTC', 'Z');
  const chart = calculator.planetary({ instant: crossing, bodies: ['sun'] });
  assert.equal(chart.bodies[0].sign, 0);
  assert.ok(chart.bodies[0].degreeInSign >= 0 && chart.bodies[0].degreeInSign < 0.01);
});

test('true node and Chiron are optional and the requested order is retained', () => {
  const chart = calculator.planetary({ instant, bodies: ['chiron', 'trueNode', 'sun'] });
  assert.deepEqual(chart.bodies.map(body => body.id), [k.CHIRON, k.TRUE_NODE, k.SUN]);
  assert.deepEqual(chart.bodies.map(body => body.key), ['chiron', 'trueNode', 'sun']);
  assert.equal(Object.values(chart.elements).reduce((sum, count) => sum + count, 0), 3);
});

test('aspects preserve the core endpoints, angles, orbs and applying state', () => {
  const chart = calculator.planetary({ instant });
  const packed = chart.bodies.flatMap(body => [body.id, body.longitude, body.speedLongitude]);
  const expected = api.calcChartAspectsAuto(packed, [0, 60, 90, 120, 180]);
  assert.ok(expected.some(row => row[4] === 1));
  assert.deepEqual(chart.aspects.map(aspect => [aspect.body1, aspect.body2, aspect.angle,
    aspect.orb, Number(aspect.applying)]), expected);
});

test('automatic delta-T and explicit flags prevent inherited engine configuration from changing charts', () => {
  const baseline = calculator.planetary({ instant });
  api.setSidMode(k.SIDM_LAHIRI);
  api.setTopo(139.69, 35.69, 40);
  const sidereal = api.ayanamsa(baseline.julianDay);
  const topo = api.calcUt(baseline.julianDay, k.MOON, k.FLG_BUILTIN | k.FLG_TOPOCTR);
  api.setDeltaTUserdef(86400);
  assert.deepEqual(calculator.planetary({ instant }), baseline);
  assert.equal(api.ayanamsa(baseline.julianDay), sidereal);
  assert.deepEqual(api.calcUt(baseline.julianDay, k.MOON, k.FLG_BUILTIN | k.FLG_TOPOCTR), topo);
  assert.notEqual(api.deltatEx(baseline.julianDay, 0), 86400);
});

test('local leap dates, milliseconds and quarter-hour offsets resolve exactly', () => {
  assert.equal(resolveDateTime({ date: '2024-02-29', time: '05:45:00.125',
    timeZone: 'Asia/Kathmandu' }).instant, '2024-02-29T00:00:00.125Z');
  assert.equal(resolveDateTime({ instant: '0001-01-01T00:00:00Z' }).instant,
    '0001-01-01T00:00:00.000Z');
  assert.equal(resolveDateTime({ instant: '9999-12-31T23:59:59Z' }).instant,
    '9999-12-31T23:59:59.000Z');
});

const invalidDateTimes: Array<{ input: DateTimeInput; code: ChartErrorCode }> = [
  { input: { instant: '2026-10-15T21:04:57' }, code: 'invalidInstant' },
  { input: { instant: '2023-02-29T12:00:00Z' }, code: 'invalidInstant' },
  { input: { instant: '2024-01-01T12:00:00+24:00' }, code: 'invalidInstant' },
  { input: { date: '2023-02-29', time: '12:00', timeZone: 'UTC' }, code: 'invalidDate' },
  { input: { date: '2024-13-01', time: '12:00', timeZone: 'UTC' }, code: 'invalidDate' },
  { input: { date: '2024-01-01', time: '24:00', timeZone: 'UTC' }, code: 'invalidTime' },
  { input: { date: '2024-01-01', time: '12:60:00', timeZone: 'UTC' }, code: 'invalidTime' },
  { input: { instant, timeZone: 'Mars/Olympus' }, code: 'unknownTimeZone' },
  { input: { instant, timeZone: '' }, code: 'unknownTimeZone' },
  { input: { date: '2024-03-10', time: '02:30', timeZone: 'America/New_York' }, code: 'nonexistentTime' },
  { input: { date: '2024-11-03', time: '01:30', timeZone: 'America/New_York' }, code: 'ambiguousTime' },
  { input: { date: '2024-10-06', time: '02:15', timeZone: 'Australia/Lord_Howe' }, code: 'nonexistentTime' },
];

for (const fixture of invalidDateTimes) {
  test(`date/time rejects ${fixture.code}: ${JSON.stringify(fixture.input)}`, () => {
    assert.throws(() => resolveDateTime(fixture.input), hasCode(fixture.code));
  });
}

test('explicit offsets disambiguate both occurrences of a daylight-saving overlap', () => {
  const early = resolveDateTime({ instant: '2024-11-03T01:30:00-04:00', timeZone: 'America/New_York' });
  const late = resolveDateTime({ instant: '2024-11-03T01:30:00-05:00', timeZone: 'America/New_York' });
  assert.equal(late.date.getTime() - early.date.getTime(), 3600000);
  assert.equal(early.displayDateTime, late.displayDateTime);
});

const invalidCalculations: Array<{ input: unknown; code: ChartErrorCode }> = [
  { input: { instant }, code: 'invalidLocation' },
  { input: { instant, location: { latitude: -90.01, longitude: 0 } }, code: 'invalidLocation' },
  { input: { instant, location: { latitude: 0, longitude: 180.01 } }, code: 'invalidLocation' },
  { input: { instant, location: { latitude: NaN, longitude: 0 } }, code: 'invalidLocation' },
  { input: { instant, location: { latitude: 0, longitude: Infinity } }, code: 'invalidLocation' },
  { input: { instant, location, bodies: [] }, code: 'invalidBodies' },
  { input: { instant, location, bodies: ['earth'] }, code: 'invalidBodies' },
  { input: { instant, location, bodies: ['sun', 'sun'] }, code: 'invalidBodies' },
  { input: { instant, location, houseSystem: 'X' }, code: 'invalidHouseSystem' },
  { input: { instant, location, locale: 'fr' }, code: 'invalidLocale' },
  { input: { date: '2024-01-01', time: '12:00', location }, code: 'invalidDateTime' },
  { input: { instant, date: '2024-01-01', time: '12:00', location }, code: 'invalidDateTime' },
];

for (const [index, fixture] of invalidCalculations.entries()) {
  test(`natal rejects ${fixture.code}, case ${index}`, () => {
    assert.throws(() => Reflect.apply(calculator.natal, undefined, [fixture.input]), hasCode(fixture.code));
  });
}

test('finite geographic boundaries are accepted for geocentric charts', () => {
  for (const point of [{ latitude: -90, longitude: -180 }, { latitude: 90, longitude: 180 }]) {
    const chart = calculator.planetary({ instant, location: point });
    assert.deepEqual(chart.location, point);
    assert.ok(chart.bodies.every(body => Number.isFinite(body.longitude)));
  }
});

test('domain errors and chart labels are available in Portuguese and English', () => {
  assert.equal(getMessages().labels.natal, 'Mapa natal');
  assert.equal(getMessages('en').labels.natal, 'Natal chart');
  assert.equal(getMessages().signs.length, 12);
  assert.deepEqual(Object.keys(getMessages().bodies), Object.keys(getMessages('en').bodies));
  const bad: NatalChartInput = { instant, location: { latitude: NaN, longitude: 0 }, locale: 'en' };
  assert.throws(() => calculator.natal(bad), {
    name: 'ChartError', code: 'invalidLocation', message: getMessages('en').errors.invalidLocation,
  });
});
