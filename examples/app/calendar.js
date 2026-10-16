/** The example's inclusive range of local report dates. */
export const REPORT_DATE_RANGE = Object.freeze({ start: '2026-01-01', end: '2035-12-31' });

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString().slice(0, 10) === value ? date : null;
}

/** Validate an exact day or month without letting Date normalize invalid dates. */
export function isReportDate(kind, value) {
  if (kind === 'month') {
    return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
      && isReportDate('day', `${value}-01`);
  }
  return kind === 'day' && parseDate(value) !== null
    && value >= REPORT_DATE_RANGE.start && value <= REPORT_DATE_RANGE.end;
}

/** Date-only report ends are inclusive, including the last local day of a month. */
export function reportRange(kind, value) {
  if (!isReportDate(kind, value)) throw new RangeError('Selecione um dia ou mês válido entre 2026 e 2035.');
  if (kind === 'day') return { start: value, end: value };
  const [year, month] = value.split('-').map(Number);
  return { start: `${value}-01`, end: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10) };
}

/** Determine today's civil date in a selected zone, clamped to the example range. */
export function todayInTimeZone(timeZone, now = new Date()) {
  const date = new Date(now);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Instante inválido.');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = type => parts.find(value => value.type === type).value;
  const local = `${part('year')}-${part('month')}-${part('day')}`;
  return local < REPORT_DATE_RANGE.start ? REPORT_DATE_RANGE.start
    : local > REPORT_DATE_RANGE.end ? REPORT_DATE_RANGE.end : local;
}

/** Seconds east of UTC; retain second-level historical offsets when present. */
export function formatUtcOffset(seconds) {
  if (!Number.isInteger(seconds) || Math.abs(seconds) > 86_400) throw new RangeError('Deslocamento UTC inválido.');
  const absolute = Math.abs(seconds);
  const pad = value => String(value).padStart(2, '0');
  const hours = Math.floor(absolute / 3600);
  const minutes = Math.floor(absolute % 3600 / 60);
  const remainder = absolute % 60;
  return `UTC${seconds < 0 ? '−' : '+'}${pad(hours)}:${pad(minutes)}${remainder ? `:${pad(remainder)}` : ''}`;
}
