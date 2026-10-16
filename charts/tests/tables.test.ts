import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { celestial } from '../../wasm/tests/runtime.ts';
import { createChartCalculator, DEFAULT_BODIES } from '../src/calculate.ts';
import { renderGlyph } from '../src/glyphs.ts';
import { getMessages } from '../src/locales.ts';
import { renderAspectMatrix, renderAspectsTable, renderHousesTable, renderPositionsTable } from '../src/tables.ts';
import { getTheme, THEMES } from '../src/themes.ts';
import { svgDocument } from '../src/svg.ts';
import type { ChartData } from '../src/types.ts';

const calculator = createChartCalculator(celestial);
const natal = calculator.natal({ instant: '2000-01-01T12:00:00Z', location: { latitude: 48.85, longitude: 2.35 } });
const planetary = calculator.planetary({ instant: '2000-01-01T12:00:00Z' });
const theme = getTheme('editorial');
const extended = calculator.planetary({ instant: '2000-01-01T12:00:00Z', bodies: [...DEFAULT_BODIES, 'trueNode', 'chiron'] });
const single = calculator.planetary({ instant: '2000-01-01T12:00:00Z', bodies: ['sun'] });
const renderers = [renderPositionsTable, renderHousesTable, renderAspectMatrix, renderAspectsTable] as const;

function count(source: string, value: string): number {
  return source.split(value).length - 1;
}

function assertMatrixHeaderGeometry(svg: string, bodyCount: number, width: number): void {
  const pattern = /<g data-matrix-header="true">[\s\S]*?transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)"/g;
  const headers = [...svg.matchAll(pattern)];
  assert.equal(headers.length, bodyCount);
  const cell = (width - 36) / (bodyCount + 1);
  for (const [index, header] of headers.entries()) {
    const [, xText, yText, scaleText] = header;
    const [x, y, scale] = [Number(xText), Number(yText), Number(scaleText)];
    assert.ok(y >= 35 && y + 24 * scale <= 59, `Header ${index} exceeds its band: ${y}..${y + 24 * scale}`);
    assert.ok(Math.abs(y + 12 * scale - 47) < 0.01);
    assert.ok(Math.abs(x + 12 * scale - (18 + (index + 1.5) * cell)) < 0.01);
    assert.ok(Math.abs(24 * scale - Math.min(18, cell * 0.65)) < 0.015);
  }
  const cells = [...svg.matchAll(/<rect data-matrix-cell="true" x="[-\d.]+" y="([-\d.]+)"/g)];
  assert.equal(cells.length, bodyCount * (bodyCount + 1) / 2);
  assert.equal(Number(cells[0]![1]), 62);
  assert.ok(cells.every(cell => Number(cell[1]) >= 62));
}

test('all planetary, zodiac and major aspect glyphs are original vector shapes', () => {
  for (const id of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15]) {
    const svg = renderGlyph('body', id, 20, 20, 24, '#123456');
    assert.match(svg, /<(path|circle)\b/);
    assert.doesNotMatch(svg, /<(text|image|foreignObject)\b/);
  }
  for (let sign = 0; sign < 12; sign++) assert.match(renderGlyph('sign', sign, 0, 0, 20, '#123'), /<(path|circle)\b/);
  for (const angle of [0, 60, 90, 120, 180]) assert.match(renderGlyph('aspect', angle, 0, 0, 20, '#123'), /<(path|circle)\b/);
  assert.equal(renderGlyph('body', 'sun', 0, 0, 24, '#123'), renderGlyph('body', 0, 0, 0, 24, '#123'));
  assert.equal(renderGlyph('sign', 'aries', 0, 0, 24, '#123'), renderGlyph('sign', 0, 0, 0, 24, '#123'));
  assert.equal(renderGlyph('aspect', 'trine', 0, 0, 24, '#123'), renderGlyph('aspect', 120, 0, 0, 24, '#123'));
});

test('glyphs escape attributes and reject invalid geometry or unsupported symbols', () => {
  const svg = renderGlyph('body', 0, 20, 30, 24, 'red" onload="alert(1)');
  assert.match(svg, /&quot;/);
  assert.doesNotMatch(svg, /\sonload="/);
  assert.match(svg, /translate\(8 18\) scale\(1\)/);
  assert.throws(() => renderGlyph('body', 999, 0, 0, 24, '#123'), RangeError);
  assert.throws(() => renderGlyph('sign', 0, Infinity, 0, 24, '#123'), RangeError);
  assert.throws(() => renderGlyph('aspect', 60, 0, 0, 0, '#123'), RangeError);
});

test('positions preserve calculated signs, arcseconds, houses and retrograde markers', () => {
  const table = renderPositionsTable(natal, { theme, x: 12, y: 34, width: 360 });
  assert.match(table.svg, /translate\(12 34\)/);
  assert.match(table.svg, /10°22′32″/);
  assert.match(table.svg, /13°19′25″/);
  assert.match(table.svg, /Capricórnio/);
  assert.equal(count(table.svg, 'data-glyph="body:'), natal.bodies.length);
  assert.equal(count(table.svg, 'data-glyph="sign:'), natal.bodies.length);
  assert.equal(count(table.svg, '>R</text>'), 1 + natal.bodies.filter(body => body.retrograde).length);
  assert.equal(table.height, 62 + natal.bodies.length * 28 + 12);
  assert.equal(table.width, 360);
});

test('planetary positions omit house columns and do not invent house cusps', () => {
  const table = renderPositionsTable(planetary, { theme, locale: 'en' });
  assert.match(table.svg, />Positions</);
  assert.doesNotMatch(table.svg, />House</);
  assert.equal(renderHousesTable(planetary, { theme }).height, 0);
  assert.doesNotMatch(renderHousesTable(planetary, { theme }).svg, /<text|<rect/);
});

test('house tables show twelve real cusps and keep both locale dictionaries', () => {
  for (const locale of ['pt-BR', 'en'] as const) {
    const table = renderHousesTable(natal, { theme, locale });
    const messages = getMessages(locale);
    assert.match(table.svg, new RegExp(`>${messages.labels.houses}<`));
    assert.equal(count(table.svg, 'data-glyph="sign:'), 12);
    assert.match(table.svg, />12</);
    assert.equal(table.height, 410);
  }
});

test('aspect matrix and list use every actual aspect and include complete symbol legends', () => {
  const matrix = renderAspectMatrix(natal, { theme });
  const table = renderAspectsTable(natal, { theme });
  assert.equal(count(matrix.svg, 'data-glyph="aspect:'), natal.aspects.length + 5);
  assert.equal(count(table.svg, 'data-glyph="aspect:'), natal.aspects.length + 5);
  assert.equal(count(table.svg, 'data-glyph="body:'), natal.aspects.length * 2);
  for (const name of Object.values(getMessages().aspects)) {
    assert.ok(matrix.svg.includes(name));
    assert.ok(table.svg.includes(name));
  }
  assert.ok(table.svg.includes(getMessages().labels.applying));
  assert.ok(table.svg.includes(getMessages().labels.separating));
});

test('matrix header glyph bounds stay inside their band for all sizes, counts and themes', () => {
  for (const definition of THEMES) {
    for (const colors of ['light', 'dark'] as const) {
      for (const width of [300, 360, 430]) {
        for (const data of [single, planetary, extended]) {
          const matrix = renderAspectMatrix(data, { theme: definition.id, colors, width });
          assertMatrixHeaderGeometry(matrix.svg, data.bodies.length, width);
          const cell = (width - 36) / (data.bodies.length + 1);
          assert.equal(matrix.height, 62 + data.bodies.length * cell + 74);
        }
      }
    }
  }
});

test('table defaults, theme ids and resolved themes use the selected color palette', () => {
  for (const render of renderers) {
    assert.equal(render(natal).svg, render(natal, { theme: 'editorial', colors: 'light' }).svg);
    const dark = getTheme('prism', 'dark');
    assert.equal(render(natal, { theme: dark }).svg, render(natal, { theme: 'prism', colors: 'dark' }).svg);
    const custom = { ...dark.colors, surface: 'transparent', accent: '#123456' };
    const result = render(natal, { theme: 'atlas', colors: custom });
    assert.match(result.svg, /fill="transparent"/);
    assert.match(result.svg, /#123456/);
    assert.doesNotMatch(result.svg, /<svg/);
  }
});

test('empty aspect selections keep meaningful localized states without fabricated rows', () => {
  const empty: ChartData = { ...natal, aspects: [] };
  const table = renderAspectsTable(empty, { theme, locale: 'en' });
  assert.ok(table.svg.includes(getMessages('en').labels.noAspects));
  assert.equal(count(table.svg, 'data-glyph="body:'), 0);
  assert.equal(count(table.svg, 'data-glyph="aspect:'), 5);
  assert.throws(() => renderPositionsTable(natal, { theme, width: 0 }), RangeError);
  assert.throws(() => renderAspectMatrix(natal, { theme, x: Infinity }), RangeError);
});

test('all six themed table sets rasterize as visible, portable SVG documents', async () => {
  for (const definition of THEMES) {
    const currentTheme = getTheme(definition.id);
    for (const render of renderers) {
      const fragment = render(natal, { theme: currentTheme, width: 360, locale: 'pt-BR' });
      const svg = svgDocument(fragment.svg, fragment.width, fragment.height, {
        title: getMessages().labels.natal, description: getMessages().labels.positions,
        font: currentTheme.font, idPrefix: 'table-test',
      });
      const image = await sharp(Buffer.from(svg)).png().toBuffer({ resolveWithObject: true });
      assert.equal(image.info.width, fragment.width);
      assert.equal(image.info.height, Math.round(fragment.height));
      const statistics = await sharp(image.data).stats();
      assert.ok(statistics.channels.some(channel => channel.stdev > 5));
    }
  }
});
