import { spawnSync } from 'node:child_process';
import { readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../', import.meta.url));
const compiler = 'node_modules/typescript/bin/tsc';
const action = process.argv[2] ?? 'test';

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: directory, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!['build', 'test'].includes(action)) throw new Error('Usage: node scripts/locations.mjs build|test');
await rm(`${directory}/pkg/locations`, { recursive: true, force: true });
run([compiler, '-p', 'locations/tsconfig.json']);

if (action === 'test') {
  const tests = (await readdir(`${directory}/locations/tests`))
    .filter(name => name.endsWith('.test.ts')).map(name => `locations/tests/${name}`);
  run([compiler, '--noEmit', '--strict', '--target', 'ES2022', '--module', 'nodenext',
    '--moduleResolution', 'nodenext', '--allowImportingTsExtensions', ...tests]);
  run(['--test', '--test-timeout=60000', ...tests]);
}
