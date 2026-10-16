import { readFile, writeFile } from 'node:fs/promises';
import {
  renderReportHTML,
  renderReportMarkdown,
  renderCompactReportHTML,
  renderCompactReportMarkdown,
  renderAstroReportHTML,
  renderAstroReportMarkdown,
  type AstrologyReport,
  type CompactAstrologyReport,
  type AstroReport,
} from '../../pkg/reports/index.js';

// Reaproveita os objetos dos exemplos, sem inicializar ou consultar o núcleo WASM.
const full = JSON.parse(await readFile(new URL('./february-2026.json', import.meta.url), 'utf8')) as AstrologyReport;
const compact = JSON.parse(await readFile(new URL('./february-2026-compact.json', import.meta.url), 'utf8')) as CompactAstrologyReport;
const astro = JSON.parse(await readFile(new URL('./october-2026-astro.json', import.meta.url), 'utf8')) as AstroReport;

const outputs = [
  ['february-2026.html', renderReportHTML(full)],
  ['february-2026.md', renderReportMarkdown(full)],
  ['february-2026-compact.html', renderCompactReportHTML(compact)],
  ['february-2026-compact.md', renderCompactReportMarkdown(compact)],
  ['october-2026-astro.html', renderAstroReportHTML(astro)],
  ['october-2026-astro.md', renderAstroReportMarkdown(astro)],
] as const;

for (const [name, content] of outputs) {
  await writeFile(new URL(`./${name}`, import.meta.url), `${content}\n`);
  console.log(JSON.stringify({ file: name, characters: content.length }));
}
