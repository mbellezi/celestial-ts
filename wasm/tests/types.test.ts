import init, {
  type BaZiPillar,
  type CoreConstants,
  type HouseResult,
  type OrbitalElements,
  type PlanetPos,
  ayanamsaEx,
  calcUt,
  constants,
  coordTransformWithSpeed,
  degToCs,
  getOrbitalElements,
  houses,
  julday,
  makePillar,
  setSidMode,
  utcToJd,
} from '../../pkg/celestial_wasm.js';

async function typeContract(bytes: Uint8Array): Promise<void> {
  await init({ module_or_path: bytes });
  const values: CoreConstants = constants();
  const position: PlanetPos = calcUt(2451545, values.SUN, values.FLG_SPEED);
  const result: HouseResult = houses(2451545, 0, 0, 80);
  const elements: OrbitalElements = getOrbitalElements(2451545, 4, 2);
  const pillar: BaZiPillar = makePillar(0, 0);
  const integer: bigint = degToCs(12.9);
  const angle: number = ayanamsaEx(2451545, 0);
  setSidMode(1);
  julday(2000, 1, 1, 12);
  utcToJd({ year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 });
  coordTransformWithSpeed([0, 0, 1, 0, 0, 0], 23);
  void [position, result, elements, pillar, integer, angle];
  // @ts-expect-error body identifiers are numbers
  calcUt(2451545, 'Sun', 2);
  // @ts-expect-error centisecond i64 results retain bigint precision
  const lostPrecision: number = degToCs(12.9);
  void lostPrecision;
}

void typeContract;
