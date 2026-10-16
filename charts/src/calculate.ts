import { resolveDateTime } from './datetime.ts';
import { ChartError, getMessages } from './locales.ts';
import type {
  AspectAngle, BodyKey, BodyPosition, ChartAspect, ChartCalculator, ChartData, ChartHouses,
  ChartKind, ChartLocale, ChartLocation, ElementKey, HouseCusps, HouseNumber, HouseSystem,
  NatalChartInput, PlanetaryChartInput, ZodiacSign,
} from './types.ts';
import type { CalcResult, PlanetPos } from '../../pkg/celestial_wasm.js';

export type ChartWasmApi = Pick<typeof import('../../pkg/celestial_wasm.js'),
  'constants' | 'julday' | 'calcUtMany' | 'houses' | 'normDeg' | 'lonToSign'
  | 'planetHouseNumber' | 'calcChartAspectsAuto' | 'setDeltaTUserdef'>;

export const DEFAULT_BODIES: readonly BodyKey[] = Object.freeze([
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
]);

const aspectAngles: AspectAngle[] = [0, 60, 90, 120, 180];
const signElements: readonly ElementKey[] = ['fire', 'earth', 'air', 'water', 'fire', 'earth',
  'air', 'water', 'fire', 'earth', 'air', 'water'];

function bodyIds(api: ChartWasmApi): Record<BodyKey, number> {
  const k = api.constants();
  return { sun: k.SUN, moon: k.MOON, mercury: k.MERCURY, venus: k.VENUS, mars: k.MARS,
    jupiter: k.JUPITER, saturn: k.SATURN, uranus: k.URANUS, neptune: k.NEPTUNE,
    pluto: k.PLUTO, trueNode: k.TRUE_NODE, chiron: k.CHIRON };
}

function selectedBodies(input: PlanetaryChartInput, ids: Record<BodyKey, number>): readonly BodyKey[] {
  const selected = input.bodies ?? DEFAULT_BODIES;
  if (!Array.isArray(selected) || selected.length === 0
    || selected.some(key => !Object.hasOwn(ids, key)) || new Set(selected).size !== selected.length) {
    throw new ChartError('invalidBodies', input.locale);
  }
  return selected;
}

function locationOf(location: ChartLocation | undefined, required: boolean, locale: ChartLocale): ChartLocation | undefined {
  if (location === undefined && !required) return undefined;
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)
    || Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
    throw new ChartError('invalidLocation', locale);
  }
  if (location.label !== undefined && typeof location.label !== 'string') throw new ChartError('invalidLocation', locale);
  return { ...location };
}

function houseSystemOf(input: PlanetaryChartInput): HouseSystem {
  const system = input.houseSystem ?? 'P';
  if (!['P', 'W', 'E'].includes(system)) throw new ChartError('invalidHouseSystem', input.locale);
  return system;
}

function julianDay(api: ChartWasmApi, date: Date): number {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60
    + date.getUTCSeconds() / 3600 + date.getUTCMilliseconds() / 3_600_000;
  const result = api.julday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hour, 1);
  if (!Number.isFinite(result)) throw new ChartError('calculationFailed');
  return result;
}

function calculateHouses(api: ChartWasmApi, jd: number, location: ChartLocation, system: HouseSystem): ChartHouses {
  const result = api.houses(jd, location.latitude, location.longitude, system.charCodeAt(0));
  if (result.cusps.length !== 13 || result.ascmc.length !== 10
    || ![...result.cusps, ...result.ascmc].every(Number.isFinite)) throw new ChartError('calculationFailed');
  return { cusps: result.cusps.slice() as HouseCusps, ascendant: result.ascmc[0],
    midheaven: result.ascmc[1], system };
}

function successfulPosition(result: CalcResult): PlanetPos {
  if (result.status !== 'ok') throw new ChartError('calculationFailed', 'pt-BR', { cause: result.value });
  const position = result.value;
  if (![position.lon, position.lat, position.dist, position.speedLon].every(Number.isFinite)) {
    throw new ChartError('calculationFailed');
  }
  return position;
}

function bodyPosition(api: ChartWasmApi, key: BodyKey, id: number, result: CalcResult, houses?: ChartHouses): BodyPosition {
  const position = successfulPosition(result);
  const longitude = api.normDeg(position.lon);
  const [sign, degreeInSign] = api.lonToSign(longitude);
  if (!Number.isInteger(sign) || sign < 0 || sign > 11
    || !Number.isFinite(degreeInSign) || degreeInSign < 0 || degreeInSign >= 30) throw new ChartError('calculationFailed');
  const body: BodyPosition = { id, key, longitude, latitude: position.lat, distance: position.dist,
    speedLongitude: position.speedLon, retrograde: position.speedLon < 0,
    sign: sign as ZodiacSign, degreeInSign };
  if (houses) body.house = houseOf(api, longitude, houses.cusps);
  return body;
}

function houseOf(api: ChartWasmApi, longitude: number, cusps: HouseCusps): HouseNumber {
  const house = api.planetHouseNumber(longitude, cusps);
  if (!Number.isInteger(house) || house < 1 || house > 12) throw new ChartError('calculationFailed');
  return house as HouseNumber;
}

function positions(api: ChartWasmApi, jd: number, keys: readonly BodyKey[], ids: Record<BodyKey, number>, houses?: ChartHouses): BodyPosition[] {
  const k = api.constants();
  const results = api.calcUtMany(jd, keys.map(key => ids[key]), k.FLG_BUILTIN | k.FLG_SPEED);
  if (results.length !== keys.length) throw new ChartError('calculationFailed');
  return results.map((result, index) => bodyPosition(api, keys[index], ids[keys[index]], result, houses));
}

function chartAspects(api: ChartWasmApi, bodies: BodyPosition[]): ChartAspect[] {
  const packed = bodies.flatMap(body => [body.id, body.longitude, body.speedLongitude]);
  return api.calcChartAspectsAuto(packed, aspectAngles).map(row => {
    if (row.length !== 5 || !row.every(Number.isFinite) || !aspectAngles.includes(row[2] as AspectAngle)) {
      throw new ChartError('calculationFailed');
    }
    return { body1: row[0], body2: row[1], angle: row[2] as AspectAngle, orb: row[3], applying: row[4] !== 0 };
  });
}

function elements(bodies: BodyPosition[]): Record<ElementKey, number> {
  const counts: Record<ElementKey, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const body of bodies) counts[signElements[body.sign]] += 1;
  return counts;
}

function fromCore(api: ChartWasmApi, kind: ChartKind, input: PlanetaryChartInput): ChartData {
  const locale = input.locale ?? 'pt-BR';
  getMessages(locale);
  const location = locationOf(input.location, kind === 'natal', locale);
  const resolved = resolveDateTime(input, locale);
  const system = houseSystemOf(input);
  const ids = bodyIds(api);
  const keys = selectedBodies(input, ids);
  const jd = julianDay(api, resolved.date);
  api.setDeltaTUserdef(NaN);
  const houses = kind === 'natal' ? calculateHouses(api, jd, location!, system) : undefined;
  const bodies = positions(api, jd, keys, ids, houses);
  const result: ChartData = { kind, instant: resolved.instant, displayDateTime: resolved.displayDateTime,
    timeZone: resolved.timeZone, julianDay: jd, bodies, aspects: chartAspects(api, bodies), elements: elements(bodies) };
  if (location) result.location = location;
  if (houses) result.houses = houses;
  return result;
}

function calculate(api: ChartWasmApi, kind: ChartKind, input: PlanetaryChartInput): ChartData {
  if (!input || typeof input !== 'object') throw new ChartError('invalidDateTime');
  try {
    return fromCore(api, kind, input);
  } catch (error) {
    if (error instanceof ChartError) throw new ChartError(error.code, input.locale, { cause: error.cause });
    throw new ChartError('calculationFailed', input.locale, { cause: error });
  }
}

/** The injected WASM instance belongs to this calculator; every calculation selects automatic ΔT. */
export function createChartCalculator(api: ChartWasmApi): ChartCalculator {
  function natal(input: NatalChartInput): ChartData {
    return calculate(api, 'natal', input);
  }
  function planetary(input: PlanetaryChartInput): ChartData {
    return calculate(api, 'planetary', input);
  }
  return { natal, planetary };
}
