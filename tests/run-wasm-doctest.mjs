#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { appendFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const supportedImports = new Set([
  '__wbindgen_placeholder__',
  '__wbindgen_externref_xform__',
]);

function validateExecutable(input) {
  const module = new WebAssembly.Module(readFileSync(input));
  const main = WebAssembly.Module.exports(module).find((entry) => entry.name === 'main');
  if (main?.kind !== 'function') throw new Error('Rust doctest has no main function');
  for (const entry of WebAssembly.Module.imports(module)) {
    if (!supportedImports.has(entry.module)) {
      throw new Error(`Unsupported doctest import: ${entry.module}.${entry.name}`);
    }
  }
}

function executeDoctest(input, directory) {
  execFileSync('wasm-bindgen', [
    input,
    '--target', 'nodejs',
    '--keep-lld-exports',
    '--no-typescript',
    '--out-dir', directory,
    '--out-name', 'doctest',
  ], { stdio: 'inherit' });
  const glue = join(directory, 'doctest.js');
  // wasm-bindgen does not expose rustdoc's plain main through its JS API.
  appendFileSync(glue, '\nmodule.exports.__doctest_main = wasm.main;\n');
  const { __doctest_main: main } = require(glue);
  if (typeof main !== 'function') throw new Error('wasm-bindgen removed doctest main');
  const exitCode = main(0, 0);
  if (exitCode !== 0) throw new Error(`Doctest main returned ${exitCode}`);
}

if (process.argv.length !== 3) throw new Error('Expected exactly one Rust doctest WASM path');
validateExecutable(process.argv[2]);
const directory = mkdtempSync(join(tmpdir(), 'celestial-doctest-'));
try {
  executeDoctest(process.argv[2], directory);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
