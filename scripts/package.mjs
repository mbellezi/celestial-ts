import { spawnSync } from 'node:child_process';
import { copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../', import.meta.url));
const shrinkwrap = new URL('../npm-shrinkwrap.json', import.meta.url);

if (process.argv[2] === 'clean') {
  await rm(shrinkwrap, { force: true });
} else {
  const result = spawnSync(process.execPath, ['scripts/wasm.mjs', 'build'], { cwd: directory, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  const docs = spawnSync(process.execPath, ['scripts/docs.mjs', '--check'], { cwd: directory, stdio: 'inherit' });
  if (docs.error) throw docs.error;
  if (docs.status !== 0) process.exit(docs.status ?? 1);
  const licenses = spawnSync(process.execPath, ['scripts/licenses.mjs', '--check'], { cwd: directory, stdio: 'inherit' });
  if (licenses.error) throw licenses.error;
  if (licenses.status !== 0) process.exit(licenses.status ?? 1);
  // npm omits package-lock.json from archives; ship the identical lock in its supported distribution format.
  await copyFile(new URL('../package-lock.json', import.meta.url), shrinkwrap);
}
