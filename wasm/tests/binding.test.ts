import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { Worker } from 'node:worker_threads';
import { celestial as c } from './runtime.ts';

interface Golden {
  tolerance: number;
  calc_ut: { jd: number; flags: number; cases: Array<{ body: number; position: number[] }> };
  houses_ex: { jd: number; lat: number; lon: number; hsys: number; flags: number; cusps: number[]; ascmc: number[] };
  rise_trans: { jd: number; planet: number; flags: number; event_type: number; geopos: number[]; pressure_mb: number; temp_c: number; ret_flags: number; tret: number };
}

interface MedicineWheel {
  sun_lon: number;
  animal: string;
  element: string;
  clan: string;
  season: string;
}

const manifest = JSON.parse(readFileSync(new URL('../api-manifest.json', import.meta.url), 'utf8')) as { coreFunctions: string[]; functions: Record<string, keyof typeof c>; constants: string[] };
const golden = JSON.parse(readFileSync(new URL('../../tests/fixtures/binding_golden.json', import.meta.url), 'utf8')) as Golden;
const reference = JSON.parse(readFileSync(new URL('../../tests/fixtures/reference_values.json', import.meta.url), 'utf8')) as { medicine_wheel: MedicineWheel[] };
const jd = 2451545;
const k = c.constants();

function close(actual: number, expected: number, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}

function closeVector(actual: number[], expected: number[]) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => close(value, expected[index], golden.tolerance));
}

test('exports cover every flat core function and constant', () => {
  assert.equal(manifest.coreFunctions.length, 300);
  assert.equal(Object.keys(manifest.functions).length, 303);
  for (const name of Object.values(manifest.functions)) assert.equal(typeof c[name], 'function', name);
  assert.deepEqual(Object.keys(k).sort(), manifest.constants);
  assert.equal(k.SUN, 0);
  assert.equal(k.FLG_SPEED, 256);
  assert.equal(k.GMT_CORRELATION, 584283n);
  assert.equal(k.COPTIC_MONTHS.length, 13);
  assert.equal(k.TZ_TABLE.length, 203);
  assert.deepEqual(k.MAJOR_ASPECTS, [0, 60, 90, 120, 180]);
});

test('planet results preserve upstream native golden values and camelCase fields', () => {
  const fixture = golden.calc_ut;
  for (const entry of fixture.cases) {
    const result = c.calcUt(fixture.jd, entry.body, fixture.flags);
    assert.deepEqual(Object.keys(result).sort(), ['dist', 'lat', 'lon', 'retFlags', 'speedDist', 'speedLat', 'speedLon']);
    closeVector([result.lon, result.lat, result.dist, result.speedLon, result.speedLat, result.speedDist], entry.position);
  }
});

test('house and rise/transit results preserve upstream golden values', () => {
  const h = golden.houses_ex;
  const houses = c.housesEx(h.jd, h.lat, h.lon, h.hsys, h.flags);
  assert.equal(houses.cusps.length, 13);
  assert.equal(houses.ascmc.length, 10);
  assert.equal(houses.cusps[0], 0);
  closeVector(houses.cusps.slice(1), h.cusps);
  closeVector(houses.ascmc.slice(0, 8), h.ascmc);
  const r = golden.rise_trans;
  const rise = c.riseTrans(r.jd, r.planet, r.flags, r.event_type, r.geopos, r.pressure_mb, r.temp_c);
  assert.equal(rise.retFlags, r.ret_flags);
  close(rise.tret, r.tret, golden.tolerance);
});

test('batch calculations retain order, duplicate bodies and per-item structured errors', () => {
  for (const [many, single] of [[c.calcMany, c.calc], [c.calcUtMany, c.calcUt]] as const) {
    const results = many(jd, [0, 999999999, 10000, 1, 0], 258);
    assert.deepEqual(results.map(result => result.status), ['ok', 'error', 'error', 'ok', 'ok']);
    const [first, invalid, unavailable, moon, duplicate] = results;
    assert.equal(first.status, 'ok');
    assert.equal(invalid.status, 'error');
    assert.equal(unavailable.status, 'error');
    assert.equal(moon.status, 'ok');
    if (first.status === 'ok') assert.deepEqual(first.value, single(jd, 0, 258));
    if (moon.status === 'ok') assert.deepEqual(moon.value, single(jd, 1, 258));
    if (invalid.status === 'error') {
      assert.equal(invalid.value.kind, 'BodyOutOfRange');
      assert.equal(invalid.value.details.id, 999999999);
    }
    if (unavailable.status === 'error') {
      assert.equal(unavailable.value.kind, 'Calc');
      assert.equal(unavailable.value.details.reason, 'body not implemented in pure-Rust engine');
    }
    assert.deepEqual(first, duplicate);
  }
});

test('complete house, antiscion, progressed chart and cusp records retain every field', () => {
  const houses = c.houses(jd, 48, 2, 80);
  assert.equal(houses.cusps.length, 13);
  assert.equal(houses.ascmc.length, 10);
  assert.equal(c.annualProfection(houses.cusps, 1).length, 2);
  const speeds = c.housesEx2(jd, 48, 2, 80);
  assert.equal(speeds.cuspSpeeds.length, 13);
  assert.equal(speeds.ascmcSpeeds.length, 10);
  const reflected = c.antiscion([30, 1, 1, 0.1, 0.2, 0.3], 90);
  assert.deepEqual(reflected.antiscion, [150, 1, 1, -0.1, 0.2, 0.3]);
  assert.deepEqual(reflected.contrantiscion, [330, -1, 1, -0.1, -0.2, 0.3]);
  const progressed = c.secondaryProgressions(jd, 10, [0, 1], 48, 2, 80, 258);
  assert.deepEqual(progressed.positions, [
    { body: 0, position: c.calcUt(jd + 10, 0, 258) },
    { body: 1, position: c.calcUt(jd + 10, 1, 258) },
  ]);
  assert.deepEqual(progressed.houses, c.houses(jd + 10, 48, 2, 80));
  for (const search of [c.nextAspectCusp, c.nextAspectCusp2]) {
    const result = search(0, 0, 1, jd, 48, 2, 80, false, 2);
    assert.ok(result);
    assert.equal(result.pos.length, 6);
    assert.equal(result.cusps.length, 13);
    assert.equal(result.ascmc.length, 10);
    assert.ok(result.jd >= jd);
  }
});

test('midpoints, named festivals, pillars and auxiliary metadata remain complete', () => {
  const midpoints = c.midpointTable([0, 0, 1, 60, 4, 30], 0.01);
  assert.deepEqual(midpoints[0], { body1: 0, body2: 1, longitude: 30, planetsOnMidpoint: [{ body: 4, orb: 0 }] });
  const sabbats = c.sabbatsForYear(2024);
  assert.equal(sabbats.length, 8);
  for (const sabbat of sabbats) {
    assert.equal(sabbat.name, sabbat.kind);
    close(sabbat.jd, c.sabbatJd(2024, sabbat.kind));
  }
  assert.equal(c.nextSabbat(jd).name, c.nextSabbat(jd).kind);
  for (const esbat of c.esbatsForYear(2024)) {
    assert.equal(typeof esbat.name, 'string');
    assert.equal(typeof esbat.displayName, 'string');
    assert.ok(esbat.jd > 0);
  }
  assert.equal(c.nextEsbat(jd).name, 'Wolf');
  for (const pillar of c.fourPillars(jd, 12, 280)) {
    assert.deepEqual(pillar, c.makePillar(pillar.stem, pillar.branch));
  }
  assert.equal(c.jdToBahai(jd).jd, jd);
  assert.equal(c.moonPhaseInfo(jd).phase, 'WaningCrescent');
  assert.equal(c.version(), '2.10.03');
  assert.equal(typeof c.elapsedDays(1000000000), 'bigint');
  assert.ok(c.elapsedDays(1000000000) > 2147483647n);
  assert.deepEqual(c.tryPanchanga(jd), c.panchanga(jd));
});

test('core error metadata preserves variant fields beyond formatted Display precision', () => {
  assert.throws(() => c.fixstar('missing-fixed-star', jd, 2), (error: unknown) => {
    assert.ok(error instanceof Error);
    const structured = error as Error & import('../../pkg/celestial_wasm.js').CelestialError;
    assert.equal(structured.kind, 'StarNotFound');
    assert.equal(structured.details.name, 'missing-fixed-star');
    return true;
  });
  const latitude = 89.123456789;
  assert.throws(() => c.riseTrans(jd, 0, 2, 1, [0, latitude, 0], 0, 0), (error: unknown) => {
    assert.ok(error instanceof Error);
    const structured = error as Error & import('../../pkg/celestial_wasm.js').CelestialError;
    assert.equal(structured.kind, 'CircumpolarBody');
    assert.equal(structured.details.body, 0);
    assert.equal(structured.details.lat, latitude);
    assert.match(structured.message, /89\.12/);
    return true;
  });
});

test('all medicine wheel reference cases survive the WASM seam', () => {
  for (const fixture of reference.medicine_wheel) {
    assert.deepEqual(c.medicineWheelTotem(fixture.sun_lon), [fixture.animal, fixture.element, fixture.clan, fixture.season]);
  }
});

test('date inputs, optional arguments, calendar features and timezone table work', () => {
  assert.equal(c.julday(2000, 1, 1, 12), jd);
  assert.equal(c.julday(2000, 1, 1, 12, 1), jd);
  assert.equal(c.dateConversion(2000, 1, 1, 12, 'g'.charCodeAt(0)), jd);
  assert.deepEqual(c.revjul(jd), { year: 2000, month: 1, day: 1, hour: 12 });
  const pair = c.utcToJd({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 });
  assert.equal(pair.ut1, jd);
  assert.ok(pair.et > pair.ut1);
  assert.deepEqual(c.easterGregorian(2024), { year: 2024, month: 3, day: 31 });
  assert.equal(c.tzAbbrFind('UTC')[0].name, 'UTC');
  assert.equal(c.parseDatetime('invalid'), null);
  assert.equal(c.currentFileData(0), null);
});

test('new angle and centisecond exports preserve scalar and bigint semantics', () => {
  close(c.normRad(-Math.PI / 2), 3 * Math.PI / 2);
  close(c.midpointRad(0, Math.PI / 2), Math.PI / 4);
  close(c.diffRadSigned(0, Math.PI / 2), -Math.PI / 2);
  assert.equal(c.wrapSigned180(181), -179);
  assert.equal(c.diffCs(200, 50), 150n);
  assert.equal(c.diffCsSigned(50, 200), -150n);
  assert.equal(c.csRoundSec(150), 200n);
  assert.equal(c.degToCs(12.9), 12n);
  assert.equal(c.degToCs(Number.MAX_VALUE), 9223372036854775807n);
  assert.equal(c.isApplying(119, 1, 120), true);
  assert.equal(c.isApplying(119, -1, 120), false);
  assert.ok(c.defaultOrb(0, 1, 0) > 0);
});

test('new formatting and six-dimensional transforms forward all inputs', () => {
  assert.equal(c.centisecToDegStr(360000), '  1°00\'00"');
  assert.equal(c.centisecToLonlatStr(-360000, 'E', 'W'), '  1W00\'00"');
  assert.equal(c.centisecToTimeStr(366100, ':', false), '01:01:01');
  assert.equal(c.centisecToTimeStr(6100, '·', true), '01·01');
  closeVector(c.coordTransformWithSpeed([30, 10, 1, 0.1, 0.2, 0.3], 0), [30, 10, 1, 0.1, 0.2, 0.3]);
});

test('new orbital, pillar and heliacal exports return their complete structures', () => {
  const elements = c.getOrbitalElements(jd, k.MARS, k.FLG_BUILTIN);
  assert.deepEqual(Object.keys(elements).sort(), ['argPerihelion', 'ascendingNode', 'eccentricity', 'epoch', 'extra', 'inclination', 'meanAnomaly', 'meanDailyMotion', 'semiMajorAxis']);
  assert.ok(elements.semiMajorAxis > 1);
  const distances = c.orbitMaxMinTrueDistance(jd, k.MARS, k.FLG_BUILTIN);
  assert.ok(distances.dmax > distances.dtrue);
  assert.ok(distances.dtrue > distances.dmin);
  assert.deepEqual(c.makePillar(0, 0), { stem: 0, branch: 0, stemName: 'Jiǎ', branchName: 'Zǐ', animal: 'Rat', stemElement: 'Wood', branchElement: 'Water', yang: true });
  const geo = [2.35, 48.85, 35], atmosphere = [1013, 15, 0.5, 0], observer = [36, 1, 0, 0, 0, 0];
  assert.equal(c.heliacalPhenoUt(jd, geo, atmosphere, observer, 'venus', 1, k.FLG_BUILTIN).length, 50);
  assert.equal(c.visLimitMag(jd, geo, atmosphere, observer, 'venus', 0).length, 8);
  const sector = c.gauquelinSector(jd, k.SUN, null, k.FLG_BUILTIN, 0, geo, 1013, 15);
  assert.ok(sector >= 1 && sector <= 36);
});

test('configuration and IEEE non-finite values cross the seam without JSON loss', () => {
  c.setSidMode(k.SIDM_LAHIRI);
  close(c.ayanamsaEx(jd, 0), c.ayanamsa(jd));
  close(c.ayanamsaExUt(jd, 0), c.ayanamsaUt(jd));
  c.setDeltaTUserdef(86400);
  assert.equal(c.deltatEx(jd, 0), 86400);
  assert.equal(c.deltat(jd), 1);
  c.setDeltaTUserdef(NaN);
  assert.notEqual(c.deltatEx(jd, 0), 86400);
  assert.ok(Number.isNaN(c.normRad(NaN)));
  c.setTidAcc(-25.8);
  assert.equal(c.tidAcc(), 0);
  c.setLapseRate(0.0065);
  assert.match(c.libraryPath(), /pure-Rust/);
  c.setSidMode(k.SIDM_FAGAN_BRADLEY);
});

test('bad argument types, body identifiers and fixed array sizes throw JavaScript errors', () => {
  const cases = [
    () => c.calcUt(jd, 999999999, k.FLG_BUILTIN),
    // @ts-expect-error runtime validation rejects values outside the declared API
    () => c.calcUt('not a number', 0, k.FLG_BUILTIN),
    () => c.defaultOrb(999999999, 0, 0),
    () => c.coordTransformWithSpeed([0, 1], 23),
    () => c.heliacalPhenoUt(jd, [], [1013, 15, 0.5, 0], [36, 1, 0, 0, 0, 0], 'venus', 1, 0),
    () => c.visLimitMag(jd, [0, 0, 0], [], [36, 1, 0, 0, 0, 0], 'venus', 0),
    () => c.gauquelinSector(jd, 0, null, 0, 0, [], 0, 0),
    () => c.centisecToLonlatStr(0, '', 'W'),
    () => c.centisecToTimeStr(0, '::', true),
    // @ts-expect-error runtime validation also rejects incomplete typed records
    () => c.utcToJd({ year: 2000 }),
    () => c.solarArcDirections(jd, 10, [0, 30, 1], 0, 2),
    () => c.midpointTable([0, 0, 1], 2),
    () => c.calcChartAspects([0, 0, 1, 1], [60], 2),
    () => c.calcChartAspectsAuto([0, 0, 1, 1], [60]),
    () => c.houses(jd, 0, 0, 336),
    () => c.signRuler(256),
    () => c.hijriMonthName(257),
    () => c.moonPhasesForMonth(2024, 257),
    () => c.calcUt(jd, 0.5, 2),
    () => c.solarArcDirections(jd, 10, [0.5, 30], 0, 2),
    () => c.calcChartAspects([4294967296, 0, 1], [60], 2),
  ];
  for (const invoke of cases) assert.throws(invoke, Error);
});

test('the web module runs in independent workers with isolated engine configuration', async () => {
  const modes = [k.SIDM_LAHIRI, k.SIDM_RAMAN];
  const workers = modes.map(mode => new Worker(new URL('./worker.mjs', import.meta.url), { workerData: { mode } }));
  try {
    await Promise.all(workers.map(worker => once(worker, 'message')));
    const result = workers.map(worker => once(worker, 'message'));
    workers.forEach(worker => worker.postMessage('calculate'));
    const values = (await Promise.all(result)).map(([value]) => value);
    assert.notEqual(values[0], values[1]);
    modes.forEach((mode, index) => { c.setSidMode(mode); close(values[index], c.ayanamsa(jd)); });
  } finally {
    await Promise.all(workers.map(worker => worker.terminate()));
    c.setSidMode(k.SIDM_FAGAN_BRADLEY);
  }
});
