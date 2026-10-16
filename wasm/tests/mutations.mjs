import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = fileURLToPath(new URL('../../pkg', import.meta.url));
const suite = fileURLToPath(new URL('./binding.test.ts', import.meta.url));
const source = readFileSync(join(pkg, 'celestial_wasm.js'), 'utf8');
const forwardingMutants = [
  ['UT calculation uses TT', 'wasm.calcUt(tjdut, planet, flags)', 'wasm.calc(tjdut, planet, flags)'],
  ['calculation loses speed flags', 'wasm.calcUt(tjdut, planet, flags)', 'wasm.calcUt(tjdut, planet, 2)'],
  ['body identifier is ignored', 'wasm.calcUt(tjdut, planet, flags)', 'wasm.calcUt(tjdut, 0, flags)'],
  ['i64 result loses bigint type', 'wasm.degToCs(value)', 'wasm.normDeg(value)'],
  ['formatting swaps hemispheres', 'wasm.centisecToLonlatStr(value, positive, negative)', 'wasm.centisecToLonlatStr(value, negative, positive)'],
  ['transform truncates six-vector', 'wasm.coordTransformWithSpeed(coords, eps)', 'wasm.coordTransformWithSpeed(coords.slice(0, 3), eps)'],
  ['NaN no longer clears delta-T', 'wasm.setDeltaTUserdef(dt)', 'wasm.setDeltaTUserdef(Number.isNaN(dt) ? 86400 : dt)'],
  ['aspect loses relative speed sign', 'wasm.isApplying(signed_separation, relative_speed, aspect)', 'wasm.isApplying(signed_separation, -relative_speed, aspect)'],
];

function replaceExport(name, body) {
  const declaration = `export function ${name}(`;
  assert.ok(source.includes(declaration), `mutation export absent: ${name}`);
  return source.replace(declaration, `function original_${name}(`)
    + `\nexport function ${name}(...args) { ${body} }\n`;
}

const resultMutants = [
  ['antiscion drops counterpart', 'antiscion', 'const result = original_antiscion(...args); delete result.contrantiscion; return result;'],
  ['progressions drop latitude speed', 'secondaryProgressions', 'const result = original_secondaryProgressions(...args); delete result.positions[0].position.speedLat; return result;'],
  ['cusp search drops angles', 'nextAspectCusp', 'const result = original_nextAspectCusp(...args); if (result) delete result.ascmc; return result;'],
  ['midpoints drop linked planets', 'midpointTable', 'return original_midpointTable(...args).map(item => ({...item, planetsOnMidpoint: []}));'],
  ['festivals drop names', 'sabbatsForYear', 'return original_sabbatsForYear(...args).map(({name, ...item}) => item);'],
  ['pillars drop numerical identifiers', 'fourPillars', 'return original_fourPillars(...args).map(({stem, ...item}) => item);'],
  ['batch error discards successful siblings', 'calcUtMany', 'const result = original_calcUtMany(...args); if (result.some(item => item.status === "error")) throw new Error("batch failed"); return result;'],
  ['errors drop structured metadata', 'fixstar', 'try { return original_fixstar(...args); } catch (error) { delete error.details; throw error; }'],
  ['version reports wrapper version', 'version', 'return "0.2.0";'],
  ['elapsed day count narrows to i32', 'elapsedDays', 'return BigInt.asIntN(32, original_elapsedDays(...args));'],
  ['house results drop cusp zero', 'housesEx', 'const result = original_housesEx(...args); result.cusps = result.cusps.slice(1); return result;'],
  ['packed positions ignore incomplete tails', 'midpointTable', 'const [positions, orb] = args; return original_midpointTable(positions.slice(0, positions.length - positions.length % 2), orb);'],
];

const mutants = [
  ...forwardingMutants.map(([name, before, after]) => {
    assert.ok(source.includes(before), `mutation target absent: ${name}`);
    return [name, source.replace(before, after)];
  }),
  ...resultMutants.map(([name, exported, body]) => [name, replaceExport(exported, body)]),
];

function run(modulePath) {
  return spawnSync(process.execPath, ['--test', '--test-reporter=spec', suite], {
    encoding: 'utf8',
    env: { ...process.env, CELESTIAL_WASM_TEST_MODULE: modulePath },
    timeout: 30000,
  });
}

const baseline = run(join(pkg, 'celestial_wasm.js'));
assert.equal(baseline.status, 0, baseline.stdout + baseline.stderr);
const testCount = /\btests (\d+)\b/.exec(baseline.stdout)?.[1];
assert.ok(testCount, 'baseline reporter must record executed tests');
const directory = mkdtempSync(join(tmpdir(), 'celestial-wasm-binding-mutants-'));
try {
  cpSync(pkg, directory, { recursive: true });
  writeFileSync(join(directory, 'package.json'), '{"type":"module"}\n');
  for (const [name, mutated] of mutants) {
    writeFileSync(join(directory, 'celestial_wasm.js'), mutated);
    const result = run(join(directory, 'celestial_wasm.js'));
    assert.equal(result.signal, null, `mutant timed out: ${name}`);
    assert.notEqual(result.status, 0, `surviving mutant: ${name}`);
    assert.match(result.stdout, new RegExp(`\\btests ${testCount}\\b`), `mutant failed before suite ran: ${name}\n${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /\bfail [1-9]\d*\b/, `mutant did not trigger a failed test: ${name}`);
    console.log(`Killed: ${name}`);
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
console.log(`${mutants.length}/${mutants.length} seeded JS/WASM interface mutants killed; Rust engine mutation is a separate scope.`);
