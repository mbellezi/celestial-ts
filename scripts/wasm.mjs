import { spawnSync } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../', import.meta.url));
const action = process.argv[2] ?? 'test';
const target = 'wasm32-unknown-unknown';

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: directory,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function verifyTools() {
  const result = spawnSync('wasm-bindgen', ['--version'], { encoding: 'utf8' });
  if (result.error || result.stdout.trim() !== 'wasm-bindgen 0.2.129') {
    throw new Error('Install wasm-bindgen-cli 0.2.129 (see README.md).');
  }
}

async function build() {
  verifyTools();
  run('python3', ['wasm/generate.py', '--check']);
  run('cargo', ['build', '--locked', '-p', 'celestial-wasm', '--release', '--target', target]);
  run('wasm-bindgen', [
    `target/${target}/release/celestial_wasm.wasm`,
    '--target', 'web', '--out-dir', 'pkg', '--out-name', 'celestial_wasm',
  ]);
  await mkdir(`${directory}/pkg`, { recursive: true });
  await writeFile(`${directory}/pkg/package.json`, '{"type":"module"}\n');
  run('node', ['scripts/locations.mjs', 'build']);
  run('node', ['scripts/charts.mjs', 'build']);
  run('node', ['scripts/reports.mjs', 'build']);
}

async function testBindings() {
  const tests = (await readdir(`${directory}/wasm/tests`))
    .filter(name => name.endsWith('.test.ts'))
    .map(name => `wasm/tests/${name}`);
  run('node', ['node_modules/typescript/bin/tsc',
    '--noEmit', '--strict', '--target', 'ES2022', '--module', 'nodenext',
    '--moduleResolution', 'nodenext', '--allowImportingTsExtensions', ...tests]);
  run('node', ['--test', '--test-timeout=60000', ...tests.filter(name => !name.endsWith('/types.test.ts'))]);
  run('node', ['wasm/tests/mutations.mjs']);
}

function testCore() {
  verifyTools();
  run('python3', ['wasm/generate.py', '--check']);
  run('cargo', ['test', '--locked', '-p', 'celestial-core', '--all-features', '--lib', '--tests', '--target', target], {
    WASM_BINDGEN_TEST_TIMEOUT: '600',
  });
  run('cargo', ['test', '--locked', '-p', 'celestial-core', '--all-features', '--doc', '--target', target], {
    CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER: `node ${directory}/tests/run-wasm-doctest.mjs`,
  });
}

switch (action) {
  case 'build':
    await build();
    break;
  case 'test':
    testCore();
    await build();
    await testBindings();
    break;
  case 'core':
    testCore();
    break;
  case 'bindings':
    await build();
    await testBindings();
    break;
  case 'native':
    run('cargo', ['test', '--locked', '-p', 'celestial-core', '--all-features', '--no-fail-fast']);
    break;
  default:
    throw new Error('Usage: node scripts/wasm.mjs build|test|core|bindings|native');
}
