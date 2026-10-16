import { ChartError, getMessages } from './locales.ts';
import type { ChartErrorCode } from './locales.ts';
import type { ChartLocale, DateTimeInput } from './types.ts';

type Parts = [number, number, number, number, number, number, number];

export interface ResolvedDateTime {
  date: Date;
  instant: string;
  displayDateTime: string;
  timeZone: string;
}

function utcMillis(parts: Parts): number {
  const date = new Date(0);
  date.setUTCFullYear(parts[0], parts[1] - 1, parts[2]);
  date.setUTCHours(parts[3], parts[4], parts[5], parts[6]);
  return date.getTime();
}

function calendarParts(date: string, locale: ChartLocale, code: ChartErrorCode): Parts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new ChartError(code, locale);
  const parts: Parts = [Number(match[1]), Number(match[2]), Number(match[3]), 0, 0, 0, 0];
  const normalized = new Date(utcMillis(parts));
  if (parts[0] < 1 || normalized.getUTCFullYear() !== parts[0]
    || normalized.getUTCMonth() + 1 !== parts[1] || normalized.getUTCDate() !== parts[2]) {
    throw new ChartError(code, locale);
  }
  return parts;
}

function addTime(parts: Parts, time: string, locale: ChartLocale, code: ChartErrorCode): Parts {
  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(time);
  if (!match) throw new ChartError(code, locale);
  const values = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0),
    Number((match[4] ?? '').padEnd(3, '0'))];
  if (values[0] > 23 || values[1] > 59 || values[2] > 59) throw new ChartError(code, locale);
  return [parts[0], parts[1], parts[2], values[0], values[1], values[2], values[3]];
}

function formatter(timeZone: string, locale: ChartLocale): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('en-US-u-ca-iso8601-nu-latn', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3,
      hourCycle: 'h23',
    });
  } catch {
    throw new ChartError('unknownTimeZone', locale);
  }
}

function wallParts(format: Intl.DateTimeFormat, epoch: number): Parts {
  const entries = Object.fromEntries(format.formatToParts(epoch).map(part => [part.type, part.value]));
  return [Number(entries.year), Number(entries.month), Number(entries.day), Number(entries.hour),
    Number(entries.minute), Number(entries.second), Number(entries.fractionalSecond)];
}

function localInstant(parts: Parts, format: Intl.DateTimeFormat, locale: ChartLocale): Date {
  const nominal = utcMillis(parts);
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 3) {
    const epoch = nominal + hours * 3_600_000;
    offsets.add(utcMillis(wallParts(format, epoch)) - epoch);
  }
  const candidates = [...offsets].map(offset => nominal - offset)
    .filter(epoch => utcMillis(wallParts(format, epoch)) === nominal);
  if (candidates.length === 0) throw new ChartError('nonexistentTime', locale);
  if (candidates.length > 1) throw new ChartError('ambiguousTime', locale);
  return new Date(candidates[0]);
}

function explicitInstant(instant: string, locale: ChartLocale): Date {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)(Z|[+-]\d{2}:\d{2})$/.exec(instant);
  if (!match) throw new ChartError('invalidInstant', locale);
  addTime(calendarParts(match[1], locale, 'invalidInstant'), match[2], locale, 'invalidInstant');
  const offset = match[3];
  if (offset !== 'Z' && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4)) > 59)) {
    throw new ChartError('invalidInstant', locale);
  }
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) throw new ChartError('invalidInstant', locale);
  return date;
}

function inputInstant(input: DateTimeInput, format: Intl.DateTimeFormat, locale: ChartLocale): Date {
  if (input.instant !== undefined) {
    if (input.date !== undefined || input.time !== undefined) throw new ChartError('invalidDateTime', locale);
    return explicitInstant(input.instant, locale);
  }
  if (typeof input.date !== 'string' || typeof input.time !== 'string' || !input.timeZone) {
    throw new ChartError('invalidDateTime', locale);
  }
  return localInstant(addTime(calendarParts(input.date, locale, 'invalidDate'),
    input.time, locale, 'invalidTime'), format, locale);
}

export function resolveDateTime(input: DateTimeInput, locale: ChartLocale = 'pt-BR'): ResolvedDateTime {
  getMessages(locale);
  const timeZone = input.timeZone ?? 'UTC';
  if (typeof timeZone !== 'string' || timeZone.length === 0) throw new ChartError('unknownTimeZone', locale);
  const format = formatter(timeZone, locale);
  const date = inputInstant(input, format, locale);
  return {
    date,
    instant: date.toISOString(),
    timeZone: format.resolvedOptions().timeZone,
    displayDateTime: new Intl.DateTimeFormat(locale, {
      timeZone, dateStyle: 'medium', timeStyle: 'medium', hourCycle: 'h23',
    }).format(date),
  };
}
