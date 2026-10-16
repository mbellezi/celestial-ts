import { readFile, writeFile } from 'node:fs/promises';
import init, * as core from '../../pkg/celestial_wasm.js';
import { createReportGenerator } from '../../pkg/reports/index.js';
await init({ module_or_path: await readFile(new URL('../../pkg/celestial_wasm_bg.wasm', import.meta.url)) });
const generator = createReportGenerator(core);
for (const [name, start, end] of [['february-2026','2026-02-01','2026-02-28'],['2026-02-17','2026-02-17','2026-02-17']]) {
  const input = {start,end,timeZone:'America/Sao_Paulo'};
  const began = performance.now();
  const report = generator.reportCompact(input);
  const coldMs = performance.now()-began;
  const repeated = performance.now();
  generator.reportCompact(input);
  const cachedMs = performance.now()-repeated;
  const text = generator.reportCompactText(input);
  await writeFile(new URL(`./${name}-compact.json`,import.meta.url),`${JSON.stringify(report,null,2)}\n`);
  await writeFile(new URL(`./${name}-compact.txt`,import.meta.url),`${text}\n`);
  console.log(JSON.stringify({name,coldMs,cachedMs,words:text.split(/\s+/u).filter(Boolean).length,selection:report.selection,cacheStats:generator.cacheStats}));
}
