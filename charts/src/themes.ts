import type { AspectAngle, ChartLocale } from './types.js';

export type ThemeId = 'editorial' | 'midnight' | 'botanical' | 'prism' | 'atlas' | 'minimal';
export type ColorMode = 'light' | 'dark';
type Localized = Record<ChartLocale, string>;

/** Literal SVG colors; background is a suggested host background, never an SVG fill. */
export interface ThemeColors {
  background: string;
  foreground: string;
  muted: string;
  line: string;
  surface: string;
  accent: string;
  secondary: string;
  elements: [string, string, string, string];
  aspects: Record<AspectAngle, string>;
}

export type ThemeColorSelection = ColorMode | ThemeColors;

interface ThemeMetadata {
  id: ThemeId;
  label: Localized;
  description: Localized;
  layout: ThemeId;
  font: string;
  headingFont: string;
  ring: 'sectors' | 'band' | 'ticks';
}

export interface ChartTheme extends ThemeMetadata {
  colors: ThemeColors;
  mode: ColorMode | 'custom';
}

export interface ThemeDefinition extends ThemeMetadata {
  palettes: Record<ColorMode, ThemeColors>;
}

const sans = 'Arial, Helvetica, sans-serif';
const serif = 'Georgia, Times New Roman, serif';
const lightAspects = { 0: '#7853a5', 60: '#337c82', 90: '#b15348', 120: '#466f9b', 180: '#a44b45' };
const darkAspects = { 0: '#c8ade8', 60: '#8cbcb1', 90: '#e0988c', 120: '#8cbddd', 180: '#e1a082' };

function freezeDefinition(theme: ThemeDefinition): ThemeDefinition {
  Object.freeze(theme.label);
  Object.freeze(theme.description);
  for (const palette of Object.values(theme.palettes)) {
    Object.freeze(palette.elements);
    Object.freeze(palette.aspects);
    Object.freeze(palette);
  }
  Object.freeze(theme.palettes);
  return Object.freeze(theme);
}

/** Layout metadata and immutable presets; resolve a palette with getTheme(). */
export const THEMES: readonly ThemeDefinition[] = Object.freeze(([
  {
    id: 'editorial', layout: 'editorial',
    label: { 'pt-BR': 'Editorial', en: 'Editorial' },
    description: { 'pt-BR': 'Azul mineral e uma composição de revista.', en: 'Mineral blue and an editorial composition.' },
    font: sans, headingFont: serif, ring: 'band',
    palettes: {
      light: {
        background: '#faf8f2', foreground: '#222f37', muted: '#58646b', line: '#c9d0d0', surface: '#f0f0e9', accent: '#235c87', secondary: '#915b40',
        elements: ['#a95640', '#607343', '#907321', '#357390'], aspects: { ...lightAspects },
      },
      dark: {
        background: '#17232d', foreground: '#f2f0e9', muted: '#b1c0c9', line: '#435562', surface: '#22323e', accent: '#9dc5e6', secondary: '#e1ac8d',
        elements: ['#e6a086', '#b2c58e', '#dcc275', '#8ec5df'], aspects: { ...darkAspects },
      },
    },
  },
  {
    id: 'midnight', layout: 'midnight',
    label: { 'pt-BR': 'Observatório', en: 'Observatory' },
    description: { 'pt-BR': 'Azul, cobre e uma roda ampla como protagonista.', en: 'Blue, copper and a generous central wheel.' },
    font: sans, headingFont: serif, ring: 'ticks',
    palettes: {
      light: {
        background: '#f4f6f9', foreground: '#1e314b', muted: '#52627a', line: '#c9d2df', surface: '#e8edf3', accent: '#79572c', secondary: '#276b7b',
        elements: ['#a25039', '#4c7143', '#82661f', '#356e8a'], aspects: { ...lightAspects },
      },
      dark: {
        background: '#101e31', foreground: '#eff0e9', muted: '#a1b1c4', line: '#344c65', surface: '#182a40', accent: '#cfad78', secondary: '#82bac8',
        elements: ['#e6a187', '#a1ba93', '#e0c386', '#87bdce'], aspects: { ...darkAspects },
      },
    },
  },
  {
    id: 'botanical', layout: 'botanical',
    label: { 'pt-BR': 'Botânico', en: 'Botanical' },
    description: { 'pt-BR': 'Verde floresta, argila e tabelas de leitura tranquila.', en: 'Forest green, clay and quietly structured tables.' },
    font: sans, headingFont: serif, ring: 'sectors',
    palettes: {
      light: {
        background: '#f1f2e9', foreground: '#254b40', muted: '#4f6659', line: '#bdcabb', surface: '#e5eade', accent: '#326448', secondary: '#8a4f31',
        elements: ['#9b5134', '#526f37', '#82701d', '#33727a'], aspects: { 0: '#7c577c', 60: '#487246', 90: '#a4583e', 120: '#34747a', 180: '#97533a' },
      },
      dark: {
        background: '#142a24', foreground: '#edf1e4', muted: '#b4c5b2', line: '#416052', surface: '#203a30', accent: '#a4d0a6', secondary: '#edb28a',
        elements: ['#e6ad87', '#aacb94', '#d4c47e', '#8dc4c5'], aspects: { 0: '#ceadd0', 60: '#a0c598', 90: '#eba289', 120: '#8ec8cd', 180: '#e5aa88' },
      },
    },
  },
  {
    id: 'prism', layout: 'prism',
    label: { 'pt-BR': 'Prisma', en: 'Prism' },
    description: { 'pt-BR': 'Cor por elemento, geometria precisa e painéis organizados.', en: 'Element colors, precise geometry and organized panels.' },
    font: sans, headingFont: sans, ring: 'sectors',
    palettes: {
      light: {
        background: '#ffffff', foreground: '#243042', muted: '#59667b', line: '#d2d8e5', surface: '#f0f3f9', accent: '#4b58a8', secondary: '#a14d64',
        elements: ['#b65a42', '#347d60', '#977020', '#526daf'], aspects: { 0: '#7954a0', 60: '#2d7b70', 90: '#b65b49', 120: '#4b70a7', 180: '#a64b69' },
      },
      dark: {
        background: '#1a1d32', foreground: '#f3f0fb', muted: '#b8bbd5', line: '#4b4f74', surface: '#292d47', accent: '#b8b5ff', secondary: '#f0adc0',
        elements: ['#f0aa91', '#8fd2b5', '#edcc7c', '#a6bcfa'], aspects: { 0: '#ccaff3', 60: '#8ed2c3', 90: '#efaa98', 120: '#a4c3f3', 180: '#eaa1c2' },
      },
    },
  },
  {
    id: 'atlas', layout: 'atlas',
    label: { 'pt-BR': 'Atlas', en: 'Atlas' },
    description: { 'pt-BR': 'Instrumento celeste em azul, com régua zodiacal e dados técnicos.', en: 'A blue celestial instrument with zodiac ruler and technical data.' },
    font: sans, headingFont: sans, ring: 'ticks',
    palettes: {
      light: {
        background: '#edf4f5', foreground: '#204952', muted: '#4c6971', line: '#b4cbd0', surface: '#e2edef', accent: '#246575', secondary: '#815d2d',
        elements: ['#9e5639', '#4b714f', '#816c22', '#326d84'], aspects: { 0: '#685f91', 60: '#30766b', 90: '#9e584b', 120: '#326a83', 180: '#925c40' },
      },
      dark: {
        background: '#112a33', foreground: '#e8f1f2', muted: '#aac4cc', line: '#3a5d6b', surface: '#1c3a45', accent: '#8dc9df', secondary: '#ddbc8a',
        elements: ['#e0a780', '#a0c8a8', '#daca8b', '#87c8df'], aspects: { 0: '#bdbae3', 60: '#8accc0', 90: '#dfab9c', 120: '#8ecbe7', 180: '#d8b28f' },
      },
    },
  },
  {
    id: 'minimal', layout: 'minimal',
    label: { 'pt-BR': 'Essencial', en: 'Essential' },
    description: { 'pt-BR': 'Muito espaço, traços delicados e poucos acentos de cor.', en: 'Generous space, delicate lines and selective color accents.' },
    font: sans, headingFont: serif, ring: 'band',
    palettes: {
      light: {
        background: '#fffefb', foreground: '#383b40', muted: '#62686e', line: '#d4d7d5', surface: '#f5f4ef', accent: '#7c6045', secondary: '#4e7478',
        elements: ['#9a624f', '#5f774c', '#887224', '#4b7885'], aspects: { 0: '#7f658d', 60: '#54785e', 90: '#9b675b', 120: '#577695', 180: '#94605f' },
      },
      dark: {
        background: '#252728', foreground: '#f1efea', muted: '#c0c2bd', line: '#535956', surface: '#333737', accent: '#d2b997', secondary: '#a9cccd',
        elements: ['#d4ac9c', '#bacaa5', '#d4c49c', '#a0c5ce'], aspects: { 0: '#c7b3d1', 60: '#afc6b4', 90: '#d7b1a4', 120: '#b0c3d8', 180: '#d0abad' },
      },
    },
  },
] satisfies ThemeDefinition[]).map(freezeDefinition));

const colorKeys = ['background', 'foreground', 'muted', 'line', 'surface', 'accent', 'secondary'] as const;
const aspectKeys = ['0', '60', '90', '120', '180'];
const numberPattern = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

function numberWithin(value: string, max: number, percent = false): boolean {
  const token = value.trim();
  const hasPercent = token.endsWith('%');
  const numeric = hasPercent ? token.slice(0, -1) : token;
  return (!percent || hasPercent) && numberPattern.test(numeric)
    && Number(numeric) >= 0 && Number(numeric) <= (hasPercent ? 100 : max);
}

/** Only self-contained literal colors: hex, numeric rgb(a)/hsl(a), or transparent.
 * CSS variables, currentColor, URLs, names and global keywords are deliberately rejected.
 */
function validColor(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 120) return false;
  const color = value.trim();
  if (/^transparent$/i.test(color) || /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(color)) return true;
  const functional = /^(rgba?|hsla?)\(([^()]*)\)$/i.exec(color);
  if (!functional) return false;
  const name = functional[1]!.toLowerCase();
  const body = functional[2]!;
  let channels: string[];
  let alpha: string | undefined;
  if (body.includes(',')) {
    if (body.includes('/')) return false;
    channels = body.split(',').map(part => part.trim());
    if (channels.length !== (name.endsWith('a') ? 4 : 3)) return false;
    if (channels.length === 4) alpha = channels.pop();
    if (name.startsWith('rgb') && new Set(channels.map(part => part.endsWith('%'))).size !== 1) return false;
  } else {
    const parts = body.trim().split('/');
    if (parts.length > 2) return false;
    channels = parts[0]!.trim().split(/\s+/);
    alpha = parts[1]?.trim();
    if (channels.length !== 3) return false;
  }
  if (alpha !== undefined && !numberWithin(alpha, 1)) return false;
  if (name.startsWith('rgb')) return channels.every(channel => numberWithin(channel, 255));
  const hue = channels[0]!.replace(/deg$/i, '');
  return numberPattern.test(hue) && Number.isFinite(Number(hue))
    && channels.slice(1).every(channel => numberWithin(channel, 100, true));
}

function exactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function validElements(value: unknown): value is ThemeColors['elements'] {
  return Array.isArray(value) && value.length === 4
    && [0, 1, 2, 3].every(index => Object.hasOwn(value, index) && validColor(value[index]));
}

function cloneColors(value: unknown): ThemeColors {
  if (!exactKeys(value, [...colorKeys, 'elements', 'aspects'])
    || !colorKeys.every(key => validColor(value[key]))
    || !validElements(value.elements)
    || !exactKeys(value.aspects, aspectKeys) || !Object.values(value.aspects).every(validColor)) {
    throw new RangeError('Invalid chart palette: provide every literal color, four elements and five major aspects');
  }
  const colors = value as unknown as ThemeColors;
  return { ...colors, elements: [...colors.elements], aspects: { ...colors.aspects } };
}

/** Resolve a layout and fresh palette. Every layout defaults to light, including midnight. */
export function getTheme(id: ThemeId = 'editorial', colors: ThemeColorSelection = 'light'): ChartTheme {
  const definition = THEMES.find(value => value.id === id);
  if (!definition) throw new RangeError(`Unknown chart theme: ${id}`);
  const { palettes, ...metadata } = definition;
  let palette: ThemeColors;
  let mode: ChartTheme['mode'];
  if (typeof colors === 'string') {
    if (colors !== 'light' && colors !== 'dark') throw new RangeError(`Unknown chart color mode: ${colors}`);
    palette = palettes[colors];
    mode = colors;
  } else {
    palette = colors;
    mode = 'custom';
  }
  return { ...metadata, label: { ...metadata.label }, description: { ...metadata.description },
    colors: cloneColors(palette), mode };
}

/** Accept a layout name or an already resolved theme; an explicit selection overrides its colors. */
export function resolveTheme(theme: ThemeId | ChartTheme = 'editorial', colors?: ThemeColorSelection): ChartTheme {
  if (typeof theme === 'string') return getTheme(theme, colors);
  if (!theme || typeof theme !== 'object' || !['light', 'dark', 'custom'].includes(theme.mode)) {
    throw new RangeError('Invalid resolved chart theme');
  }
  if (colors !== undefined) return getTheme(theme.id, colors);
  const result = getTheme(theme.id, theme.colors);
  result.mode = theme.mode;
  return result;
}
