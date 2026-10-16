import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { celestial } from '../../wasm/tests/runtime.ts';
import { createNatalReportGenerator, renderNatalReportJSON, renderNatalReportText,
  renderNatalReportMarkdown, renderNatalReportHTML, NATAL_BODIES, NATAL_ASPECT_ANGLES } from '../../pkg/reports/index.js';

const input = { instant: '1972-05-28T04:00:00Z', name: 'Pessoa Exemplo', timeZone: 'America/Sao_Paulo',
  location: { label: 'Ribeirão Preto', latitude: -21 - 10 / 60, longitude: -47 - 48 / 60 } };

interface XmlTag { name: string; attributes: Record<string, string> }
interface XmlParser {
  on(event: 'opentag' | 'closetag', callback: (tag: XmlTag) => void): XmlParser;
  on(event: 'text', callback: (text: string) => void): XmlParser;
  write(source: string): XmlParser;
  close(): XmlParser;
}
// Same narrow adapter as markup.test.ts: Saxes 6's declarations fail TS 5.9 strict checks.
const { SaxesParser } = createRequire(import.meta.url)('saxes') as {
  SaxesParser: new (options: { fragment: true }) => XmlParser;
};

function htmlBlocks(html: string): string[] {
  const blocks: string[] = [], parser = new SaxesParser({ fragment: true });
  let capture = '', text = '', rows: string[][] = [], cells: string[] = [];
  parser.on('opentag', tag => {
    assert.ok(/^(?:article|h[1-4]|p|table|thead|tbody|tr|th|td)$/u.test(tag.name), tag.name);
    for (const attribute of Object.keys(tag.attributes)) {
      assert.ok((tag.name === 'article' && attribute === 'lang') || (tag.name === 'th' && attribute === 'scope'));
    }
    if (/^(?:h[1-4]|p|th|td)$/u.test(tag.name)) { capture = tag.name; text = ''; }
    if (tag.name === 'table') rows = [];
    if (tag.name === 'tr') cells = [];
  });
  parser.on('text', value => { if (capture) text += value; });
  parser.on('closetag', tag => {
    if (tag.name === capture) {
      if (capture === 'td' || capture === 'th') cells.push(text); else blocks.push(text);
      capture = ''; text = '';
    }
    if (tag.name === 'tr') rows.push(cells);
    if (tag.name === 'table') blocks.push(rows.map(row => row.join(' | ')).join('\n'));
  });
  parser.write(html).close();
  return blocks;
}

function markdownBlocks(value: string): string[] {
  return value.split('\n\n').map(block => {
    if (block.startsWith('| ') && block.includes('\n| ---')) {
      return block.split('\n').filter((_, i) => i !== 1)
        .map(row => row.slice(2, -2).replace(/\\(.)/gu, '$1')).join('\n');
    }
    return block.replace(/^#{1,4} /u, '').replace(/\\(.)/gu, '$1');
  });
}

test('all natal presentation blocks preserve content, order and multiplicity from one canonical object', () => {
  const report = createNatalReportGenerator(celestial).report(input);
  // Literal user content must remain text, even where it resembles markup.
  report.name = 'Pessoa <script>alert(1)</script> & **nome** [link](javascript:void(0))';
  report.chart.location.label = 'Cidade <img src=x onerror=alert(1)> | *local*';
  const snapshot = JSON.stringify(report);
  assert.deepEqual(JSON.parse(renderNatalReportJSON(report)), report);
  for (const perspectives of [undefined, ['personal'] as const, ['professional'] as const, []] as const) {
    const options = perspectives === undefined ? {} : { perspectives };
    const text = renderNatalReportText(report, options);
    const html = renderNatalReportHTML(report, options);
    const markdown = renderNatalReportMarkdown(report, options);
    assert.deepEqual(htmlBlocks(html), text.split('\n\n'));
    assert.deepEqual(markdownBlocks(markdown), text.split('\n\n'));
    assert.doesNotMatch(html, /<(?:script|img|style|iframe)\b/iu);
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(markdown.includes('\\<script\\>'));
  }
  assert.equal(JSON.stringify(report), snapshot);
  assert.throws(() => renderNatalReportText(report, { perspectives: ['personal', 'personal'] }));
  assert.throws(() => renderNatalReportHTML(report, { perspectives: ['unknown'] } as never));
  assert.throws(() => renderNatalReportText(report, { perspectives: new Array(1) }));
});

test('exported natal defaults cannot be mutated by JavaScript consumers', () => {
  assert.ok(Object.isFrozen(NATAL_BODIES)); assert.ok(Object.isFrozen(NATAL_ASPECT_ANGLES));
  assert.equal(Reflect.set(NATAL_BODIES, '0', 'pluto'), false);
  assert.deepEqual(NATAL_BODIES.slice(0, 2), ['sun', 'moon']);
  assert.equal(NATAL_ASPECT_ANGLES.length, 9);
});

test('a cloned natal report renders all four formats in a worker without initializing WASM', async () => {
  const report = createNatalReportGenerator(celestial).report(input);
  const module = new URL('../../pkg/reports/index.js', import.meta.url).href;
  const worker = new Worker(`const { parentPort, workerData } = require('node:worker_threads');
    import(workerData.module).then(r => parentPort.postMessage({
      json: r.renderNatalReportJSON(workerData.report), text: r.renderNatalReportText(workerData.report),
      markdown: r.renderNatalReportMarkdown(workerData.report), html: r.renderNatalReportHTML(workerData.report),
    }));`, { eval: true, workerData: { module, report } });
  try {
    const [result] = await once(worker, 'message');
    assert.equal(result.json, renderNatalReportJSON(report));
    assert.equal(result.text, renderNatalReportText(report));
    assert.equal(result.markdown, renderNatalReportMarkdown(report));
    assert.equal(result.html, renderNatalReportHTML(report));
  } finally { await worker.terminate(); }
  const built = readFileSync(new URL('../../pkg/reports/natal.js', import.meta.url), 'utf8');
  assert.ok(built.includes('../charts/index.js'));
  assert.doesNotMatch(built, /\.\.\/\.\.\/pkg\//u);
});
