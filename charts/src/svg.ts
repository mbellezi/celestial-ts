export function escapeXml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!);
}
export const escapeAttribute = escapeXml;

export function n(value: number): string {
  if (!Number.isFinite(value)) throw new RangeError('SVG geometry must be finite');
  return String(Math.round(value * 1000) / 1000);
}

export interface TextOptions {
  size?: number; fill?: string; weight?: number; anchor?: 'start' | 'middle' | 'end';
  font?: string; spacing?: number; opacity?: number;
}

export function svgText(x: number, y: number, value: unknown, options: TextOptions = {}): string {
  return `<text x="${n(x)}" y="${n(y)}" font-size="${n(options.size ?? 13)}" fill="${escapeAttribute(options.fill ?? 'currentColor')}" font-weight="${options.weight ?? 400}" text-anchor="${options.anchor ?? 'start'}"${options.font ? ` font-family="${escapeAttribute(options.font)}"` : ''}${options.spacing ? ` letter-spacing="${n(options.spacing)}"` : ''}${options.opacity !== undefined ? ` opacity="${n(options.opacity)}"` : ''}>${escapeXml(value)}</text>`;
}

export function svgLine(x1: number, y1: number, x2: number, y2: number, stroke: string, width = 1, extra = ''): string {
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${escapeAttribute(stroke)}" stroke-width="${n(width)}" ${extra}/>`;
}

export function svgRect(x: number, y: number, width: number, height: number, fill: string, radius = 0): string {
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}" rx="${n(radius)}" fill="${escapeAttribute(fill)}"/>`;
}

export function svgCircle(x: number, y: number, radius: number, stroke: string, fill = 'none', width = 1): string {
  return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" stroke="${escapeAttribute(stroke)}" fill="${escapeAttribute(fill)}" stroke-width="${n(width)}"/>`;
}

export function svgDocument(body: string, width: number, height: number, options: {title:string; description:string; font:string; idPrefix:string; metadata?:unknown}): string {
  const prefix = options.idPrefix.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(width)}" height="${n(height)}" viewBox="0 0 ${n(width)} ${n(height)}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" font-family="${escapeAttribute(options.font)}"><title id="${prefix}-title">${escapeXml(options.title)}</title><desc id="${prefix}-desc">${escapeXml(options.description)}</desc>${options.metadata === undefined ? '' : `<metadata>${escapeXml(JSON.stringify(options.metadata))}</metadata>`}${body}</svg>`;
}
