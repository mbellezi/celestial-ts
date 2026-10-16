import { resolveDateTime } from './datetime.ts';
import { REPORT_BODIES, type ReportInput, type DetectionRequest, type AspectAngle } from './types.ts';
export const DEFAULT_ORBS: Readonly<Record<AspectAngle, number>> = Object.freeze({ 0: 6, 60: 4, 90: 6, 120: 6, 180: 6 });
export function normalizeRange(input: ReportInput): DetectionRequest & { timeZone: string } {
  if (!input || typeof input.start !== 'string' || typeof input.end !== 'string') throw new TypeError('start and end are required');
  const dates = /^\d{4}-\d{2}-\d{2}$/;
  const dateOnly = dates.test(input.start);
  if (dateOnly !== dates.test(input.end)) throw new RangeError('Do not mix calendar dates and instants');
  const timeZone = input.timeZone ?? 'UTC';
  const start = resolveDateTime(dateOnly ? { date: input.start, time: '00:00', timeZone } : { instant: input.start, timeZone });
  let endValue = input.end;
  if (dateOnly) {
    resolveDateTime({ date: input.end, time: '00:00', timeZone });
    const following = new Date(`${input.end}T00:00:00Z`);
    following.setUTCDate(following.getUTCDate() + 1);
    endValue = following.toISOString().slice(0, 10);
  }
  const end = resolveDateTime(dateOnly ? { date: endValue, time: '00:00', timeZone } : { instant: endValue, timeZone });
  const startMs = start.date.getTime(), endMs = end.date.getTime();
  const localDate = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: start.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ms).find(p => p.type === 'year')!.value;
  if (endMs <= startMs || +localDate(startMs) < 2026 || +localDate(endMs - 1) > 2035) throw new RangeError('Range must be within 2026–2035 and have positive duration');
  const selected = input.bodies ?? REPORT_BODIES;
  if (!Array.isArray(selected) || !selected.length || new Set(selected).size !== selected.length || selected.some(b => !REPORT_BODIES.includes(b))) throw new RangeError('Invalid bodies');
  const bodies = REPORT_BODIES.filter(b => selected.includes(b));
  const orbs = { ...DEFAULT_ORBS };
  if (input.orbs !== undefined) {
    if (!input.orbs || typeof input.orbs !== 'object' || Array.isArray(input.orbs)) throw new RangeError('Invalid orbs');
    for (const [key, value] of Object.entries(input.orbs)) {
      if (!Object.hasOwn(orbs, key) || typeof value !== 'number' || !Number.isFinite(value) || value < 0.001 || value > 10) throw new RangeError('Orbs must be >= 0.001 and <= 10 degrees for major aspects');
      orbs[+key as AspectAngle] = value;
    }
  }
  return { startMs, endMs, timeZone: start.timeZone, bodies, orbs };
}
