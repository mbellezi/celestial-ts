import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { celestial } from '../../wasm/tests/runtime.ts';
import {
  createReportGenerator, renderReportHTML, renderReportMarkdown,
  renderCompactReportHTML, renderCompactReportMarkdown,
  renderAstroReportHTML, renderAstroReportMarkdown,
} from '../../pkg/reports/index.js';

interface XmlEvents { opentag: { name: string; attributes: Record<string, string> }; text: string; closetag: unknown }
interface XmlParser {
  on<K extends keyof XmlEvents>(name: K, listener: (event: XmlEvents[K]) => void): XmlParser;
  write(source: string): XmlParser;
  close(): XmlParser;
}
// Saxes 6 declarations fail TS 5.9 strict checks; use a narrow test-only adapter.
const { SaxesParser } = createRequire(import.meta.url)('saxes') as {
  SaxesParser: new (options: { xmlns: false }) => XmlParser;
};

const input = { start: '2026-02-17', end: '2026-02-17', timeZone: 'America/Sao_Paulo' };
function inspectHTML(html: string) {
  const nodes: { name: string; text: string }[] = [], stack: typeof nodes = [];
  const parser = new SaxesParser({ xmlns: false });
  parser.on('opentag', tag => {
    assert.ok(['article', 'section', 'h1', 'h2', 'h3', 'h4', 'p'].includes(tag.name), tag.name);
    if (!stack.length) { assert.equal(tag.name, 'article'); assert.equal(tag.attributes.lang, 'pt-BR'); }
    const node = { name: tag.name, text: '' }; nodes.push(node); stack.push(node);
  });
  parser.on('text', text => { for (const node of stack) node.text += text; });
  parser.on('closetag', () => { stack.pop(); });
  parser.write(html).close();
  assert.equal(nodes.filter(n => n.name === 'article').length, 1);
  assert.equal(nodes.filter(n => n.name === 'h1').length, 1);
  return nodes;
}

test('all six public markup renderers agree with generator methods and preserve structured input', () => {
  const generator = createReportGenerator(celestial);
  const full = generator.report(input), compact = generator.reportCompact(input), astro = generator.reportAstro(input);
  const before = JSON.stringify([full, compact, astro]);
  const cases = [
    [renderReportHTML(full), generator.reportHTML(input)],
    [renderReportMarkdown(full), generator.reportMarkdown(input)],
    [renderCompactReportHTML(compact), generator.reportCompactHTML(input)],
    [renderCompactReportMarkdown(compact), generator.reportCompactMarkdown(input)],
    [renderAstroReportHTML(astro), generator.reportAstroHTML(input)],
    [renderAstroReportMarkdown(astro), generator.reportAstroMarkdown(input)],
  ];
  for (const [standalone, generated] of cases) assert.equal(standalone, generated);
  for (const [html] of [cases[0], cases[2], cases[4]]) inspectHTML(html);
  assert.equal(JSON.stringify([full, compact, astro]), before);
  assert.match(cases[0][0], /Cronologia dos eventos/);
  for (const label of ['Panorama', 'Destaques', 'Áreas da vida', 'Sobre esta leitura']) assert.ok(cases[2][0].includes(label));
  for (const label of ['Panorama', 'O MOMENTO ATUAL', 'Sobre esta leitura']) assert.ok(cases[4][0].includes(label));
  assert.match(cases[1][0], /^# /);
  assert.match(cases[1][0], /^## Cronologia dos eventos$/m);
  assert.match(cases[1][0], /^### /m);
  assert.match(cases[1][0], /^#### /m);
});

test('full domain headings are explicit, canonical, and omitted for zero requested domains', () => {
  const full = createReportGenerator(celestial).report(input);
  const html = renderReportHTML(full, { domains: ['work', 'health'] });
  assert.equal(html, renderReportHTML(full, { domains: ['health', 'work'] }));
  assert.equal(inspectHTML(html).filter(n => n.name === 'h4').length, full.entries.length * 2);
  assert.equal(inspectHTML(renderReportHTML(full)).filter(n => n.name === 'h4').length, full.entries.length);
  assert.equal(inspectHTML(renderReportHTML(full, { domains: [] })).filter(n => n.name === 'h4').length, 0);
  assert.doesNotMatch(renderReportMarkdown(full, { domains: [] }), /^#### /m);
  assert.throws(() => renderReportHTML(full, { domains: ['wrong'] as never }));
});

test('custom text is inert in HTML and Markdown, including multiline headings and links', () => {
  const generator = createReportGenerator(celestial);
  const full = generator.report(input), compact = generator.reportCompact(input), astro = generator.reportAstro(input);
  const hostile = '<script title="x" data-x=\'y\'>&evil</script>\n\n# forged\n[click](javascript:evil) ![image](x)';
  const interpretation = full.interpretations[full.entries[0].interpretationKey];
  interpretation.title = hostile; interpretation.general = hostile;
  compact.overview = hostile; compact.highlights[0].title = hostile; compact.highlights[0].text = hostile;
  compact.highlights[0].timing = hostile; compact.disclaimer = hostile;
  astro.title = hostile; astro.overview = hostile; astro.passages[0].paragraphs = [hostile]; astro.disclaimer = hostile;
  for (const html of [renderReportHTML(full), renderCompactReportHTML(compact), renderAstroReportHTML(astro)]) {
    const nodes = inspectHTML(html);
    assert.ok(nodes.some(n => n.text.includes('<script title="x" data-x=\'y\'>&evil</script>')));
    assert.doesNotMatch(html, /<script/);
    assert.ok(html.includes('&amp;evil'));
    assert.ok(html.includes('&quot;x&quot;'));
    assert.match(html, /(?:&#39;|&#x27;|&apos;)y(?:&#39;|&#x27;|&apos;)/);
  }
  for (const markdown of [renderReportMarkdown(full), renderCompactReportMarkdown(compact), renderAstroReportMarkdown(astro)]) {
    assert.ok(markdown.includes('\\<script title="x" data-x=\'y\'\\>\\&evil\\</script\\>'));
    assert.doesNotMatch(markdown, /^# forged$|(?<!\\)<script|(?<!\\)\[click\]/m);
    assert.ok(markdown.includes('\\# forged'));
  }
});

test('Markdown keeps ordinary prose readable while neutralizing block markers and entities', () => {
  const astro = createReportGenerator(celestial).reportAstro(input);
  astro.passages = [{ ...astro.passages[0], paragraphs: [
    'Uma pausa, às 10:30, permite refletir.', '1. Primeiro item', '- item', '---', '```html', '&lt;literal&gt;', '**ênfase literal**',
  ] }];
  const markdown = renderAstroReportMarkdown(astro);
  assert.ok(markdown.includes('Uma pausa, às 10:30, permite refletir.'));
  for (const literal of ['1\\. Primeiro item', '\\- item', '\\---', '\\`\\`\\`html', '\\&lt;literal\\&gt;', '\\*\\*ênfase literal\\*\\*']) {
    assert.ok(markdown.includes(literal), literal);
  }
});

test('rendered format caches isolate text, HTML and Markdown, canonicalize options, and clear together', () => {
  const generator = createReportGenerator(celestial, { cacheSize: 2 });
  const options = { domains: ['health', 'work'] as const };
  const text = generator.reportText(input, options), html = generator.reportHTML(input, options), markdown = generator.reportMarkdown(input, options);
  assert.notEqual(text, html); assert.notEqual(text, markdown); assert.notEqual(html, markdown);
  const hits = generator.cacheStats.rendered.hits;
  assert.equal(generator.reportHTML(input, { domains: ['work', 'health'] }), html);
  assert.equal(generator.cacheStats.rendered.hits, hits + 1);
  assert.ok(generator.cacheStats.rendered.size <= 2);
  for (const [method, cache] of [
    ['reportCompact', 'compactRendered'], ['reportAstro', 'astroRendered'],
  ] as const) {
    const html = generator[`${method}HTML`](input), markdown = generator[`${method}Markdown`](input);
    assert.notEqual(html, markdown);
    const hits = generator.cacheStats[cache].hits;
    assert.equal(generator[`${method}HTML`](input), html);
    assert.equal(generator.cacheStats[cache].hits, hits + 1);
    assert.ok(generator.cacheStats[cache].size <= 2);
  }
  generator.clearCache();
  for (const cache of ['rendered', 'compactRendered', 'astroRendered'] as const) assert.equal(generator.cacheStats[cache].size, 0);
});

test('empty structures render valid HTML and keep narrative sections', () => {
  const generator = createReportGenerator(celestial);
  const full = generator.report(input), compact = generator.reportCompact(input), astro = generator.reportAstro(input);
  full.entries = []; compact.highlights = []; compact.domains = []; astro.passages = [];
  for (const html of [renderReportHTML(full), renderCompactReportHTML(compact), renderAstroReportHTML(astro)]) {
    inspectHTML(html); assert.doesNotMatch(html, /undefined|NaN/);
  }
  assert.match(renderReportMarkdown(full), /^## Cronologia dos eventos$/m);
  assert.match(renderCompactReportMarkdown(compact), /^## Destaques$/m);
  assert.match(renderAstroReportMarkdown(astro), /^## O MOMENTO ATUAL$/m);
});

test('HTML preserves the same chronology and local DST facts as plain text', () => {
  const generator = createReportGenerator(celestial);
  const request = { start: '2026-03-29', end: '2026-03-29', timeZone: 'Europe/London' };
  const full = generator.report(request);
  assert.equal(Date.parse(full.range.endExclusive) - Date.parse(full.range.start), 23 * 3_600_000);
  const paragraphs = inspectHTML(renderReportHTML(full)).filter(n => n.name === 'p').map(n => n.text);
  const plain = generator.reportText(request);
  for (const paragraph of plain.split(/\n\n/).filter(Boolean)) assert.ok(paragraphs.includes(paragraph), paragraph);
});

test('compact highlight evidence and astro passage paragraphs retain their supplied order', () => {
  const generator = createReportGenerator(celestial);
  const compact = generator.reportCompact(input), astro = generator.reportAstro(input);
  compact.highlights = compact.highlights.slice(0, 1).flatMap(highlight => [
    { ...highlight, title: 'Primeiro destaque', timing: 'Primeira evidência', text: 'Primeira leitura' },
    { ...highlight, title: 'Segundo destaque', timing: 'Segunda evidência', text: 'Segunda leitura' },
  ]);
  astro.passages = [{ ...astro.passages[0], paragraphs: ['Primeiro parágrafo', 'Segundo parágrafo'] }];
  for (const output of [renderCompactReportHTML(compact), renderCompactReportMarkdown(compact)]) {
    const markers = ['Primeiro destaque', 'Primeira evidência', 'Primeira leitura', 'Segundo destaque', 'Segunda evidência', 'Segunda leitura'];
    const positions = markers.map(marker => output.indexOf(marker));
    assert.ok(positions.every(position => position >= 0));
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  }
  const paragraphs = inspectHTML(renderAstroReportHTML(astro)).filter(n => n.name === 'p').map(n => n.text);
  assert.ok(paragraphs.indexOf('Primeiro parágrafo') < paragraphs.indexOf('Segundo parágrafo'));
  assert.ok(renderAstroReportMarkdown(astro).includes('Primeiro parágrafo\n\nSegundo parágrafo'));
});
