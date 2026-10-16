import { renderGlyph } from './glyphs.ts';
import { getMessages } from './locales.ts';
import { escapeAttribute, escapeXml, n, svgText } from './svg.ts';
import { resolveTheme } from './themes.ts';
import type { ChartTheme, ThemeColors, ThemeId } from './themes.ts';
import type { AspectAngle, BodyPosition, ChartAspect, ChartData, ChartLocale } from './types.ts';

export interface TableOptions {
  theme?: ThemeId | ChartTheme;
  colors?: 'light' | 'dark' | ThemeColors;
  locale?: ChartLocale;
  x?: number;
  y?: number;
  width?: number;
}

export interface TableFragment { svg: string; width: number; height: number }

interface TableContext {
  theme: ChartTheme;
  locale: ChartLocale;
  messages: ReturnType<typeof getMessages>;
  width: number;
}

const MAJOR_ASPECTS: readonly AspectAngle[] = [0, 60, 90, 120, 180];
const ROW = 28;
const HEADER = 62;

function context(options: TableOptions): TableContext {
  const width = options.width ?? 360;
  if (!Number.isFinite(width) || width < 300) throw new RangeError('Table width must be at least 300');
  return { theme: resolveTheme(options.theme, options.colors), locale: options.locale ?? 'pt-BR', messages: getMessages(options.locale), width };
}

function text(ctx: TableContext, x: number, y: number, value: string | number, size = 11, fill = ctx.theme.colors.foreground, anchor: 'start' | 'middle' | 'end' = 'start'): string {
  return svgText(x, y, String(value), { size, fill, anchor, font: ctx.theme.font });
}

function rule(ctx: TableContext, y: number): string {
  return `<path d="M14 ${n(y)}H${n(ctx.width - 14)}" fill="none" stroke="${escapeAttribute(ctx.theme.colors.line)}" stroke-width="0.7"/>`;
}

function frame(ctx: TableContext, title: string, height: number): string {
  return `<rect width="${n(ctx.width)}" height="${n(height)}" rx="12" fill="${escapeAttribute(ctx.theme.colors.surface)}" stroke="${escapeAttribute(ctx.theme.colors.line)}" stroke-width="0.8"/>`
    + svgText(16, 25, title, { size: 13, weight: 600, fill: ctx.theme.colors.foreground, font: ctx.theme.headingFont })
    + `<rect x="12" y="35" width="${n(ctx.width - 24)}" height="24" rx="5" fill="${escapeAttribute(ctx.theme.colors.accent)}" opacity="0.08"/>`;
}

function rowBackground(ctx: TableContext, index: number, y: number): string {
  if (index % 2 === 0) return '';
  return `<rect x="12" y="${n(y)}" width="${n(ctx.width - 24)}" height="${ROW}" rx="4" fill="${escapeAttribute(ctx.theme.colors.foreground)}" opacity="0.025"/>`;
}

function finish(ctx: TableContext, options: TableOptions, height: number, content: string): TableFragment {
  const x = options.x ?? 0;
  const y = options.y ?? 0;
  if (![x, y].every(Number.isFinite)) throw new RangeError('Table coordinates must be finite');
  return { svg: `<g transform="translate(${n(x)} ${n(y)})">${content}</g>`, width: ctx.width, height };
}

function degree(value: number): string {
  const seconds = Math.floor(value * 3600);
  const degrees = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  return `${String(degrees).padStart(2, '0')}°${String(minutes).padStart(2, '0')}′${String(seconds % 60).padStart(2, '0')}″`;
}

function signColor(ctx: TableContext, sign: number): string {
  return ctx.theme.colors.elements[sign % 4]!;
}

function bodyLabel(ctx: TableContext, body: BodyPosition, x: number, center: number, size = 11): string {
  const label = ctx.messages.bodies[body.key];
  if (label.length <= 12 || !label.includes(' ')) return text(ctx, x, center + 4, label, size);
  const [first, ...remaining] = label.split(' ');
  return `<g><title>${escapeXml(label)}</title>${text(ctx, x, center - 1, first!, 9.5)}${text(ctx, x, center + 10, remaining.join(' '), 9.5)}</g>`;
}

function positionsRow(ctx: TableContext, body: BodyPosition, index: number, showHouse: boolean): string {
  const top = HEADER + index * ROW;
  const center = top + ROW / 2;
  const signX = ctx.width * 0.36;
  const degreeX = ctx.width - (showHouse ? 66 : 34);
  return rowBackground(ctx, index, top)
    + renderGlyph('body', body.id, 25, center, 17, ctx.theme.colors.accent)
    + bodyLabel(ctx, body, 41, center)
    + renderGlyph('sign', body.sign, signX, center, 16, signColor(ctx, body.sign))
    + text(ctx, signX + 14, center + 4, ctx.messages.signs[body.sign], 10)
    + text(ctx, degreeX, center + 4, degree(body.degreeInSign), 10, ctx.theme.colors.foreground, 'end')
    + (showHouse ? text(ctx, ctx.width - 43, center + 4, body.house ?? '—', 11, ctx.theme.colors.muted, 'middle') : '')
    + (body.retrograde ? text(ctx, ctx.width - 19, center + 4, ctx.messages.labels.retrogradeShort, 10, ctx.theme.colors.secondary, 'middle') : '');
}

/** Body positions use actual calculated longitudes; planetary charts omit houses. */
export function renderPositionsTable(data: ChartData, options: TableOptions = {}): TableFragment {
  const ctx = context(options);
  const hasHouses = data.houses !== undefined;
  const height = HEADER + data.bodies.length * ROW + 12;
  let content = frame(ctx, ctx.messages.labels.positions, height)
    + text(ctx, 18, 51, ctx.messages.labels.planet, 10, ctx.theme.colors.muted)
    + text(ctx, ctx.width * 0.36 - 7, 51, ctx.messages.labels.sign, 10, ctx.theme.colors.muted)
    + text(ctx, ctx.width - (hasHouses ? 66 : 34), 51, ctx.messages.labels.degree, 10, ctx.theme.colors.muted, 'end');
  if (hasHouses) content += text(ctx, ctx.width - 43, 51, ctx.messages.labels.house, 9, ctx.theme.colors.muted, 'middle');
  content += text(ctx, ctx.width - 19, 51, ctx.messages.labels.retrogradeShort, 10, ctx.theme.colors.muted, 'middle');
  content += data.bodies.map((body, index) => positionsRow(ctx, body, index, hasHouses)).join('');
  return finish(ctx, options, height, content);
}

function houseRow(ctx: TableContext, longitude: number, house: number): string {
  const top = HEADER + (house - 1) * ROW;
  const center = top + ROW / 2;
  const sign = Math.floor(longitude / 30);
  return rowBackground(ctx, house - 1, top)
    + text(ctx, 25, center + 4, house, 11, ctx.theme.colors.muted, 'middle')
    + renderGlyph('sign', sign, 63, center, 17, signColor(ctx, sign))
    + text(ctx, 80, center + 4, ctx.messages.signs[sign] ?? '', 11)
    + text(ctx, ctx.width - 20, center + 4, degree(longitude % 30), 11, ctx.theme.colors.foreground, 'end');
}

export function renderHousesTable(data: ChartData, options: TableOptions = {}): TableFragment {
  const ctx = context(options);
  if (!data.houses) return finish(ctx, options, 0, '');
  const height = HEADER + 12 * ROW + 12;
  const content = frame(ctx, ctx.messages.labels.houses, height)
    + text(ctx, 25, 51, ctx.messages.labels.house, 9, ctx.theme.colors.muted, 'middle')
    + text(ctx, 57, 51, ctx.messages.labels.sign, 10, ctx.theme.colors.muted)
    + text(ctx, ctx.width - 20, 51, ctx.messages.labels.degree, 10, ctx.theme.colors.muted, 'end')
    + data.houses.cusps.slice(1).map((longitude, index) => houseRow(ctx, longitude, index + 1)).join('');
  return finish(ctx, options, height, content);
}

function aspectLegend(ctx: TableContext, y: number): string {
  return MAJOR_ASPECTS.map((angle, index) => {
    const x = 24 + index % 3 * (ctx.width - 32) / 3;
    const row = y + Math.floor(index / 3) * 23;
    return renderGlyph('aspect', angle, x, row, 14, ctx.theme.colors.aspects[angle])
      + text(ctx, x + 13, row + 3.5, ctx.messages.aspects[angle], 9.5, ctx.theme.colors.muted);
  }).join('');
}

function pairKey(body1: number, body2: number): string {
  return `${Math.min(body1, body2)}:${Math.max(body1, body2)}`;
}

function matrixCell(ctx: TableContext, aspect: ChartAspect | undefined, x: number, y: number, cell: number): string {
  if (!aspect) return '';
  const color = ctx.theme.colors.aspects[aspect.angle];
  const label = `${ctx.messages.aspects[aspect.angle]} · ${ctx.messages.labels.orb} ${degree(aspect.orb)}`;
  return `<g><title>${escapeXml(label)}</title>`
    + renderGlyph('aspect', aspect.angle, x, y - 3, Math.min(14, cell * 0.45), color)
    + text(ctx, x, y + 10, new Intl.NumberFormat(ctx.locale, { maximumFractionDigits: 1 }).format(aspect.orb), 8, ctx.theme.colors.muted, 'middle')
    + '</g>';
}

function matrixRow(ctx: TableContext, data: ChartData, row: number, cell: number, pairs: Map<string, ChartAspect>): string {
  const top = HEADER + row * cell;
  const body = data.bodies[row]!;
  const label = escapeXml(ctx.messages.bodies[body.key]);
  let result = `<g><title>${label}</title>${renderGlyph('body', body.id, 18 + cell / 2, top + cell / 2, Math.min(18, cell * 0.65), ctx.theme.colors.accent)}</g>`;
  for (let column = 0; column <= row; column++) {
    const x = 18 + (column + 1) * cell;
    result += `<rect data-matrix-cell="true" x="${n(x)}" y="${n(top)}" width="${n(cell)}" height="${n(cell)}" rx="3" fill="none" stroke="${escapeAttribute(ctx.theme.colors.line)}" stroke-width="0.6"/>`;
    const other = data.bodies[column]!;
    if (column < row) result += matrixCell(ctx, pairs.get(pairKey(body.id, other.id)), x + cell / 2, top + cell / 2, cell);
  }
  return result;
}

export function renderAspectMatrix(data: ChartData, options: TableOptions = {}): TableFragment {
  const ctx = context(options);
  const cell = (ctx.width - 36) / (data.bodies.length + 1);
  const gridBottom = HEADER + data.bodies.length * cell;
  const height = gridBottom + 74;
  const pairs = new Map(data.aspects.map((aspect) => [pairKey(aspect.body1, aspect.body2), aspect]));
  let content = frame(ctx, ctx.messages.labels.aspectMatrix, height);
  content += data.bodies.map((body, index) => `<g data-matrix-header="true"><title>${escapeXml(ctx.messages.bodies[body.key])}</title>${renderGlyph('body', body.id, 18 + (index + 1.5) * cell, 47, Math.min(18, cell * 0.65), ctx.theme.colors.accent)}</g>`).join('');
  content += data.bodies.map((_, row) => matrixRow(ctx, data, row, cell, pairs)).join('');
  content += rule(ctx, gridBottom + 12) + aspectLegend(ctx, gridBottom + 31);
  return finish(ctx, options, height, content);
}

function aspectRow(ctx: TableContext, data: ChartData, aspect: ChartAspect, index: number): string {
  const first = data.bodies.find((body) => body.id === aspect.body1);
  const second = data.bodies.find((body) => body.id === aspect.body2);
  if (!first || !second) throw new RangeError('Aspect refers to a body missing from chart data');
  const top = HEADER + index * ROW;
  const center = top + ROW / 2;
  const label = aspect.applying ? ctx.messages.labels.applying : ctx.messages.labels.separating;
  return rowBackground(ctx, index, top)
    + renderGlyph('body', first.id, 24, center, 16, ctx.theme.colors.accent)
    + bodyLabel(ctx, first, 38, center, 10)
    + renderGlyph('body', second.id, ctx.width * 0.3, center, 16, ctx.theme.colors.accent)
    + bodyLabel(ctx, second, ctx.width * 0.3 + 14, center, 10)
    + `<g><title>${escapeXml(ctx.messages.aspects[aspect.angle])}</title>${renderGlyph('aspect', aspect.angle, ctx.width * 0.61, center, 16, ctx.theme.colors.aspects[aspect.angle])}</g>`
    + text(ctx, ctx.width - 35, center + 4, degree(aspect.orb), 10, ctx.theme.colors.foreground, 'end')
    + `<g><title>${escapeXml(label)}</title><circle cx="${n(ctx.width - 20)}" cy="${n(center)}" r="3" fill="${aspect.applying ? escapeAttribute(ctx.theme.colors.accent) : 'none'}" stroke="${escapeAttribute(ctx.theme.colors.accent)}" stroke-width="1.1"/></g>`;
}

export function renderAspectsTable(data: ChartData, options: TableOptions = {}): TableFragment {
  const ctx = context(options);
  const bodyHeight = Math.max(1, data.aspects.length) * ROW;
  const height = HEADER + bodyHeight + 99;
  let content = frame(ctx, ctx.messages.labels.aspectsTable, height)
    + text(ctx, 18, 51, ctx.messages.labels.planet, 10, ctx.theme.colors.muted)
    + text(ctx, ctx.width * 0.3 - 7, 51, ctx.messages.labels.planet, 10, ctx.theme.colors.muted)
    + text(ctx, ctx.width * 0.61, 51, ctx.messages.labels.aspect, 10, ctx.theme.colors.muted, 'middle')
    + text(ctx, ctx.width - 35, 51, ctx.messages.labels.orb, 10, ctx.theme.colors.muted, 'end');
  content += data.aspects.map((aspect, index) => aspectRow(ctx, data, aspect, index)).join('');
  if (data.aspects.length === 0) content += text(ctx, 18, HEADER + 19, ctx.messages.labels.noAspects, 11, ctx.theme.colors.muted);
  const bottom = HEADER + bodyHeight;
  content += rule(ctx, bottom + 8) + aspectLegend(ctx, bottom + 29);
  content += `<circle cx="24" cy="${n(bottom + 77)}" r="3" fill="${escapeAttribute(ctx.theme.colors.accent)}"/>`
    + text(ctx, 34, bottom + 81, ctx.messages.labels.applying, 9.5, ctx.theme.colors.muted)
    + `<circle cx="${n(ctx.width / 2 + 8)}" cy="${n(bottom + 77)}" r="3" fill="none" stroke="${escapeAttribute(ctx.theme.colors.accent)}"/>`
    + text(ctx, ctx.width / 2 + 18, bottom + 81, ctx.messages.labels.separating, 9.5, ctx.theme.colors.muted);
  return finish(ctx, options, height, content);
}
