import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../', import.meta.url));
const compiler = 'node_modules/typescript/bin/tsc';
const action = process.argv[2] ?? 'test';
const gallery = 'charts/examples/generate.ts';

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: directory, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function build() {
  await rm(`${directory}/pkg/charts`, { recursive: true, force: true });
  run([compiler, '-p', 'charts/tsconfig.json']);
  const declarations = (await readdir(`${directory}/pkg/charts`)).filter(name => name.endsWith('.d.ts'));
  for (const name of declarations) {
    const path = `${directory}/pkg/charts/${name}`;
    const source = await readFile(path, 'utf8');
    // Source types refer to the neighbouring build; installed declarations refer to their own package.
    await writeFile(path, source.replaceAll('../../pkg/celestial_wasm.js', '../celestial_wasm.js'));
  }
}

async function test() {
  await build();
  const tests = (await readdir(`${directory}/charts/tests`))
    .filter(name => name.endsWith('.test.ts')).map(name => `charts/tests/${name}`);
  typecheck([...tests, gallery]);
  run(['--test', '--test-timeout=60000', ...tests]);
}

function typecheck(files) {
  run([compiler, '--noEmit', '--strict', '--target', 'ES2022', '--module', 'nodenext',
    '--moduleResolution', 'nodenext', '--allowImportingTsExtensions', ...files]);
}

const mutants = [
  { name: 'unescaped text', file: 'svg.js', pattern: 'user titles',
    from: 'return String(value).replace', to: 'return String(value); void String(value).replace' },
  { name: 'colliding labels', file: 'geometry.js', pattern: 'circular label placement',
    from: 'labelLongitude: normalizeAngle(placed[index])', to: 'labelLongitude: body.longitude' },
  { name: 'anchors follow labels', file: 'wheel.js', pattern: 'moving labels',
    from: 'const exact = pointAt(body.longitude,', to: 'const exact = pointAt(labels.get(body.id),' },
  { name: 'rounded planetary data', file: 'wheel.js', pattern: 'six themes',
    from: 'data-longitude="${body.longitude}"', to: 'data-longitude="${body.longitude.toFixed(2)}"' },
  { name: 'invisible heading', file: 'render.js', pattern: 'six themes',
    from: 'fill: ctx.theme.colors.foreground, font: ctx.theme.headingFont',
    to: 'fill: ctx.theme.colors.background, font: ctx.theme.headingFont' },
];

async function prepareMutationDirectory(path) {
  await cp(`${directory}/pkg`, join(path, 'pkg'), { recursive: true });
  await mkdir(join(path, 'charts/tests'), { recursive: true });
  await mkdir(join(path, 'wasm/tests'), { recursive: true });
  await cp(`${directory}/charts/tests/render.test.ts`, join(path, 'charts/tests/render.test.ts'));
  await cp(`${directory}/wasm/tests/runtime.ts`, join(path, 'wasm/tests/runtime.ts'));
  await symlink(fileURLToPath(new URL('../node_modules', import.meta.url)), join(path, 'node_modules'), 'dir');
}

async function checkMutation(path, mutant) {
  const target = join(path, 'pkg/charts', mutant.file);
  const original = await readFile(target, 'utf8');
  if (original.split(mutant.from).length !== 2) throw new Error(`Mutation seed changed: ${mutant.name}`);
  await writeFile(target, original.replace(mutant.from, mutant.to));
  try {
    const result = spawnSync(process.execPath, ['--test', '--test-timeout=60000',
      `--test-name-pattern=${mutant.pattern}`, 'charts/tests/render.test.ts'], {
      cwd: path, encoding: 'utf8', env: { ...process.env, CELESTIAL_WASM_TEST_MODULE: '' },
    });
    if (result.error) throw result.error;
    if (result.status === 0 || !/ERR_ASSERTION|AssertionError/.test(result.stdout)) {
      throw new Error(`Chart mutation was not caught by an assertion: ${mutant.name}\n${result.stdout}\n${result.stderr}`);
    }
    console.log(`Killed chart mutation: ${mutant.name}`);
  } finally {
    await writeFile(target, original);
  }
}

async function mutations() {
  const path = await mkdtemp(join(tmpdir(), 'celestial-charts-mutations-'));
  try {
    await prepareMutationDirectory(path);
    for (const mutant of mutants) await checkMutation(path, mutant);
  } finally {
    await rm(path, { recursive: true, force: true });
  }
}

switch (action) {
  case 'build':
    await build();
    break;
  case 'test':
    await test();
    await mutations();
    break;
  case 'gallery':
    await build();
    typecheck([gallery]);
    run([gallery]);
    break;
  default:
    throw new Error('Usage: node scripts/charts.mjs build|test|gallery (build WASM first)');
}
