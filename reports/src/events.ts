import eclipseCatalog from '../data/eclipses.json' with { type: 'json' };
import type { AspectAngle, ReportBody, ReportEvent } from './types.ts';
import type { LruCache } from './cache.ts';
export type ReportWasmApi = Pick<typeof import('../../pkg/celestial_wasm.js'), 'constants' | 'calcUtMany' | 'setDeltaTUserdef'>;
export interface DetectionRequest {
  startMs: number;
  endMs: number;
  bodies: readonly ReportBody[];
  orbs: Record<AspectAngle, number>;
}
const DAY = 86400000, EPOCH = 2440587.5;
const ORDER: readonly ReportBody[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const ANGLES: AspectAngle[] = [0, 60, 90, 120, 180];
const jd = (ms: number) => ms / DAY + EPOCH;
const iso = (t: number) => new Date(Math.round((t - EPOCH) * DAY)).toISOString();
const wrap = (v: number) => ((v + 180) % 360 + 360) % 360 - 180;
type Position = {
  lon: number;
  speedLon: number;
};
/** Refine to about 0.1 ms, retaining millisecond query boundaries exactly.
 * Numerical resolution does not imply corresponding ephemeris accuracy. */
function root(f: (t: number) => number, a: number, b: number): number {
  let fa = f(a);
  if (Math.abs(fa) < 1e-10)
    return a;
  for (let i = 0; i < 48 && b - a > 1e-9; i++) {
    const m = a + (b - a) / 2;
    if (m === a || m === b) break;
    const fm = f(m);
    if (Math.abs(fm) < 1e-10)
      return m;
    if ((fa < 0) === (fm < 0)) {
      a = m;
      fa = fm;
    }
    else
      b = m;
  }
  return (a + b) / 2;
}
function unique(xs: number[]): number[] {
  return xs.sort((a, b) => a - b).filter((v, i, a) => !i || v !== a[i - 1]);
}
/** Fixed mesh plus derivative turning points prevents losing grazing orb intervals. */
function detectWindow(core: ReportWasmApi, request: DetectionRequest, cache: LruCache<unknown>): ReportEvent[] {
  core.setDeltaTUserdef(NaN);
  const k = core.constants(), ids = ORDER.map(b => k[b.toUpperCase() as keyof typeof k] as number);
  const start = jd(request.startMs), end = jd(request.endMs), result: ReportEvent[] = [];
  // Only flags explicit here: tropical, geocentric ecliptic positions, with speeds.
  const flags = k.FLG_BUILTIN | k.FLG_SPEED;
  const meshSamples = new Map<number, Position[]>();
  const frame = (t: number, indices: readonly number[]): Position[] => {
    const coarse = meshSamples.get(t);
    if (coarse) return coarse;
    const key = `events:v2:${t}`;
    const values = (cache.get(key) as Position[] | undefined) ?? [];
    const missing = indices.filter(index => values[index] === undefined);
    if (missing.length) {
      const computed = core.calcUtMany(t, missing.map(index => ids[index]), flags);
      computed.forEach((position, offset) => {
        if (position.status !== 'ok' || !Number.isFinite(position.value.lon)
          || !Number.isFinite(position.value.speedLon)) {
          throw new Error('Ephemeris calculation failed');
        }
        values[missing[offset]] = { lon: position.value.lon, speedLon: position.value.speedLon };
      });
      cache.set(key, values, JSON.stringify(values).length * 2);
    }
    return values;
  };
  const pos = (t: number, index: number): Position => frame(t, [index])[index];
  const required = ORDER.map((body, index) => ({ body, index }))
    .filter(({ body }) => body === 'sun' || body === 'moon' || request.bodies.includes(body))
    .map(({ index }) => index);
  const base: number[] = [start];
  for (let t = start + .25; t < end; t += .25)
    base.push(t);
  base.push(end);
  for (const t of base)
    meshSamples.set(t, frame(t, required));
  const add = (kind: ReportEvent['kind'], key: string, bodies: ReportBody[], a: number, b: number, exact: number[], details: Record<string, string | number | boolean>, left = false, right = false) => {
    result.push({
      id: `${key}:${iso(a)}`,
      kind,
      catalogKey: key,
      bodies,
      start: iso(a),
      end: iso(b),
      exact: unique(exact).map(iso),
      details: { ...details, ...(a !== b ? { durationScope: 'within-requested-range', ...(!left ? { fullStart: iso(a) } : {}), ...(!right ? { fullEnd: iso(b) } : {}) } : {}) },
      boundary: { startClipped: left, endClipped: right }
    });
  };
  const crossings = (f: (t: number) => number, mesh: number[], guard = Infinity): number[] => {
    const roots: number[] = [];
    for (let i = 1; i < mesh.length; i++) {
      const a = mesh[i - 1], b = mesh[i], fa = f(a), fb = f(b);
      if (Math.abs(fa) < 1e-9)
        roots.push(a);
      if (fa * fb < 0 && Math.abs(fa - fb) < guard)
        roots.push(root(f, a, b));
    }
    if (Math.abs(f(mesh.at(-1)!)) < 1e-9)
      roots.push(mesh.at(-1)!);
    return unique(roots);
  };
  // A query endpoint is censored only when the interval continues beyond it.
  // Require both a geometric root and an outside probe, so nearby roots do not
  // turn an ordinary clipped query into a claim of a physical boundary.
  const PROBE = 1e-6;
  const clipped = (t: number, direction: -1 | 1, f: (t: number) => number,
    accept: (t: number) => boolean): boolean =>
    !(Math.abs(f(t)) < 1e-9 && !accept(t + direction * PROBE));
  const intervals = (f: (t: number) => number, mesh: number[], accept: (t: number) => boolean, emit: (a: number, b: number, left: boolean, right: boolean) => void) => {
    const cuts = unique([start, ...crossings(f, mesh), end]);
    for (let i = 1; i < cuts.length; i++) {
      const a = cuts[i - 1], b = cuts[i];
      if (accept((a + b) / 2))
        emit(a, b, a === start && clipped(a, -1, f, accept),
          b === end && clipped(b, 1, f, accept));
    }
  };
  for (const body of request.bodies) {
    const bi = ORDER.indexOf(body);
    const lon = (t: number) => pos(t, bi).lon;
    const speed = (t: number) => pos(t, bi).speedLon;
    const stations = crossings(speed, base);
    for (const t of stations) {
      const direction = speed(t + 1e-4) < 0 ? 'retrograde' : 'direct';
      add('station', `station:${body}:${direction}`, [body], t, t, [t], { direction });
    }
    const retrograde: {
      a: number;
      b: number;
      left: boolean;
      right: boolean;
    }[] = [];
    intervals(speed, base, t => speed(t) < 0, (a, b, left, right) => retrograde.push({
      a, b, left, right
    }));
    const mesh = unique([...base, ...stations]);
    for (let sign = 0; sign < 12; sign++) {
      const boundary = (t: number) => Math.sin((lon(t) - sign * 30) * Math.PI / 180);
      const cuts = unique([start, end, ...crossings(boundary, mesh), ...crossings(t => Math.sin((lon(t) - (sign + 1) * 30) * Math.PI / 180), mesh)]);
      for (let i = 1; i < cuts.length; i++) {
        const a = cuts[i - 1], b = cuts[i];
        if (Math.floor(((lon((a + b) / 2) % 360) + 360) % 360 / 30) === sign) {
          const inSign = (t: number) => Math.floor(((lon(t) % 360) + 360) % 360 / 30) === sign;
          const cuspDistance = (t: number) => Math.min(Math.abs(wrap(lon(t) - sign * 30)),
            Math.abs(wrap(lon(t) - (sign + 1) * 30)));
          const left = a === start && clipped(a, -1, cuspDistance, inSign);
          const right = b === end && clipped(b, 1, cuspDistance, inSign);
          add('sign', `sign:${body}:${sign}`, [body], a, b, left ? [] : [a], { sign }, left, right);
          for (const retro of retrograde) {
            const s = Math.max(a, retro.a), e = Math.min(b, retro.b);
            if (e > s)
              add('retrograde', `retrograde:${body}:${sign}`, [body], s, e, stations.filter(t => t >= s && t <= e), { direction: 'retrograde', interval: true, sign },
                s === start && left && retro.left, e === end && right && retro.right);
          }
        }
      }
    }
  }
  const bodies = ORDER.filter(b => request.bodies.includes(b));
  for (let i = 0; i < bodies.length; i++)
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j], ai = ORDER.indexOf(a), bi = ORDER.indexOf(b);
      const delta = (t: number) => wrap(pos(t, bi).lon - pos(t, ai).lon);
      const relativeSpeed = (t: number) => pos(t, bi).speedLon - pos(t, ai).speedLon;
      const mesh = unique([...base, ...crossings(relativeSpeed, base)]);
      for (const angle of ANGLES) {
        const orb = request.orbs[angle];
        const error = (t: number) => Math.abs(delta(t)) - angle;
        const exact = unique([...crossings(t => wrap(delta(t) - angle), mesh, 180), ...crossings(t => wrap(delta(t) + angle), mesh, 180)]);
        const aspectMesh = unique([...mesh, ...exact]);
        const f = (t: number) => Math.abs(error(t)) - orb;
        intervals(f, aspectMesh, t => f(t) <= 0, (s, e, l, r) => add('aspect', `aspect:${a}:${b}:${angle}`, [a, b], s, e, exact.filter(t => t >= s && t <= e), { angle, orb }, l, r));
      }
    }
  // Phases use directed elongation, so new and full moons are distinct roots.
  const moon = ORDER.indexOf('moon'), sun = ORDER.indexOf('sun');
  for (const [phase, angle] of [['new', 0], ['firstQuarter', 90], ['full', 180], ['lastQuarter', 270]] as const) {
    const f = (t: number) => wrap(pos(t, moon).lon - pos(t, sun).lon - angle);
    for (const t of crossings(f, base, 180)) {
      const sign = Math.floor(pos(t, moon).lon / 30);
      add('phase', `phase:${phase}:${sign}`, ['sun', 'moon'], t, t, [t], { phase, angle, sign });
    }
  }
  return result.sort((a, b) => a.start.localeCompare(b.start) || a.catalogKey.localeCompare(b.catalogKey));
}
/** Process at most 32 days at once; preserve continuous intervals across windows. */
export function detectEvents(core: ReportWasmApi, request: DetectionRequest, cache: LruCache<unknown>): ReportEvent[] {
  if (!Number.isFinite(request.startMs) || !Number.isFinite(request.endMs) || request.endMs <= request.startMs)
    throw new RangeError('Invalid detection range');
  const result: ReportEvent[] = [], last = new Map<string, ReportEvent>(), seen = new Set<string>();
  for (let start = request.startMs; start < request.endMs; start += 32 * DAY) {
    const end = Math.min(request.endMs, start + 32 * DAY);
    for (const event of detectWindow(core, { ...request, startMs: start, endMs: end }, cache)) {
      if (event.start === event.end && Date.parse(event.start) >= request.endMs)
        continue;
      if (seen.has(event.id))
        continue;
      seen.add(event.id);
      const previous = last.get(event.catalogKey);
      if (previous && previous.end === event.start && previous.start !== previous.end && event.start !== event.end && previous.boundary.endClipped && event.boundary.startClipped) {
        previous.end = event.end;
        previous.exact = [...new Set([...previous.exact, ...event.exact])].sort();
        previous.boundary.endClipped = event.boundary.endClipped;
        if (event.details.fullEnd)
          previous.details.fullEnd = event.details.fullEnd;
      }
      else {
        result.push(event);
        last.set(event.catalogKey, event);
      }
    }
  }
  for (const eclipse of eclipseCatalog.events) {
    const physicalStart = Date.parse(eclipse.start), physicalEnd = Date.parse(eclipse.end), maximum = Date.parse(eclipse.maximum);
    if (physicalEnd <= request.startMs || physicalStart >= request.endMs)
      continue;
    const k = core.constants();
    const body = eclipse.category === 'solar' ? k.SUN : k.MOON;
    const key = `eclipse-sign:${maximum}:${body}`;
    let sign = cache.get(key) as number | undefined;
    if (sign === undefined) {
      const position = core.calcUtMany(jd(maximum), [body], k.FLG_BUILTIN | k.FLG_SPEED)[0];
      if (position.status !== 'ok')
        throw new Error('Eclipse sign calculation failed');
      sign = Math.floor(position.value.lon / 30);
      cache.set(key, sign, 8);
    }
    const catalogKey = `eclipse:${eclipse.category}:${sign}`;
    const details: ReportEvent['details'] = {
      category: eclipse.category,
      type: eclipse.type,
      sign,
      saros: eclipse.saros,
      source: eclipse.source,
      nasaSource: eclipse.nasaSource,
      timeScale: eclipse.timeScale,
      deltaTSeconds: eclipse.deltaTSeconds,
      fullStart: eclipse.start,
      fullEnd: eclipse.end,
      fullMaximum: eclipse.maximum,
      globalDurationSeconds: eclipse.globalDurationSeconds,
      durationScope: 'global P1–P4 contacts; local visibility duration varies',
      attribution: eclipseCatalog.attribution
    };
    if ('penumbralMinutes' in eclipse)
      details.penumbralMinutes = eclipse.penumbralMinutes!;
    if ('partialMinutes' in eclipse)
      details.partialMinutes = eclipse.partialMinutes!;
    if ('totalMinutes' in eclipse)
      details.totalMinutes = eclipse.totalMinutes!;
    for (const field of ['u1', 'u2', 'u3', 'u4', 'globalU1U4DurationSeconds', 'globalU2U3DurationSeconds'] as const) {
      if (field in eclipse && eclipse[field] !== undefined)
        details[field] = eclipse[field]!;
    }
    if ('centralDurationSeconds' in eclipse)
      details.centralDurationSeconds = eclipse.centralDurationSeconds!;
    result.push({
      id: `eclipse:${eclipse.category}:${eclipse.catalog}`,
      kind: 'eclipse',
      catalogKey,
      bodies: ['sun', 'moon'],
      start: new Date(Math.max(physicalStart, request.startMs)).toISOString(),
      end: new Date(Math.min(physicalEnd, request.endMs)).toISOString(),
      exact: maximum >= request.startMs && maximum < request.endMs ? [eclipse.maximum] : [],
      details,
      boundary: { startClipped: physicalStart < request.startMs, endClipped: physicalEnd > request.endMs }
    });
  }
  // Exact moments belong to the selected half-open interval. Do this only
  // after joining internal windows, retaining moments at their shared cuts.
  for (const event of result) {
    event.exact = event.exact.filter(instant => {
      const time = Date.parse(instant);
      return time >= request.startMs && time < request.endMs;
    });
  }
  return result.sort((a, b) => a.start.localeCompare(b.start) || a.catalogKey.localeCompare(b.catalogKey));
}
