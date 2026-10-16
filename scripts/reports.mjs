import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const directory = fileURLToPath(new URL('../', import.meta.url));
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: directory, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
async function build() {
  // Natal reports share the chart calculator and its date/location validation.
  run(['scripts/charts.mjs', 'build']);
  await rm(`${directory}/pkg/reports`, { recursive: true, force: true });
  run(['node_modules/typescript/bin/tsc', '-p', 'reports/tsconfig.json']);
  const output = `${directory}/pkg/reports`;
  for (const name of await readdir(`${output}/src`)) {
    let content = await readFile(`${output}/src/${name}`, 'utf8');
    if (name.endsWith('.map')) {
      const map = JSON.parse(content);
      map.sources = map.sources.map(source => source.replace(/^\.\.\//, ''));
      content = JSON.stringify(map);
    }
    await writeFile(`${output}/${name}`, content
      .replaceAll('../../pkg/celestial_wasm.js', '../celestial_wasm.js')
      .replaceAll('../../pkg/charts/', '../charts/')
      .replaceAll('../data/', './data/'));
  }
  await rm(`${output}/src`, { recursive: true });
  await mkdir(`${output}/data`, { recursive: true });
  await cp(`${directory}/reports/data`, `${output}/data`, { recursive: true });
}
await build();
if ((process.argv[2] ?? 'test') === 'test') {
  const tests = (await readdir(`${directory}/reports/tests`)).filter(name => name.endsWith('.test.ts')).map(name => `reports/tests/${name}`);
  run(['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--target', 'ES2022', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--allowImportingTsExtensions', '--resolveJsonModule', ...tests]);
  run(['--test', '--test-timeout=120000', ...tests]);
} else if (process.argv[2] !== 'build') throw new Error('Usage: node scripts/reports.mjs build|test');
