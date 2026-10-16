import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import sharp from 'sharp';
import { celestial } from '../../wasm/tests/runtime.ts';
import {
  createChartCalculator, renderChartBundle, renderChartSvg, renderTablesSvg,
  renderWheelSvg, THEMES, getTheme,
} from '../../pkg/charts/index.js';
import { layoutPlanetLabels, normalizeAngle, pointAt } from '../../pkg/charts/geometry.js';
import type { ChartData, ThemeId } from '../../pkg/charts/index.js';

interface XmlNode { name: string; attributes: Record<string, string>; text: string; children: XmlNode[] }
interface Box { left: number; top: number; right: number; bottom: number }
interface XmlEvents { opentag: Pick<XmlNode, 'name' | 'attributes'>; text: string; closetag: unknown }
interface XmlParser {
  on<K extends keyof XmlEvents>(name: K, listener: (event: XmlEvents[K]) => void): XmlParser;
  write(source: string): XmlParser;
  close(): XmlParser;
}
// Saxes 6's published generic declarations fail TS 5.9 strict checks; keep this test-only adapter narrow.
const { SaxesParser } = createRequire(import.meta.url)('saxes') as {
  SaxesParser: new (options: { xmlns: false }) => XmlParser;
};

function parse(source: string): XmlNode[] {
  const parser = new SaxesParser({ xmlns: false });
  const nodes: XmlNode[] = [];
  const stack: XmlNode[] = [];
  parser.on('opentag', tag => {
    const node = { name: tag.name, attributes: tag.attributes, text: '', children: [] };
    stack.at(-1)?.children.push(node);
    nodes.push(node);
    stack.push(node);
  });
  parser.on('text', text => { const current = stack.at(-1); if (current) current.text += text; });
  parser.on('closetag', () => { stack.pop(); });
  assert.doesNotThrow(() => parser.write(source).close(), 'Generated SVG must be well formed XML');
  assert.equal(nodes[0]?.name, 'svg');
  assert.equal(nodes[0]?.attributes.xmlns, 'http://www.w3.org/2000/svg');
  return nodes;
}

const calculator = createChartCalculator(celestial);
const input = { date: '2026-10-16', time: '12:00:00', timeZone: 'America/Sao_Paulo',
  location: { latitude: -23.55052, longitude: -46.633308, label: 'São Paulo' } };
const natal = calculator.natal(input);
const planetary = calculator.planetary(input);

function element(nodes: XmlNode[], attribute: string, value?: string): XmlNode {
  const node = nodes.find(node => Object.hasOwn(node.attributes, attribute)
    && (value === undefined || node.attributes[attribute] === value));
  assert.ok(node, `Missing SVG element with ${attribute}=${value ?? '*'}`);
  return node;
}

function assertPortable(source: string): XmlNode[] {
  const nodes = parse(source);
  assert.doesNotMatch(source, /\b(?:NaN|Infinity|undefined)\b/);
  for (const node of nodes) {
    assert.ok(!['image', 'foreignObject', 'script', 'iframe', 'style'].includes(node.name), node.name);
    for (const [name, value] of Object.entries(node.attributes)) {
      assert.ok(!/^on/i.test(name), name);
      if (name === 'href' || name === 'xlink:href') assert.ok(value.startsWith('#'), value);
      assert.doesNotMatch(value, /url\(\s*['"]?(?:https?:|data:|\/\/)/i);
    }
  }
  return nodes;
}

function assertPlanetData(nodes: XmlNode[], data: ChartData): void {
  const planets = nodes.filter(node => Object.hasOwn(node.attributes, 'data-body-id'));
  assert.equal(planets.length, data.bodies.length);
  for (const body of data.bodies) {
    const planet = element(planets, 'data-body-id', String(body.id));
    assert.equal(Number(planet.attributes['data-longitude']), body.longitude);
    assert.ok(Number.isFinite(Number(planet.attributes['data-label-longitude'])));
    assert.ok(Number.isFinite(Number(planet.attributes['data-anchor-x'])));
    assert.ok(Number.isFinite(Number(planet.attributes['data-anchor-y'])));
  }
}

test('the emitted package exports charts with resolvable JavaScript and TypeScript paths', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.exports['./charts'], { types: './pkg/charts/index.d.ts', default: './pkg/charts/index.js' });
  for (const path of Object.values(manifest.exports['./charts']) as string[]) {
    await access(new URL(`../../${path}`, import.meta.url));
  }
  const declaration = await readFile(new URL('../../pkg/charts/calculate.d.ts', import.meta.url), 'utf8');
  assert.ok(declaration.includes('../celestial_wasm.js'));
  assert.ok(!declaration.includes('../../pkg/'));
  const resolve = createRequire(new URL('../../package.json', import.meta.url)).resolve;
  assert.ok(resolve('celestial-wasm/charts').endsWith('/pkg/charts/index.js'));
  assert.equal(manifest.exports['./wasm'], './pkg/celestial_wasm_bg.wasm');
  assert.ok(resolve('celestial-wasm/wasm').endsWith('/pkg/celestial_wasm_bg.wasm'));
});

test('public package names load the real WASM engine and render every chart kind', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { readFile } from 'node:fs/promises';
    import init, * as core from 'celestial-wasm';
    import { createChartCalculator, renderChartBundle, THEMES } from 'celestial-wasm/charts';
    await init({ module_or_path: await readFile(new URL(import.meta.resolve('celestial-wasm/wasm'))) });
    const calculator = createChartCalculator(core);
    const input = { instant: '2026-10-16T00:04:57Z', timeZone: 'America/Sao_Paulo',
      location: { latitude: -23.55052, longitude: -46.633308, label: 'São Paulo' } };
    for (const kind of ['natal', 'planetary']) {
      const data = calculator[kind](input);
      assert.equal(data.bodies.length, 10);
      for (const theme of THEMES) {
        const bundle = renderChartBundle(data, { theme: theme.id });
        assert.match(bundle.chart, /^<svg /);
        assert.equal(typeof bundle.houses, kind === 'natal' ? 'string' : 'undefined');
      }
    }
    console.log('public package integration passed');
  `;
  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)), encoding: 'utf8',
  });
  assert.match(output, /public package integration passed/);
});

test('emitted chart modules import only neighbouring browser and worker compatible modules', async () => {
  const directory = new URL('../../pkg/charts/', import.meta.url);
  for (const name of (await readdir(directory)).filter(name => name.endsWith('.js'))) {
    const source = await readFile(new URL(name, directory), 'utf8');
    const imports = [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map(match => match[1]!);
    assert.ok(imports.every(path => path.startsWith('./')), `${name}: ${imports.join(', ')}`);
    assert.doesNotMatch(source, /\b(?:require|process|Buffer|window)\s*[.(]|\bdocument\s*\./);
  }
});

test('the compiled renderer accepts cloned chart data in an independent worker', async () => {
  const url = new URL('../../pkg/charts/index.js', import.meta.url).href;
  const worker = new Worker(`
    const { parentPort, workerData } = require('node:worker_threads');
    import(workerData.url).then(api => parentPort.postMessage(
      api.renderChartSvg(workerData.data, { theme: 'midnight', locale: 'en' })
    ));
  `, { eval: true, execArgv: [], workerData: { url, data: planetary } });
  try {
    const source = await new Promise<string>((resolve, reject) => {
      worker.once('error', reject);
      worker.once('message', (value: unknown) => {
        if (typeof value !== 'string') reject(new Error('Worker must return SVG text'));
        else resolve(value);
      });
    });
    assert.equal(source, renderChartSvg(planetary, { theme: 'midnight', locale: 'en' }));
    assertPlanetData(assertPortable(source), planetary);
  } finally {
    await worker.terminate();
  }
});

test('real WASM natal and planetary data remain distinct and retain exact core positions', () => {
  assert.equal(natal.instant, '2026-10-16T15:00:00.000Z');
  assert.equal(natal.timeZone, 'America/Sao_Paulo');
  assert.equal(natal.houses?.cusps.length, 13);
  assert.equal(planetary.houses, undefined);
  assert.ok(natal.bodies.every(body => body.house !== undefined));
  assert.ok(planetary.bodies.every(body => body.house === undefined));
  const flags = celestial.constants().FLG_BUILTIN | celestial.constants().FLG_SPEED;
  for (const body of natal.bodies) {
    assert.equal(body.longitude, celestial.normDeg(celestial.calcUt(natal.julianDay, body.id, flags).lon));
    assert.equal(planetary.bodies.find(value => value.id === body.id)?.longitude, body.longitude);
  }
});

test('six themes produce distinct compositions with reproducible, exact planetary SVG data', () => {
  assert.equal(THEMES.length, 6);
  assert.equal(new Set(THEMES.map(theme => theme.id)).size, 6);
  const compositions = new Set<string>();
  for (const theme of THEMES) {
    const options = { theme: theme.id, locale: 'pt-BR' as const, idPrefix: 'render-regression' };
    const source = renderChartSvg(natal, options);
    assert.equal(renderChartSvg(natal, options), source);
    const nodes = assertPortable(source);
    assertPlanetData(nodes, natal);
    const heading = element(nodes, 'data-chart-heading');
    const headingText = heading.name === 'text' ? heading : heading.children.find(node => node.name === 'text');
    assert.equal(headingText?.attributes.fill, getTheme(theme.id).colors.foreground);
    const geometry = nodes.filter(node => ['g', 'svg'].includes(node.name))
      .map(node => [node.name, node.attributes.transform, node.attributes.viewBox]);
    compositions.add(JSON.stringify(geometry));
  }
  assert.equal(compositions.size, 6, 'Styles must change the arrangement, not only colors');
});

function textBox(node: XmlNode): Box {
  const x = Number(node.attributes.x);
  const y = Number(node.attributes.y);
  const size = Number(node.attributes['font-size']);
  const spacing = Number(node.attributes['letter-spacing'] ?? 0);
  // Numeric labels and axis names fit comfortably inside 0.75 em per character.
  const width = node.text.length * size * 0.75 + Math.max(0, node.text.length - 1) * spacing;
  assert.ok([x, y, size, width].every(Number.isFinite));
  const anchor = node.attributes['text-anchor'];
  const left = x - (anchor === 'middle' ? width / 2 : anchor === 'end' ? width : 0);
  return { left: left - 0.5, right: left + width + 0.5, top: y - size - 0.5, bottom: y + size * 0.3 + 0.5 };
}

function glyphBox(node: XmlNode): Box {
  const match = /^translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)$/.exec(node.attributes.transform ?? '');
  assert.ok(match, 'Planet glyph must expose its vector translation and scale');
  const [, tx, ty, scale] = match.map(Number);
  assert.ok([tx, ty, scale].every(Number.isFinite));
  const padding = Number(node.attributes['stroke-width']) / 2 * scale! + 0.5;
  return { left: tx! - padding, top: ty! - padding,
    right: tx! + 24 * scale! + padding, bottom: ty! + 24 * scale! + padding };
}

function planetLabelBox(node: XmlNode): Box {
  const glyph = element(node.children, 'data-glyph', `body:${node.attributes['data-body-id']}`);
  const texts = node.children.filter(child => child.name === 'text');
  assert.ok(texts.some(child => child.text.includes('°')), 'Complete label includes its degree text');
  const boxes = [glyphBox(glyph), ...texts.map(textBox)];
  return { left: Math.min(...boxes.map(box => box.left)), top: Math.min(...boxes.map(box => box.top)),
    right: Math.max(...boxes.map(box => box.right)), bottom: Math.max(...boxes.map(box => box.bottom)) };
}

function boxesApart(a: Box, b: Box): boolean {
  return a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top;
}

function galleryNatal(): ChartData {
  return calculator.natal({ instant: '2026-10-16T00:04:57Z', timeZone: 'America/Sao_Paulo',
    location: { latitude: -23.55052, longitude: -46.633308, label: 'São Paulo' } });
}

test('complete planet label boxes do not intersect in the six actual São Paulo compositions', () => {
  const data = galleryNatal();
  assert.ok(data.bodies.some(body => body.retrograde), 'Fixture exercises retrograde marker bounds');
  for (const theme of THEMES) {
    const nodes = parse(renderChartSvg(data, { theme: theme.id }));
    const planets = nodes.filter(node => Object.hasOwn(node.attributes, 'data-body-id'));
    assert.equal(planets.length, data.bodies.length);
    const boxes = planets.map(planetLabelBox);
    for (let first = 0; first < boxes.length; first++) {
      for (let second = first + 1; second < boxes.length; second++) {
        assert.ok(boxesApart(boxes[first]!, boxes[second]!),
          `${theme.id}: planet labels ${planets[first]!.attributes['data-body-id']} and ${planets[second]!.attributes['data-body-id']} intersect`);
      }
    }
  }
});

test('minimal axis names clear complete exterior planet labels while longitude ticks stay exact', () => {
  const data = galleryNatal();
  const nodes = parse(renderChartSvg(data, { theme: 'minimal' }));
  const planets = nodes.filter(node => Object.hasOwn(node.attributes, 'data-body-id'));
  const boxes = planets.map(planetLabelBox);
  const axes = nodes.filter(node => Object.hasOwn(node.attributes, 'data-axis'));
  assert.deepEqual(axes.map(node => node.attributes['data-axis']), ['ASC', 'MC', 'DSC', 'IC']);
  const wheel = element(nodes, 'data-chart-kind', 'natal');
  const center = wheel.children.at(-1)!;
  assert.equal(center.name, 'circle');
  const cx = Number(center.attributes.cx);
  const cy = Number(center.attributes.cy);
  const expected = [data.houses!.ascendant, data.houses!.midheaven,
    data.houses!.ascendant + 180, data.houses!.midheaven + 180].map(normalizeAngle);
  for (const [index, axis] of axes.entries()) {
    assert.equal(Number(axis.attributes['data-longitude']), expected[index]);
    const text = axis.children.find(child => child.name === 'text');
    assert.ok(text);
    const box = textBox(text);
    assert.ok(boxes.every(planet => boxesApart(box, planet)), `${axis.attributes['data-axis']} touches a planet label`);
    const tick = nodes[nodes.indexOf(axis) - 1]!;
    assert.equal(tick.name, 'line');
    const direction = pointAt(expected[index]!, data.houses!.ascendant, 0, 0, 1);
    for (const suffix of ['1', '2']) {
      const dx = Number(tick.attributes[`x${suffix}`]) - cx;
      const dy = Number(tick.attributes[`y${suffix}`]) - cy;
      assert.ok(Math.abs(dx * direction.y - dy * direction.x) < 0.002, 'Axis tick must retain its calculated longitude');
      assert.ok(dx * direction.x + dy * direction.y > 0, 'Axis tick must point outwards');
    }
  }
});

test('all public bundle SVGs are standalone and planetary charts omit houses', () => {
  for (const theme of THEMES) {
    for (const data of [natal, planetary]) {
      const bundle = renderChartBundle(data, { theme: theme.id, locale: 'en' });
      assert.equal(bundle.chart, renderChartSvg(data, { theme: theme.id, locale: 'en' }));
      assert.equal(bundle.wheel, renderWheelSvg(data, { theme: theme.id, locale: 'en' }));
      assert.equal(bundle.tables, renderTablesSvg(data, { theme: theme.id, locale: 'en' }));
      assert.equal(typeof bundle.houses, data.houses ? 'string' : 'undefined');
      for (const source of Object.values(bundle)) {
        if (source !== undefined) assertPortable(source);
      }
      assertPlanetData(parse(bundle.wheel), data);
    }
  }
});

test('user titles, locations and identifier prefixes cannot inject XML markup or attributes', () => {
  const title = 'Mapa <script>alert("x")</script> & "Lua"';
  const label = 'São Paulo </text><image href="https://bad.test/x"/> & Centro';
  const data: ChartData = { ...natal, location: { ...natal.location!, label } };
  for (const theme of THEMES) {
    const source = renderChartSvg(data, { theme: theme.id, title, idPrefix: '\" onload="bad() <' });
    const nodes = assertPortable(source);
    assert.ok(nodes.some(node => node.name === 'title' && node.text === title));
    assert.ok(nodes.some(node => node.name === 'text' && node.text.includes(label)));
    const ids = nodes.flatMap(node => node.attributes.id ? [node.attributes.id] : []);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every(id => /^[A-Za-z0-9_-]+$/.test(id)));
  }
});

test('all six chart, wheel and table documents parse and rasterize at their declared dimensions', async () => {
  for (const theme of THEMES) {
    for (const data of [natal, planetary]) {
      for (const render of [renderChartSvg, renderWheelSvg, renderTablesSvg]) {
        const source = render(data, { theme: theme.id });
        const root = assertPortable(source)[0]!;
        const result = await sharp(Buffer.from(source)).png().toBuffer({ resolveWithObject: true });
        assert.equal(result.info.width, Math.round(Number(root.attributes.width)));
        assert.equal(result.info.height, Math.round(Number(root.attributes.height)));
        const stats = await sharp(result.data).stats();
        assert.ok(stats.channels.some(channel => channel.stdev > 5), `Blank ${theme.id} ${data.kind}`);
      }
    }
  }
});

function assertSeparated(longitudes: number[], gap: number): void {
  const input = longitudes.map((longitude, id) => ({ id, longitude }));
  const before = structuredClone(input);
  const labels = layoutPlanetLabels(input, gap);
  assert.deepEqual(input, before);
  assert.equal(labels.length, input.length);
  const ordered = labels.map(label => label.labelLongitude).sort((a, b) => a - b);
  for (let index = 0; index < labels.length; index++) {
    const label = labels[index]!;
    assert.equal(label.longitude, normalizeAngle(input[label.id]!.longitude));
    assert.ok(label.labelLongitude >= 0 && label.labelLongitude < 360);
    if (ordered.length > 1) {
      const next = ordered[(index + 1) % ordered.length]!;
      assert.ok(normalizeAngle(next - ordered[index]!) >= gap - 1e-9, JSON.stringify(labels));
    }
  }
}

test('circular label placement handles seam crossings, identical positions and twelve-body clusters', () => {
  const cases = [[], [0], [359.9, 0, 0.1], [0, 360, -360],
    Array(12).fill(0), Array.from({ length: 12 }, (_, index) => 359.5 + index / 10),
    Array.from({ length: 12 }, (_, index) => index * 30), [0, 1, 2, 179, 180, 181, 358, 359]];
  for (const positions of cases) assertSeparated(positions, 11);
  let seed = 2048;
  for (let sample = 0; sample < 80; sample++) {
    const positions = Array.from({ length: 12 }, () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32 * 360;
    });
    assertSeparated(positions, 11);
  }
});

test('angle and label geometry reject nonfinite or impossible input', () => {
  assert.equal(normalizeAngle(-1), 359);
  assert.equal(normalizeAngle(360), 0);
  assert.deepEqual(pointAt(0, 0, 10, 20, 5), { x: 5, y: 20 });
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => normalizeAngle(value), RangeError);
  for (const gap of [0, -1, NaN, Infinity, 30]) {
    assert.throws(() => layoutPlanetLabels(Array.from({ length: 12 }, (_, id) => ({ id, longitude: id })), gap), RangeError);
  }
  assert.throws(() => layoutPlanetLabels([{ id: 0, longitude: NaN }]), RangeError);
});

function crowdedChart(data: ChartData): ChartData {
  const longitude = data.bodies[0]!.longitude;
  const bodies = data.bodies.map((body, index) => {
    const position = normalizeAngle(longitude + index * 0.01);
    return { ...body, longitude: position, sign: Math.floor(position / 30) as typeof body.sign,
      degreeInSign: position % 30 };
  });
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const keys = ['fire', 'earth', 'air', 'water'] as const;
  for (const body of bodies) elements[keys[body.sign % 4]!]++;
  return { ...data, bodies, elements, aspects: [] };
}

test('moving labels in a crowded wheel preserves the exact planet anchors', () => {
  const crowded = crowdedChart(planetary);
  for (const theme of THEMES) {
    const original = parse(renderWheelSvg(planetary, { theme: theme.id }));
    const shifted = parse(renderWheelSvg(crowded, { theme: theme.id }));
    const id = String(planetary.bodies[0]!.id);
    const a = element(original, 'data-body-id', id);
    const b = element(shifted, 'data-body-id', id);
    assert.equal(a.attributes['data-longitude'], b.attributes['data-longitude']);
    assert.equal(a.attributes['data-anchor-x'], b.attributes['data-anchor-x']);
    assert.equal(a.attributes['data-anchor-y'], b.attributes['data-anchor-y']);
    assert.notEqual(b.attributes['data-label-longitude'], b.attributes['data-longitude']);
    assert.deepEqual(a.children.find(node => node.name === 'line')?.attributes,
      b.children.find(node => node.name === 'line')?.attributes);
  }
});

test('render entry points reject malformed chart geometry instead of emitting broken SVG', () => {
  const malformed: ChartData[] = [
    { ...natal, bodies: natal.bodies.map((body, index) => index ? body : { ...body, longitude: NaN }) },
    { ...natal, julianDay: Infinity },
    { ...natal, aspects: [{ body1: 123456, body2: natal.bodies[0]!.id, angle: 90, orb: 1, applying: true }] },
  ];
  for (const data of malformed) {
    for (const render of [renderChartSvg, renderWheelSvg, renderTablesSvg]) assert.throws(() => render(data));
  }
  assert.throws(() => renderChartSvg(natal, { theme: 'unknown' as ThemeId }), RangeError);
});
