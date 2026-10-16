import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const moduleUrl = process.env.CELESTIAL_WASM_TEST_MODULE
  ? pathToFileURL(resolve(process.env.CELESTIAL_WASM_TEST_MODULE))
  : new URL('../../pkg/celestial_wasm.js', import.meta.url);
export const celestial: typeof import('../../pkg/celestial_wasm.js') = await import(moduleUrl.href);
await celestial.default({
  module_or_path: Uint8Array.from(readFileSync(new URL('celestial_wasm_bg.wasm', moduleUrl))),
});
