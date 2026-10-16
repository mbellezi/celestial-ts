import { createChartCalculator } from '../../pkg/charts/index.js';
import type { BodyPosition, ChartData, ChartHouses, ChartLocation, HouseNumber } from '../../pkg/charts/index.js';
import { LruCache } from './cache.ts';
import { resolveDateTime } from './datetime.ts';
import { NATAL_CATALOG_VERSION, NATAL_LABELS, resolveNatalInterpretation } from './natal-catalog.ts';
import { renderNatalReportHTML, renderNatalReportJSON, renderNatalReportMarkdown, renderNatalReportText } from './natal-render.ts';
import { NATAL_ASPECT_ANGLES, NATAL_BODIES } from './natal-types.ts';
import type { NatalAspect, NatalAspectAngle, NatalBody, NatalEvidence, NatalPoint, NatalReading, NatalRegent, NatalRenderOptions, NatalReport, NatalReportInput, NatalReportOptions, NatalSection } from './natal-types.ts';

export type NatalWasmApi = Parameters<typeof createChartCalculator>[0];
export const NATAL_REPORT_VERSION = '1.0.0';
export const DEFAULT_NATAL_ORBS: Readonly<Record<NatalAspectAngle, number>> = Object.freeze({ 0: 8, 30: 2, 45: 2, 60: 5, 90: 6, 120: 6, 135: 2, 150: 3, 180: 8 });
const ids: Record<string, number> = Object.freeze({ sun: 0, moon: 1, mercury: 2, venus: 3, mars: 4, jupiter: 5, saturn: 6, uranus: 7, neptune: 8, pluto: 9, trueNode: 11, chiron: 15 });
const traditional: readonly NatalBody[] = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
const modern: Partial<Record<number, NatalBody>> = { 7: 'pluto', 10: 'uranus', 11: 'neptune' };
const minor = new Set<number>([30, 45, 135, 150]);
const normalizeAngle = (value: number): number => ((value % 360) + 360) % 360;
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function invalid(detail: string): never { throw new RangeError(`Relatório natal: ${detail}.`); }
function checkName(name: unknown): asserts name is string | undefined {
  if (name !== undefined && typeof name !== 'string') invalid('nome inválido');
}
function checkRange(epoch: number): void {
  if (epoch < Date.UTC(1930, 0, 1) || epoch >= Date.UTC(2041, 0, 1)) invalid('instante fora do intervalo de 1930 a 2040');
}
function checkLocation(location: unknown): asserts location is ChartLocation {
  if (!isObject(location) || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)
    || Math.abs(location.latitude as number) > 90 || Math.abs(location.longitude as number) > 180
    || (location.label !== undefined && typeof location.label !== 'string')) invalid('coordenadas inválidas');
}
function longitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 360;
}
function houseOf(value: number, houses: ChartHouses): HouseNumber {
  for (let house = 1; house <= 12; house++) {
    const start = houses.cusps[house];
    const end = houses.cusps[house === 12 ? 1 : house + 1];
    if (start < end ? value >= start && value < end : value >= start || value < end) return house as HouseNumber;
  }
  return invalid('longitude sem casa correspondente');
}

export function normalizeNatalOptions(options: NatalReportOptions = {}): { includeMinorAspects: boolean; orbs: Record<NatalAspectAngle, number> } {
  if (!isObject(options) || Object.keys(options).some(key => !['includeMinorAspects', 'orbs'].includes(key))) invalid('opções inválidas');
  if (options.includeMinorAspects !== undefined && typeof options.includeMinorAspects !== 'boolean') invalid('includeMinorAspects deve ser booleano');
  const orbs = { ...DEFAULT_NATAL_ORBS };
  if (options.orbs !== undefined) {
    if (!isObject(options.orbs)) invalid('orbes inválidos');
    for (const [key, value] of Object.entries(options.orbs)) {
      if (!NATAL_ASPECT_ANGLES.some(angle => String(angle) === key) || typeof value !== 'number'
        || !Number.isFinite(value) || value < 0 || value > 12) invalid('orbes devem estar entre 0 e 12 graus');
      orbs[Number(key) as NatalAspectAngle] = value;
    }
  }
  return { includeMinorAspects: options.includeMinorAspects ?? true, orbs };
}

function validatedChart(chart: ChartData): NatalReport['chart'] {
  if (!isObject(chart) || chart.kind !== 'natal') invalid('é necessário um mapa natal');
  if (typeof chart.instant !== 'string' || typeof chart.timeZone !== 'string') invalid('data ou fuso inválido');
  const resolved = resolveDateTime({ instant: chart.instant, timeZone: chart.timeZone });
  checkRange(resolved.date.getTime());
  if (!Number.isFinite(chart.julianDay) || Math.abs(chart.julianDay - (resolved.date.getTime() / 86_400_000 + 2440587.5)) > 1e-7) invalid('dia juliano incompatível com o instante');
  checkLocation(chart.location);
  const location: ChartLocation = { latitude: chart.location.latitude, longitude: chart.location.longitude };
  if (chart.location.label !== undefined) location.label = chart.location.label;
  const sourceHouses = chart.houses;
  if (!isObject(sourceHouses) || !['P', 'E', 'W'].includes(sourceHouses.system)
    || !Array.isArray(sourceHouses.cusps) || sourceHouses.cusps.length !== 13
    || ![...sourceHouses.cusps].every(longitude) || !longitude(sourceHouses.ascendant) || !longitude(sourceHouses.midheaven)) invalid('casas ou ângulos inválidos');
  const houses: ChartHouses = { system: sourceHouses.system, cusps: [...sourceHouses.cusps] as ChartHouses['cusps'], ascendant: sourceHouses.ascendant, midheaven: sourceHouses.midheaven };
  if (houses.cusps[0] !== 0) invalid('sentinela das cúspides inválida');
  const angularDistance = (first: number, second: number): number => Math.min(Math.abs(first - second), 360 - Math.abs(first - second));
  const expectedFirstCusp = houses.system === 'W' ? Math.floor(houses.ascendant / 30) * 30 : houses.ascendant;
  if (angularDistance(houses.cusps[1], expectedFirstCusp) > 1e-7) invalid('Ascendente incompatível com a primeira cúspide');
  if (houses.system === 'P' && angularDistance(houses.cusps[10], houses.midheaven) > 1e-7) invalid('Meio do Céu incompatível com a décima cúspide');
  let circumference = 0;
  for (let house = 1; house <= 12; house++) {
    const span = normalizeAngle(houses.cusps[house === 12 ? 1 : house + 1] - houses.cusps[house]);
    if (span === 0) invalid('cúspides repetidas');
    if (houses.system !== 'P' && Math.abs(span - 30) > 1e-7) invalid('intervalos das cúspides incompatíveis com o sistema de casas');
    circumference += span;
  }
  if (Math.abs(circumference - 360) > 1e-7) invalid('ordem das cúspides inválida');
  for (let house = 1; house <= 6; house++) {
    if (Math.abs(normalizeAngle(houses.cusps[house + 6] - houses.cusps[house]) - 180) > 1e-7) invalid('cúspides opostas inconsistentes');
  }
  if (!Array.isArray(chart.bodies)) invalid('corpos inválidos');
  const keys = new Set<string>();
  const positions = new Map<string, BodyPosition>();
  for (const body of chart.bodies) {
    if (!isObject(body) || !Object.hasOwn(ids, body.key) || keys.has(body.key) || body.id !== ids[body.key]
      || !longitude(body.longitude) || !Number.isFinite(body.latitude) || Math.abs(body.latitude) > 90
      || !Number.isFinite(body.distance) || body.distance < 0 || !Number.isFinite(body.speedLongitude)
      || body.retrograde !== (body.speedLongitude < 0) || body.sign !== Math.floor(body.longitude / 30)
      || !Number.isFinite(body.degreeInSign) || body.degreeInSign < 0 || body.degreeInSign >= 30
      || Math.abs(body.degreeInSign - body.longitude % 30) > 1e-7
      || body.house !== houseOf(body.longitude, houses)) invalid('posição de corpo inválida ou inconsistente');
    keys.add(body.key);
    positions.set(body.key, { id: body.id, key: body.key, longitude: body.longitude, latitude: body.latitude,
      distance: body.distance, speedLongitude: body.speedLongitude, retrograde: body.retrograde,
      sign: body.sign, degreeInSign: body.degreeInSign, house: body.house });
  }
  if (NATAL_BODIES.some(key => !keys.has(key))) invalid('mapa incompleto: são necessários os dez corpos principais');
  const bodies = [...NATAL_BODIES, 'trueNode', 'chiron'].flatMap(key => positions.has(key) ? [positions.get(key)!] : []);
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const elementKeys = ['fire', 'earth', 'air', 'water'] as const;
  for (const body of bodies) elements[elementKeys[body.sign % 4]]++;
  return { kind: 'natal', instant: resolved.instant, timeZone: resolved.timeZone, displayDateTime: resolved.displayDateTime,
    julianDay: chart.julianDay, location, houses, bodies, elements };
}

function findAspects(chart: NatalReport['chart'], options: ReturnType<typeof normalizeNatalOptions>): NatalAspect[] {
  const points: { key: NatalPoint; longitude: number }[] = chart.bodies.filter(body => body.key !== 'chiron')
    .map(body => ({ key: body.key as NatalPoint, longitude: body.longitude }));
  points.push({ key: 'ascendant', longitude: chart.houses.ascendant }, { key: 'midheaven', longitude: chart.houses.midheaven });
  const aspects: NatalAspect[] = [];
  for (let first = 0; first < points.length; first++) for (let second = first + 1; second < points.length; second++) {
    const a = points[first], b = points[second];
    if ((a.key === 'trueNode' && (b.key === 'ascendant' || b.key === 'midheaven')) || (a.key === 'ascendant' && b.key === 'midheaven')) continue;
    const difference = Math.abs(a.longitude - b.longitude);
    const separation = Math.min(difference, 360 - difference);
    const angle = NATAL_ASPECT_ANGLES.filter(value => (options.includeMinorAspects || !minor.has(value)) && Math.abs(separation - value) <= options.orbs[value])
      .sort((a, b) => Math.abs(separation - a) - Math.abs(separation - b) || a - b)[0];
    if (angle === undefined) continue;
    const orb = Math.abs(separation - angle), maxOrb = options.orbs[angle];
    const interpretationKey = `aspect:${a.key}:${b.key}:${angle}`;
    aspects.push({ id: interpretationKey, first: a.key, second: b.key, angle, separation, orb, maxOrb,
      relativeOrb: maxOrb === 0 ? 0 : orb / maxOrb, interpretationKey });
  }
  return aspects;
}

/** Interpret a complete calculated natal chart without consulting or modifying a WASM instance. */
export function interpretNatalChart(chart: ChartData, options: NatalReportOptions & { name?: string } = {}): NatalReport {
  if (!isObject(options)) invalid('opções inválidas');
  const { name, ...interpretationOptions } = options;
  checkName(name);
  const normalized = normalizeNatalOptions(interpretationOptions);
  const canonicalChart = validatedChart(chart);
  const aspects = findAspects(canonicalChart, normalized);
  const readings: NatalReading[] = [];
  const interpretations: NatalReport['interpretations'] = {};
  function reading(kind: NatalReading['kind'], key: string, evidence: NatalEvidence): string {
    if (!Object.hasOwn(interpretations, key)) interpretations[key] = resolveNatalInterpretation(key);
    readings.push({ id: key, kind, interpretationKey: key, evidence });
    return key;
  }
  const sections: NatalSection[] = [];
  function section(id: NatalSection['id'], readingIds: string[], point?: NatalPoint): void {
    sections.push({ id, title: NATAL_LABELS.sectionTitles[id], readingIds,
      relatedAspectIds: point ? aspects.filter(aspect => aspect.first === point || aspect.second === point).map(aspect => aspect.id) : [] });
  }
  for (const point of ['ascendant', 'midheaven'] as const) {
    const value = canonicalChart.houses[point], sign = Math.floor(value / 30);
    section(point, [reading(point, `${point}:${sign}`, { points: [point], longitude: value, sign, house: houseOf(value, canonicalChart.houses) })], point);
  }
  for (const key of NATAL_BODIES) {
    const body = canonicalChart.bodies.find(value => value.key === key)!;
    const evidence: NatalEvidence = { points: [key], longitude: body.longitude, sign: body.sign, house: body.house,
      speedLongitude: body.speedLongitude, retrograde: body.retrograde };
    const entries = [reading('sign', `sign:${key}:${body.sign}`, evidence), reading('house', `house:${key}:${body.house}`, evidence)];
    if (key !== 'sun' && key !== 'moon' && body.retrograde) entries.push(reading('retrograde', `retrograde:${key}`, evidence));
    section(key, entries, key);
  }
  const node = canonicalChart.bodies.find(body => body.key === 'trueNode');
  if (node) {
    const southNodeLongitude = normalizeAngle(node.longitude + 180);
    const evidence: NatalEvidence = { points: ['trueNode'], longitude: node.longitude, sign: node.sign, house: node.house,
      speedLongitude: node.speedLongitude, retrograde: node.retrograde, southNodeLongitude,
      southNodeSign: Math.floor(southNodeLongitude / 30), southNodeHouse: houseOf(southNodeLongitude, canonicalChart.houses) };
    section('nodes', [reading('nodeSign', `nodeSign:${node.sign}`, evidence), reading('nodeHouse', `nodeHouse:${node.house}`, evidence)], 'trueNode');
  }
  section('aspects', aspects.map(aspect => reading('aspect', aspect.interpretationKey, { points: [aspect.first, aspect.second], aspectId: aspect.id })));
  const regents: NatalRegent[] = (['ascendant', 'midheaven'] as const).map(point => {
    const sign = Math.floor(canonicalChart.houses[point] / 30);
    const rulers = [traditional[sign], ...(modern[sign] ? [modern[sign]!] : [])];
    return { point, sign, traditional: traditional[sign], ...(modern[sign] ? { modern: modern[sign] } : {}),
      readingIds: readings.filter(entry => entry.evidence.points.some(key => rulers.includes(key as NatalBody))).map(entry => entry.id) };
  });
  return { version: NATAL_REPORT_VERSION, catalogVersion: NATAL_CATALOG_VERSION, locale: 'pt-BR', reference: 'western-tropical-geocentric', scope: 'natal-psychological',
    ...(name !== undefined ? { name } : {}), title: NATAL_LABELS.title, introduction: NATAL_LABELS.introduction, methodology: NATAL_LABELS.methodology,
    disclaimer: NATAL_LABELS.disclaimer, authorship: { model: 'gpt-6-astra', skill: 'humanizar-pt-br', generation: 'static-editorial-catalog' },
    chart: canonicalChart, calculation: { supportedYears: [1930, 2040], ...normalized, houseAssignment: 'ecliptic-longitude', node: 'true' },
    coverage: { nodesIncluded: !!node, unsupportedBodies: canonicalChart.bodies.filter(body => body.key === 'chiron').map(body => body.key), readingCount: readings.length, aspectCount: aspects.length },
    regents, aspects, sections, readings, interpretations };
}

function normalizedInput(input: NatalReportInput): NatalReportInput {
  if (!isObject(input)) invalid('entrada inválida');
  checkName(input.name);
  checkLocation(input.location);
  if (input.houseSystem !== undefined && !['P', 'E', 'W'].includes(input.houseSystem)) invalid('sistema de casas inválido');
  const resolved = resolveDateTime(input);
  checkRange(resolved.date.getTime());
  const location: ChartLocation = { latitude: input.location.latitude, longitude: input.location.longitude };
  if (input.location.label !== undefined) location.label = input.location.label;
  return { instant: resolved.instant, timeZone: resolved.timeZone, location, houseSystem: input.houseSystem ?? 'P', ...(input.name !== undefined ? { name: input.name } : {}) };
}

/** Caches belong to one WASM instance. Clear them after changing its calculation configuration. */
export function createNatalReportGenerator(core: NatalWasmApi, options: { cacheSize?: number } = {}) {
  const calculator = createChartCalculator(core);
  const reports = new LruCache<NatalReport>(options.cacheSize ?? 128, 8 * 1024 * 1024);
  function report(input: NatalReportInput, interpretationOptions: NatalReportOptions = {}): NatalReport {
    const request = normalizedInput(input), normalized = normalizeNatalOptions(interpretationOptions);
    const key = JSON.stringify([NATAL_REPORT_VERSION, NATAL_CATALOG_VERSION, request, normalized]);
    const cached = reports.get(key);
    if (cached) return structuredClone(cached);
    const chart = calculator.natal({ ...request, locale: 'pt-BR', bodies: [...NATAL_BODIES, 'trueNode'] });
    const result = interpretNatalChart(chart, { ...normalized, name: request.name });
    reports.set(key, result, (key.length + JSON.stringify(result).length) * 2);
    return structuredClone(result);
  }
  return { report,
    reportJSON(input: NatalReportInput, options: NatalReportOptions = {}, space?: number): string {
      if (space !== undefined && (!Number.isInteger(space) || space < 0 || space > 10)) invalid('space deve ser inteiro entre 0 e 10');
      return renderNatalReportJSON(report(input, options), space);
    },
    reportText(input: NatalReportInput, options: NatalReportOptions = {}, renderOptions: NatalRenderOptions = {}): string {
      return renderNatalReportText(report(input, options), renderOptions);
    },
    reportMarkdown(input: NatalReportInput, options: NatalReportOptions = {}, renderOptions: NatalRenderOptions = {}): string {
      return renderNatalReportMarkdown(report(input, options), renderOptions);
    },
    reportHTML(input: NatalReportInput, options: NatalReportOptions = {}, renderOptions: NatalRenderOptions = {}): string {
      return renderNatalReportHTML(report(input, options), renderOptions);
    },
    clearCache(): void { reports.clear(); },
    get cacheStats() { return { reports: reports.stats }; },
  };
}
