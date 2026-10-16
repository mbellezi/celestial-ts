import { escapeAttribute, n } from './svg.ts';

export type GlyphCategory = 'body' | 'sign' | 'aspect';

const BODY_NAMES = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'] as const;
const SIGN_NAMES = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'] as const;
const ASPECT_NAMES: Readonly<Record<string, number>> = { conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 };
const EXTRA_BODY_NAMES: Readonly<Record<string, number>> = { truenode: 11, chiron: 15 };
const EXTRA_BODIES: Readonly<Record<number, string>> = {
  11: '<path d="M5 14V9a7 7 0 0 1 14 0v5"/><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/>',
  15: '<circle cx="9" cy="17" r="5"/><path d="M9 12V2M9 7l9-5M9 7l9 5"/>',
};

// Original 24-unit stroke drawings keep exports independent of astrology fonts.
const BODIES = [
  '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  '<path d="M16 2a10 10 0 1 0 0 20 11 11 0 0 1 0-20Z"/>',
  '<circle cx="12" cy="10" r="4.5"/><path d="M7.5 2.5c0 6 9 6 9 0M12 14.5V22M8 18h8"/>',
  '<circle cx="12" cy="8" r="5.5"/><path d="M12 13.5V22M7.5 18h9"/>',
  '<circle cx="9" cy="15" r="6"/><path d="m13.3 10.7 8-8M15 2.7h6.3V9"/>',
  '<path d="M5 5c8-6 10 5 1 10h15M16 3v19"/>',
  '<path d="M9 2v20M4.5 7h10M9 14c8-9 14 1 8 7"/>',
  '<path d="M5 3v13M19 3v13M5 9h14M12 3v14"/><circle cx="12" cy="20" r="3"/>',
  '<path d="M5 4v3c0 9 14 9 14 0V4M12 2v20M8 18h8M3 6l2-3 2 3M10 4l2-3 2 3M17 6l2-3 2 3"/>',
  '<circle cx="12" cy="5" r="3"/><path d="M6 10a6 6 0 0 0 12 0M12 16v7M8 20h8"/>',
] as const;

const SIGNS = [
  '<path d="M12 22V9C12 0 1 1 3 9M12 9c0-9 11-8 9 0"/>',
  '<circle cx="12" cy="14" r="7"/><path d="M5 2a7 7 0 0 0 14 0"/>',
  '<path d="M4 3q8 5 16 0M4 21q8-5 16 0M8 5v14M16 5v14"/>',
  '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="16" r="3"/><path d="M5 6c5-6 13-3 15 2M19 18c-5 6-13 3-15-2"/>',
  '<circle cx="7" cy="15" r="4"/><path d="M10 12C4 4 12 0 17 4c7 6-8 15-1 18 3 1 5-1 6-4"/>',
  '<path d="M3 20V6c0-5 5-5 5 0v14M8 6c0-5 5-5 5 0v13M13 6c3-6 10-1 6 7l-6 8M17 21l5-5"/>',
  '<path d="M3 21h18M3 16h5a5.5 5.5 0 1 1 8 0h5"/>',
  '<path d="M2 19V7c0-5 5-5 5 0v12M7 7c0-5 5-5 5 0v12M12 7c0-5 5-5 5 0v9c0 5 5 5 5 1M19 17h3v4"/>',
  '<path d="M3 21 21 3M11 3h10v10M5 10l9 9"/>',
  '<path d="m2 5 5 14 3-11c2-8 7-6 7 0v9c0 7 7 5 5 0-2-5-6-2-9 3"/>',
  '<path d="m2 9 4-4 4 4 4-4 4 4 4-4M2 19l4-4 4 4 4-4 4 4 4-4"/>',
  '<path d="M5 2c9 5 9 15 0 20M19 2c-9 5-9 15 0 20M3 12h18"/>',
] as const;

const ASPECTS: Readonly<Record<number, string>> = {
  0: '<circle cx="7" cy="17" r="4.5"/><path d="m10.2 13.8 11-11"/>',
  60: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/>',
  90: '<path d="M4 4h16v16H4Z"/>',
  120: '<path d="m12 3 10 18H2Z"/>',
  180: '<circle cx="6" cy="18" r="4"/><circle cx="18" cy="6" r="4"/><path d="m9 15 6-6"/>',
};

function glyphKey(category: GlyphCategory, key: string | number): number {
  if (typeof key === 'number') return key;
  const name = key.toLowerCase();
  if (category === 'body') return EXTRA_BODY_NAMES[name] ?? BODY_NAMES.indexOf(name as typeof BODY_NAMES[number]);
  if (category === 'sign') return SIGN_NAMES.indexOf(name as typeof SIGN_NAMES[number]);
  return ASPECT_NAMES[name] ?? Number.NaN;
}

/** A centered, font-independent SVG group. Sign indices are zero-based. */
export function renderGlyph(category: GlyphCategory, key: string | number, x: number, y: number, size: number, color: string): string {
  const index = glyphKey(category, key);
  const drawings = { body: BODIES, sign: SIGNS, aspect: ASPECTS };
  const drawing = drawings[category][index] ?? (category === 'body' ? EXTRA_BODIES[index] : undefined);
  if (!drawing) throw new RangeError(`Unsupported ${category} glyph: ${key}`);
  if (![x, y, size].every(Number.isFinite) || size <= 0) throw new RangeError('Glyph geometry must be finite and size positive');
  const escaped = escapeAttribute(color);
  return `<g data-glyph="${category}:${index}" transform="translate(${n(x - size / 2)} ${n(y - size / 2)}) scale(${n(size / 24)})" fill="none" stroke="${escaped}" color="${escaped}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</g>`;
}
