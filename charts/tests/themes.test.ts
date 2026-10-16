import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTheme, resolveTheme, THEMES } from '../src/themes.ts';
import type { ChartTheme, ColorMode, ThemeColors, ThemeColorSelection, ThemeId } from '../src/themes.ts';

const ids: readonly ThemeId[] = ['editorial', 'midnight', 'botanical', 'prism', 'atlas', 'minimal'];
const modes: readonly ColorMode[] = ['light', 'dark'];

// Relative luminance and contrast use the sRGB transfer function, independently of the theme resolver.
function luminance(hex: string): number {
  assert.match(hex, /^#[\da-f]{6}$/i, 'preset colors must be opaque sRGB hex');
  const channels = [1, 3, 5].map(index => {
    const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function contrast(a: string, b: string): number {
  const values = [luminance(a), luminance(b)].sort((first, second) => second - first);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

function resolveUnknown(colors: unknown): ChartTheme {
  return getTheme('editorial', colors as ThemeColorSelection);
}

test('six layout definitions offer light and dark palettes with light as every default', () => {
  assert.deepEqual(THEMES.map(theme => theme.id), ids);
  assert.equal(getTheme().id, 'editorial');
  assert.deepEqual(resolveTheme(), getTheme());
  for (const id of ids) {
    const definition = THEMES.find(theme => theme.id === id)!;
    assert.deepEqual(Object.keys(definition.palettes).sort(), ['dark', 'light']);
    const light = getTheme(id);
    const dark = getTheme(id, 'dark');
    assert.equal(light.id, id);
    assert.equal(light.layout, id);
    assert.equal(light.mode, 'light');
    assert.equal(dark.mode, 'dark');
    assert.deepEqual(light.colors, definition.palettes.light);
    assert.deepEqual(dark.colors, definition.palettes.dark);
    assert.notDeepEqual(light.colors, dark.colors);
    assert.ok(luminance(light.colors.background) > 0.8, `${id} light host background`);
    assert.ok(luminance(dark.colors.background) < 0.1, `${id} dark host background`);
    assert.equal(light.colors.elements.length, 4);
    assert.deepEqual(Object.keys(light.colors.aspects), ['0', '60', '90', '120', '180']);
    assert.ok(light.label['pt-BR'] && light.label.en && light.description['pt-BR'] && light.description.en);
  }
});

for (const id of ids) {
  test(`${id} text colors remain readable against both preset surfaces in both modes`, () => {
    for (const mode of modes) {
      const colors = getTheme(id, mode).colors;
      for (const background of [colors.background, colors.surface]) {
        for (const key of ['foreground', 'muted', 'accent', 'secondary'] as const) {
          const ratio = contrast(colors[key], background);
          assert.ok(ratio >= 4.5, `${id}/${mode} ${key} on ${background}: ${ratio.toFixed(2)} < 4.5`);
        }
      }
    }
  });
}

test('custom palettes preserve every caller-provided color and have a distinct mode', () => {
  const custom: ThemeColors = {
    background: 'transparent', foreground: '#123', muted: '#1234', line: '#12345678',
    surface: 'rgba(12, 34, 56, 0.25)', accent: 'rgb(50% 40% 30% / 80%)',
    secondary: 'hsl(210deg 45% 60% / .9)',
    elements: ['#123456', '#abcdef', 'rgb(0, 0, 0)', 'hsla(0, 0%, 100%, 1)'],
    aspects: { 0: '#789', 60: '#abc', 90: '#def', 120: '#fed', 180: '#cba' },
  };
  const theme = getTheme('atlas', custom);
  assert.equal(theme.id, 'atlas');
  assert.equal(theme.mode, 'custom');
  assert.deepEqual(theme.colors, custom);
  assert.notEqual(theme.colors, custom);
  assert.notEqual(theme.colors.elements, custom.elements);
  assert.notEqual(theme.colors.aspects, custom.aspects);
  assert.deepEqual(resolveTheme(theme), theme);
  assert.deepEqual(resolveTheme(theme, 'dark'), getTheme('atlas', 'dark'));
  assert.deepEqual(resolveTheme('botanical', custom), getTheme('botanical', custom));
});

test('resolved themes retain their mode and isolate nested colors and localized metadata', () => {
  for (const mode of modes) {
    const first = getTheme('midnight', mode);
    const second = resolveTheme(first);
    assert.deepEqual(second, first);
    assert.notEqual(second, first);
    assert.notEqual(second.colors.elements, first.colors.elements);
    assert.notEqual(second.colors.aspects, first.colors.aspects);
    assert.notEqual(second.label, first.label);
    first.colors.elements[0] = '#000';
    first.colors.aspects[0] = '#fff';
    first.label.en = 'changed';
    first.description['pt-BR'] = 'changed';
    assert.deepEqual(second, getTheme('midnight', mode));
  }
  const custom = getTheme('editorial').colors;
  const snapshot = structuredClone(custom);
  const theme = getTheme('editorial', custom);
  custom.foreground = '#000';
  custom.elements[1] = '#000';
  custom.aspects[90] = '#000';
  assert.deepEqual(theme.colors, snapshot);
  theme.colors.muted = '#fff';
  assert.notEqual(custom.muted, '#fff');
  assert.deepEqual(getTheme('editorial').colors, snapshot);
});

test('the public catalog cannot be mutated to change later resolutions', () => {
  assert.ok(Object.isFrozen(THEMES));
  for (const definition of THEMES) {
    assert.ok(Object.isFrozen(definition));
    assert.ok(Object.isFrozen(definition.label));
    assert.ok(Object.isFrozen(definition.description));
    assert.ok(Object.isFrozen(definition.palettes));
    for (const mode of modes) {
      const colors = definition.palettes[mode];
      assert.ok(Object.isFrozen(colors));
      assert.ok(Object.isFrozen(colors.elements));
      assert.ok(Object.isFrozen(colors.aspects));
      assert.throws(() => { colors.foreground = '#000'; }, TypeError);
      assert.throws(() => { colors.elements[0] = '#000'; }, TypeError);
      assert.throws(() => { colors.aspects[0] = '#000'; }, TypeError);
    }
  }
});

test('standalone literal color syntaxes are accepted without rewriting their spelling', () => {
  const colors = [
    '#000', '#FFF', '#0000', '#aBcD', '#abcdef', '#ABCDEF', '#12345678',
    'transparent', 'TRANSPARENT', ' #123 ',
    'rgb(0, 128, 255)', 'rgba(0, 128, 255, .5)', 'rgb(0%, 50%, 100%)',
    'rgb(0 128 255)', 'rgb(0 128 255 / 50%)', 'rgba(0 128 255 / 1)',
    'rgb(0% 50% 100% / 0)', 'RGB(0 1 2 / 100%)',
    'hsl(360, 100%, 50%)', 'hsla(-30, 50%, 50%, 0.75)',
    'hsl(210deg 40% 60%)', 'hsl(-720deg 0% 100% / 25%)', 'hsla(.5 0% 0% / 0)',
  ];
  for (const value of colors) {
    const custom = getTheme().colors;
    custom.foreground = value;
    assert.equal(getTheme('minimal', custom).colors.foreground, value);
  }
});

test('injection, dependent paints and malformed or out-of-range CSS colors are rejected', () => {
  const invalid = [
    '', ' ', '#12', '#12345', '#1234567', '#123456789', '#ggg',
    'red', 'currentColor', 'inherit', 'initial', 'none', 'var(--foreground)',
    'url(https://example.test/paint.svg#x)', 'url(#gradient)',
    '#fff;stroke:red', '#fff" onload="alert(1)', '<script>alert(1)</script>',
    'rgb(0 0 0);opacity:0', 'rgb(calc(1 + 2) 0 0)', 'rgb(var(--x) 0 0)',
    'rgb(256 0 0)', 'rgb(-1 0 0)', 'rgb(101% 0% 0%)', 'rgb(0, 10%, 0)',
    'rgb(0 0)', 'rgb(0,0,0,1)', 'rgba(0,0,0)', 'rgb(0 0 0 /)',
    'rgb(0 0 0 / 1.1)', 'rgb(0 0 0 / -0.1)', 'rgb(0 0 0 / 101%)',
    'rgb(0 0 0 / .5 / .5)', 'rgb(0,0,0 / .5)', 'rgb(NaN 0 0)', 'rgb(Infinity 0 0)',
    'hsl(30 50 50)', 'hsl(30 101% 0%)', 'hsl(30 0% -1%)', 'hsl(30rad 0% 0%)',
    'hsl(0,0%,0%,1)', 'hsla(0,0%,0%)', 'hsl(0 0% 0% / 2)',
    0, null, undefined, {}, ['#fff'],
  ];
  for (const value of invalid) {
    const custom = { ...getTheme().colors, foreground: value };
    assert.throws(() => resolveUnknown(custom), RangeError, `Rejected color: ${String(value)}`);
  }
});

test('every palette field is required and validated, including all element and aspect colors', () => {
  const palette = getTheme().colors;
  for (const key of Object.keys(palette)) {
    const incomplete = { ...palette } as Partial<ThemeColors>;
    delete incomplete[key as keyof ThemeColors];
    assert.throws(() => resolveUnknown(incomplete), RangeError, `Missing ${key}`);
    assert.throws(() => resolveUnknown({ ...palette, [key]: 'url(#paint)' }), RangeError, `Invalid ${key}`);
  }
  assert.throws(() => resolveUnknown({ ...palette, unknown: '#fff' }), RangeError);
  for (const elements of [[], ['#fff'], Array(4), [...palette.elements, '#fff']]) {
    assert.throws(() => resolveUnknown({ ...palette, elements }), RangeError);
  }
  for (let index = 0; index < 4; index++) {
    const elements = [...palette.elements];
    elements[index] = 'url(#paint)';
    assert.throws(() => resolveUnknown({ ...palette, elements }), RangeError);
  }
  for (const angle of [0, 60, 90, 120, 180] as const) {
    const aspects = { ...palette.aspects } as Partial<ThemeColors['aspects']>;
    delete aspects[angle];
    assert.throws(() => resolveUnknown({ ...palette, aspects }), RangeError);
    assert.throws(() => resolveUnknown({ ...palette, aspects: { ...palette.aspects, [angle]: 'url(#paint)' } }), RangeError);
  }
  assert.throws(() => resolveUnknown({ ...palette, aspects: { ...palette.aspects, 30: '#fff' } }), RangeError);
  assert.throws(() => resolveUnknown(Object.create(palette)), RangeError);
  for (const value of [null, false, 42, [], {}, 'custom', 'night']) {
    assert.throws(() => resolveUnknown(value), RangeError);
  }
});

test('invalid theme IDs and invalid resolved themes fail instead of silently choosing defaults', () => {
  assert.throws(() => getTheme('unknown' as ThemeId), RangeError);
  assert.throws(() => resolveTheme('unknown' as ThemeId), RangeError);
  assert.throws(() => resolveTheme(null as unknown as ChartTheme), RangeError);
  assert.throws(() => resolveTheme({} as ChartTheme), RangeError);
  assert.throws(() => resolveTheme({ ...getTheme(), mode: 'invalid' } as unknown as ChartTheme), RangeError);
  assert.throws(() => resolveTheme({ ...getTheme(), colors: {} } as ChartTheme), RangeError);
});
