import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as celestial from '../../pkg/celestial_wasm.js';
import { createNatalReportGenerator, getNatalCatalogInfo, renderNatalReportJSON,
  renderNatalReportText, renderNatalReportMarkdown, renderNatalReportHTML } from '../../pkg/reports/index.js';

await celestial.default({ module_or_path: await readFile(new URL('../../pkg/celestial_wasm_bg.wasm', import.meta.url)) });
const generator = createNatalReportGenerator(celestial);
// Birth data transcribed from the user-supplied reference PDF. The engine
// computes the positions; no PDF longitude or interpretation is substituted.
const input = {
  name: 'Pessoa Exemplo', date: '1972-05-28', time: '01:00:00', timeZone: 'America/Sao_Paulo',
  location: { label: 'Ribeirão Preto, SP, Brasil', latitude: -(21 + 10 / 60), longitude: -(47 + 48 / 60) },
} as const;
const started = performance.now();
const report = generator.report(input);
const calculationMs = performance.now() - started;
// Exactly one calculated object supplies all four presentations.
const outputs = {
  json: renderNatalReportJSON(report, 2),
  txt: renderNatalReportText(report),
  md: renderNatalReportMarkdown(report),
  html: renderNatalReportHTML(report),
};
for (const [extension, content] of Object.entries(outputs)) {
  const target = new URL(`./natal-1972.${extension}`, import.meta.url);
  await writeFile(target, `${content}\n`);
  console.log(fileURLToPath(target));
}
const before = performance.now();
generator.report(input);
console.log(JSON.stringify({ calculationMs, cachedMs: performance.now() - before,
  readings: report.readings.length, aspects: report.aspects.length,
  words: outputs.txt.split(/\s+/u).length, catalog: getNatalCatalogInfo(), cache: generator.cacheStats }, null, 2));
