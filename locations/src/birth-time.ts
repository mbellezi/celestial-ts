import { TIME_ZONE_DATA, TZDB_END, TZDB_VERSION } from './time-zone-data.ts';

/** Inclusive range of local birth dates, in the Gregorian calendar. */
export const BIRTH_DATE_RANGE = Object.freeze({ start: '1930-01-01', end: '2040-12-31' } as const);

/** A selected city from Open-Meteo is structurally compatible with this input. */
export interface BirthLocation {
  latitude: number;
  longitude: number;
  /** IANA identifier. Coordinates alone do not determine historical civil time. */
  timeZone: string;
  label?: string;
}

export interface BirthTimeInput {
  /** Gregorian local date, YYYY-MM-DD, from 1930 through 2040 inclusive. */
  date: string;
  /** Local clock time, HH:mm, HH:mm:ss or HH:mm:ss.SSS (1–3 fractional digits). */
  time: string;
  location: BirthLocation;
  /** Select an occurrence of a repeated time. Nonexistent times always fail. Default: reject. */
  disambiguation?: 'reject' | 'earlier' | 'later';
}

export interface BirthTimeCandidate {
  /** UTC ISO 8601 instant, compatible with the chart calculator. */
  instant: string;
  /** Unix milliseconds, without leap-second accounting, like JavaScript Date. */
  timestamp: number;
  /** Seconds east of UTC at this instant. Preserves historical second-level offsets. */
  utcOffsetSeconds: number;
}

export interface BirthTimeResult extends BirthTimeCandidate {
  /** Original local clock reading, normalized with seconds and milliseconds. */
  localDateTime: string;
  timeZone: string;
  location: BirthLocation;
  /** Version of the bundled IANA database, including its supplementary backzone data. */
  tzdbVersion: string;
  resolution: 'unique' | 'earlier' | 'later';
}

export type BirthTimeErrorCode = 'invalid_input' | 'invalid_date' | 'invalid_time'
  | 'out_of_range' | 'invalid_location' | 'unknown_time_zone' | 'ambiguous_time'
  | 'nonexistent_time' | 'invalid_disambiguation';

const messages: Record<BirthTimeErrorCode, string> = {
  invalid_input: 'Informe data, horário e local de nascimento.',
  invalid_date: 'A data deve ser válida no calendário gregoriano e usar YYYY-MM-DD.',
  invalid_time: 'O horário deve ser válido e usar HH:mm, HH:mm:ss ou HH:mm:ss.SSS.',
  out_of_range: 'A data local de nascimento deve estar entre 1930-01-01 e 2040-12-31.',
  invalid_location: 'Informe latitude, longitude e fuso IANA válidos para o local de nascimento.',
  unknown_time_zone: 'O fuso IANA informado não existe na base de fusos incluída na biblioteca.',
  ambiguous_time: 'Esse horário ocorreu mais de uma vez. Escolha a ocorrência anterior ou posterior.',
  nonexistent_time: 'Esse horário local não existiu devido a uma mudança de relógio. Confira o horário informado.',
  invalid_disambiguation: 'disambiguation deve ser reject, earlier ou later.',
};

export class BirthTimeError extends Error {
  readonly code: BirthTimeErrorCode;
  /** Possible UTC instants in chronological order when code is ambiguous_time. */
  readonly candidates: readonly BirthTimeCandidate[];

  constructor(code: BirthTimeErrorCode, candidates: readonly BirthTimeCandidate[] = []) {
    super(messages[code]);
    this.name = 'BirthTimeError';
    this.code = code;
    this.candidates = Object.freeze(candidates.map(candidate => Object.freeze({ ...candidate })));
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function localTimestamp(date: unknown, time: unknown): number {
  const day = typeof date === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(date) : null;
  if (!day) throw new BirthTimeError('invalid_date');
  const year = Number(day[1]), month = Number(day[2]), dayOfMonth = Number(day[3]);
  const calendar = new Date(0);
  // setUTCFullYear avoids Date.UTC's special treatment of years 00–99.
  calendar.setUTCFullYear(year, month - 1, dayOfMonth);
  if (year < 1 || calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1
    || calendar.getUTCDate() !== dayOfMonth) throw new BirthTimeError('invalid_date');
  if (year < 1930 || year > 2040) throw new BirthTimeError('out_of_range');

  const clock = typeof time === 'string' ? /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(time) : null;
  if (!clock) throw new BirthTimeError('invalid_time');
  const hour = Number(clock[1]), minute = Number(clock[2]), second = Number(clock[3] ?? 0);
  const millisecond = Number((clock[4] ?? '').padEnd(3, '0'));
  if (hour > 23 || minute > 59 || second > 59) throw new BirthTimeError('invalid_time');
  calendar.setUTCHours(hour, minute, second, millisecond);
  return calendar.getTime();
}

function birthLocation(value: unknown): BirthLocation {
  if (!record(value) || typeof value.latitude !== 'number' || !Number.isFinite(value.latitude)
    || value.latitude < -90 || value.latitude > 90
    || typeof value.longitude !== 'number' || !Number.isFinite(value.longitude)
    || value.longitude < -180 || value.longitude > 180
    || typeof value.timeZone !== 'string' || value.timeZone.length === 0
    || (value.label !== undefined && typeof value.label !== 'string')) {
    throw new BirthTimeError('invalid_location');
  }
  if (!Object.hasOwn(TIME_ZONE_DATA, value.timeZone)) throw new BirthTimeError('unknown_time_zone');
  return {
    latitude: value.latitude, longitude: value.longitude, timeZone: value.timeZone,
    ...(value.label === undefined ? {} : { label: value.label }),
  };
}

/**
 * Resolve a local birth date/time using bundled IANA transitions for 1930–2040.
 * No network, WASM initialization, Intl or host time-zone database is required.
 * Repeated clock readings require an explicit choice; skipped readings always throw.
 * Future dates use the rules predicted by tzdbVersion, which may change in later releases.
 */
export function resolveBirthTime(input: BirthTimeInput): BirthTimeResult {
  if (!record(input)) throw new BirthTimeError('invalid_input');
  const nominal = localTimestamp(input.date, input.time);
  const location = birthLocation(input.location);
  const disambiguation = input.disambiguation ?? 'reject';
  if (input.disambiguation !== undefined && !['reject', 'earlier', 'later'].includes(input.disambiguation)) {
    throw new BirthTimeError('invalid_disambiguation');
  }
  const zone = TIME_ZONE_DATA[location.timeZone];
  const candidates: BirthTimeCandidate[] = [];
  // Test against actual UTC intervals. This also handles second-level offsets,
  // half-hour transitions, date-line changes and transitions outside midnight.
  for (let index = 0; index < zone.transitions.length; index++) {
    const utcOffsetSeconds = zone.offsets[index];
    const timestamp = nominal - utcOffsetSeconds * 1000;
    const start = zone.transitions[index] * 1000;
    const end = (zone.transitions[index + 1] ?? TZDB_END) * 1000;
    if (timestamp >= start && timestamp < end) {
      candidates.push({ instant: new Date(timestamp).toISOString(), timestamp, utcOffsetSeconds });
    }
  }
  candidates.sort((a, b) => a.timestamp - b.timestamp);
  if (candidates.length === 0) throw new BirthTimeError('nonexistent_time');
  if (candidates.length > 1 && disambiguation === 'reject') {
    throw new BirthTimeError('ambiguous_time', candidates);
  }
  const resolution = candidates.length === 1 ? 'unique' : disambiguation as 'earlier' | 'later';
  const candidate = resolution === 'later' ? candidates[candidates.length - 1] : candidates[0];
  return {
    ...candidate,
    localDateTime: new Date(nominal).toISOString().slice(0, -1),
    timeZone: location.timeZone, location, tzdbVersion: TZDB_VERSION, resolution,
  };
}
