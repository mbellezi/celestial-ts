import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { celestial as c } from './runtime.ts';
import type { AspectCheck, PlanetPos } from '../../pkg/celestial_wasm.js';

interface MethodEntry {
  core: string;
  kind: 'function' | 'constructor' | 'method';
  export: string;
  member?: string;
  static?: boolean;
}
const manifest = JSON.parse(readFileSync(new URL('../methods-manifest.json', import.meta.url), 'utf8')) as { methods: MethodEntry[] };
const jd = 2451545;
const flags = 258;

function typedError(error: unknown): boolean {
  return error instanceof Error && typeof Reflect.get(error, 'kind') === 'string';
}

test('all 69 public inherent methods have callable WASM counterparts', () => {
  assert.equal(manifest.methods.length, 69);
  assert.equal(new Set(manifest.methods.map((entry) => entry.core)).size, 69);
  for (const entry of manifest.methods) {
    const exported: unknown = Reflect.get(c, entry.export);
    assert.equal(typeof exported, 'function', entry.core);
    if (entry.kind !== 'method') continue;
    const receiver: object = entry.static ? exported as object : Reflect.get(exported as object, 'prototype') as object;
    assert.equal(typeof Reflect.get(receiver, entry.member!), 'function', entry.core);
  }
});

test('body and flag methods delegate classification, names and raw conversions', () => {
  assert.equal(c.bodyFromRaw(-99), -99);
  assert.equal(c.bodyAsRaw(4), 4);
  assert.equal(c.bodyIsKnownId(4), true);
  assert.equal(c.bodyIsKnownId(-99), false);
  assert.equal(c.bodyTryFromRaw(4), 4);
  assert.throws(() => c.bodyTryFromRaw(-99), typedError);
  assert.equal(c.bodyIsPlanet(4), true);
  assert.equal(c.bodyIsPlanet(10), false);
  assert.equal(c.bodyRetrogradeSearchWindow(4), 800);
  assert.equal(c.bodyIngressSearchWindow(4), 750);
  assert.equal(c.bodyOrbWeight(0), 2);
  assert.equal(c.bodyIsNode(10), true);
  assert.equal(c.bodyName(4), 'Mars');
  assert.equal(c.calcFlagsAsRaw(flags), flags);
  assert.equal(c.calcFlagsIsSpeed(flags), true);
  assert.equal(c.calcFlagsIsSidereal(65536), true);
  assert.equal(c.houseSystemAsRaw(80), 80);
  assert.equal(c.houseSystemName(80), c.houseName(80));
  assert.equal(c.siderealModeAsRaw(1), 1);
  assert.equal(c.siderealModeName(1), c.ayanamsaName(1));
  assert.equal(c.calendarAsRaw(0), 0);
  assert.equal(c.calendarAsRaw(1), 1);
});

test('unit new/get counterparts preserve f64 values without rounding', () => {
  const units = [
    [c.julianDayNew, c.julianDayGet],
    [c.latitudeNew, c.latitudeGet],
    [c.longitudeNew, c.longitudeGet],
    [c.degreesNew, c.degreesGet],
  ] as const;
  for (const [wrap, unwrap] of units) {
    for (const value of [jd + 0.123456789, -0, -1e-15, Number.NaN, Infinity, -Infinity]) {
      assert.ok(Object.is(unwrap(wrap(value)), value));
    }
  }
});

test('integer method seams reject wrapping, truncation and nonfinite inputs', () => {
  for (const value of [2 ** 32, 0.5, Number.NaN]) {
    assert.throws(() => c.bodyTryFromRaw(value), typedError);
    assert.throws(() => c.bodyFromRaw(value), typedError);
    assert.throws(() => c.calcFlagsAsRaw(value), typedError);
    assert.throws(() => c.CalcOptions.ut(jd, value), typedError);
    assert.throws(() => c.CalcOptions.ut(jd, flags).body(value), typedError);
    assert.throws(() => c.CalcOptions.ut(jd, flags).bodies([0, value]), typedError);
    assert.throws(() => new c.SearchOptions(value, jd), typedError);
    assert.throws(() => new c.RiseTransOptions(jd, value, Float64Array.from([0, 0, 0])), typedError);
  }
  assert.throws(() => c.houseSystemAsRaw(257), typedError);
  assert.throws(() => new c.SearchOptions(0, jd).cusp(1, 0, 0, 257), typedError);
  assert.throws(() => new c.SearchOptions(0, jd).natalChart(jd, 0, 0, 257), typedError);
  assert.throws(() => new c.SearchOptions(0, jd).flags(0.5), typedError);
  assert.throws(() => new c.RiseTransOptions(jd, 0, Float64Array.from([0, 0, 0])).event(0.5), typedError);
  assert.throws(() => new c.RiseTransOptions(jd, 0, Float64Array.from([0, 0, 0])).flags(0.5), typedError);
});

test('calendar, lunar and solar enum methods retain original variant order', () => {
  assert.equal(c.esbatDisplayName(0), 'Wolf Moon');
  assert.ok(c.esbatAltNames(0).includes('Ice Moon'));
  assert.equal(c.sabbatName(0), 'Yule');
  assert.ok(c.sabbatAltNames(0).length > 0);
  assert.equal(c.sabbatSolarLongitude(0), 270);
  assert.equal(c.sabbatIsQuarterDay(0), true);
  assert.equal(c.sabbatIsCrossQuarter(1), true);
  assert.deepEqual(Array.from(c.sabbatAllByLongitude()), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(c.moonPhaseName(4), 'Full Moon');
  assert.equal(c.moonPhaseTargetElongation(4), 180);
  assert.equal(c.principalPhaseName(3), 'Last Quarter');
  assert.equal(c.principalPhaseElongationTarget(3), 270);
  assert.equal(c.solarCyclePhaseName(2), 'Maximum');
  assert.equal(c.grandSolarEpochName(1), 'Maunder Minimum');
});

test('enum method seams reject fractional, nonfinite and out-of-range indices', () => {
  const methods = [c.esbatDisplayName, c.sabbatName, c.moonPhaseName, c.principalPhaseName, c.solarCyclePhaseName, c.grandSolarEpochName];
  for (const method of methods) {
    for (const value of [-1, 99, 0.5, Number.NaN, Infinity]) assert.throws(() => method(value), typedError);
  }
});

test('UT/TT calculation builders preserve flags, strategy and body selection', () => {
  for (const strategy of [0, 1, 2]) {
    const ut: PlanetPos = c.CalcOptions.ut(jd, flags).strategy(strategy).body(4).get();
    const tt: PlanetPos = c.CalcOptions.tt(jd, flags).strategy(strategy).body(4).get();
    assert.deepEqual(ut, c.calcUt(jd, 4, flags));
    assert.deepEqual(tt, c.calc(jd, 4, flags));
  }
  assert.throws(() => c.CalcOptions.ut(jd, flags).strategy(0.5), typedError);
  assert.throws(() => c.CalcOptions.ut(jd, flags).body(-99).get(), typedError);
});

test('batch builder finalizers preserve duplicates, per-body errors and order', () => {
  const bodies = [4, 0, -99, 4];
  const ut = c.CalcOptions.ut(jd, flags).strategy(1).bodies(bodies).getMany();
  const tt = c.CalcOptions.tt(jd, flags).strategy(2).bodies(bodies).getMany();
  assert.deepEqual(ut, c.calcUtMany(jd, bodies, flags));
  assert.deepEqual(tt, c.calcMany(jd, bodies, flags));
  assert.equal(ut[2]?.status, 'error');
  assert.deepEqual(ut[0], ut[3]);
});

function aspectVector(value: AspectCheck): number[] {
  return [Number(value.matched), value.diff, value.speed, value.factor];
}

test('aspect builder preserves both core matching algorithms and custom orbs', () => {
  const builder = new c.AspectOrbs(1.5, 0.5).defOrb(2);
  assert.deepEqual(aspectVector(builder.check(120, 0.5, 0, -0.4, 120)), c.matchAspect4(120, 0.5, 0, -0.4, 120, 1.5, 0.5, 2));
  assert.deepEqual(aspectVector(builder.checkSimple(120, 0.5, 0, -0.4, 120)), c.matchAspect3(120, 0.5, 0, -0.4, 120, 1.5, 0.5, 2));
  builder.free();
});

test('rise/transit builder keeps atmosphere, event, horizon and star behavior', () => {
  const geopos = [2.35, 48.85, 35];
  const result = new c.RiseTransOptions(jd, 0, Float64Array.from(geopos))
    .flags(2).event(2).atmosphere(850, 10).horizonHeight(1.5).star('Sirius').search();
  assert.deepEqual(result, c.riseTransTrueHor(jd, 0, 2, 2, geopos, 850, 10, 1.5));
  assert.throws(() => new c.RiseTransOptions(jd, 0, Float64Array.from([0, 1])), typedError);
});

function natalSearch(): InstanceType<typeof c.SearchOptions> {
  return new c.SearchOptions(0, jd + 1).natalChart(jd, 48.85, 2.35, 80).backward(false).flags(2);
}

test('search builder delegates all four natal angle transit finalizers', () => {
  assert.equal(natalSearch().searchMcTransit(), c.mcTransitUt(0, jd, jd + 1, 48.85, 2.35, 80, 2, false));
  assert.equal(natalSearch().searchIcTransit(), c.icTransitUt(0, jd, jd + 1, 48.85, 2.35, 80, 2, false));
  assert.equal(natalSearch().searchAscTransit(), c.ascTransitUt(0, jd, jd + 1, 48.85, 2.35, 80, 2, false));
  assert.equal(natalSearch().searchDscTransit(), c.dscTransitUt(0, jd, jd + 1, 48.85, 2.35, 80, 2, false));
});

test('search builder preserves cusp result arrays and invalid-result nulls', () => {
  const result = new c.SearchOptions(0, jd).aspect(90).cusp(1, 48.85, 2.35, 80).backward(false).flags(2).searchCusp();
  assert.deepEqual(result, c.nextAspectCusp(0, 90, 1, jd, 48.85, 2.35, 80, false, 2));
  assert.equal(new c.SearchOptions(-99, jd).cusp(0, 0, 0, 80).searchCusp(), null);
});
