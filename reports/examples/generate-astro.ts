import { readFile, writeFile } from 'node:fs/promises';
import init, * as core from '../../pkg/celestial_wasm.js';
import { createReportGenerator } from '../../pkg/reports/index.js';

await init({ module_or_path: await readFile(new URL('../../pkg/celestial_wasm_bg.wasm', import.meta.url)) });
const generator = createReportGenerator(core);

for (const [name, start, end] of [
  ['october-2026', '2026-10-01', '2026-10-31'],
  ['2026-10-16', '2026-10-16', '2026-10-16'],
]) {
  const input = { start, end, timeZone: 'America/Sao_Paulo' };
  const began = performance.now();
  const report = generator.reportAstro(input);
  const coldMs = performance.now() - began;
  const repeated = performance.now();
  generator.reportAstro(input);
  const cachedMs = performance.now() - repeated;
  const text = generator.reportAstroText(input);

  await writeFile(new URL(`./${name}-astro.json`, import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(new URL(`./${name}-astro.txt`, import.meta.url), `${text}\n`);
  console.log(JSON.stringify({
    name,
    coldMs,
    cachedMs,
    words: text.split(/\s+/u).filter(Boolean).length,
    selection: report.selection,
    cacheStats: generator.cacheStats,
  }));
}
