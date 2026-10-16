import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';
import { celestial as c } from './runtime.ts';
import type { ExportedFunctionName } from '../../pkg/celestial_wasm.js';

type Api = typeof c;
type OutputKind = 'number' | 'bigint' | 'boolean' | 'string' | 'array' | 'object' | 'null' | 'unit';
type ArgumentCases = {
  [Name in ExportedFunctionName]: { args: Parameters<Api[Name]>; kind: OutputKind };
};

const k = c.constants();
const jd = 2_451_545;
const flags = k.FLG_BUILTIN | k.FLG_SPEED;
const hsys = 'P'.charCodeAt(0);
const geo = [2.35, 48.85, 35];
const atmosphere = [1013, 15, 0.5, 0];
const observer = [36, 1, 0, 0, 0, 0];
const houseMidpoints = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const cusps = [0, ...houseMidpoints];
const aspectPositions = [k.SUN, 0, 1, k.MOON, 60, 13, k.MARS, 30, 0.5];
const utc = { year: 2000, month: 1, day: 1, hour: 12, minute: 34, second: 56 };
const omerJd = c.omerStartJd(5784);

const cases = {
  setEphePath: { args: [''], kind: 'unit' },
  setJplFile: { args: [''], kind: 'unit' },
  setSidMode: { args: [k.SIDM_FAGAN_BRADLEY, 0, 0], kind: 'unit' },
  setTopo: { args: [2.35, 48.85, 35], kind: 'unit' },
  close: { args: [], kind: 'unit' },
  calc: { args: [jd, k.MARS, flags], kind: 'object' },
  calcUt: { args: [jd, k.MARS, flags], kind: 'object' },
  nutation: { args: [jd], kind: 'array' },
  meanObliquity: { args: [jd], kind: 'number' },
  trueObliquity: { args: [jd], kind: 'number' },
  calcMany: { args: [jd, [k.SUN, k.MOON, k.MARS], flags], kind: 'array' },
  calcUtMany: { args: [jd, [k.SUN, k.MOON, k.MARS], flags], kind: 'array' },
  calcPctr: { args: [jd, k.MARS, k.SUN, flags], kind: 'object' },
  fixstar: { args: ['Sirius', jd, flags], kind: 'object' },
  fixstarUt: { args: ['Sirius', jd, flags], kind: 'object' },
  fixstarMag: { args: ['Sirius'], kind: 'number' },
  houses: { args: [jd, 48.85, 2.35, hsys], kind: 'object' },
  housesEx: { args: [jd, 48.85, 2.35, hsys, flags], kind: 'object' },
  housesEx2: { args: [jd, 48.85, 2.35, hsys, flags], kind: 'object' },
  houseName: { args: [hsys], kind: 'string' },
  solEclipseWhenGlob: { args: [2_460_310.5, flags, 0, false], kind: 'object' },
  solEclipseWhenLoc: { args: [2_460_310.5, geo, flags, false], kind: 'object' },
  solEclipseHow: { args: [2_460_409.26, geo, flags], kind: 'object' },
  solEclipseWhere: { args: [2_460_409.26, flags], kind: 'object' },
  lunEclipseWhen: { args: [2_460_310.5, flags, 0, false], kind: 'object' },
  lunEclipseHow: { args: [2_460_394.8, geo, flags], kind: 'object' },
  riseTrans: { args: [jd, k.SUN, flags, k.CALC_RISE, geo, 1013, 15], kind: 'object' },
  julday: { args: [2024, 1, 1, 12, 1], kind: 'number' },
  revjul: { args: [jd, 1], kind: 'object' },
  dayOfWeek: { args: [jd], kind: 'number' },
  deltat: { args: [jd], kind: 'number' },
  sidtime: { args: [jd], kind: 'number' },
  utcToJd: { args: [utc, 1], kind: 'object' },
  ayanamsa: { args: [jd], kind: 'number' },
  ayanamsaUt: { args: [jd], kind: 'number' },
  ayanamsaName: { args: [k.SIDM_FAGAN_BRADLEY], kind: 'string' },
  degMidp: { args: [10, 350], kind: 'number' },
  splitDeg: { args: [45.5, 0], kind: 'array' },
  coordTransform: { args: [[30, 10, 1], 23.44], kind: 'array' },
  azalt: { args: [jd, 0, geo, 1013, 15, [280, 0, 1]], kind: 'object' },
  refrac: { args: [10, 1013, 15, 0], kind: 'number' },
  refracExtended: { args: [10, 35, 1013, 15, 0.0065, 0], kind: 'object' },
  planetName: { args: [k.SUN], kind: 'string' },
  jdDuration: { args: [jd, jd + 1.5], kind: 'array' },
  jdToIsoString: { args: [jd, 1], kind: 'string' },
  mooncrossNode: { args: [jd, flags], kind: 'object' },
  mooncrossNodeUt: { args: [jd, flags], kind: 'object' },
  setDeltaTUserdef: { args: [NaN], kind: 'unit' },
  revjulHms: { args: [jd, 1], kind: 'array' },
  parseDatetime: { args: ['2000-01-01 12:34:56'], kind: 'array' },
  degsplit: { args: [45.5], kind: 'array' },
  antiscion: { args: [[30, 10, 1, 0.1, 0.2, 0.3], 90], kind: 'object' },
  matchAspect: { args: [0, 1, 59, 0, 60, 3], kind: 'array' },
  matchAspect2: { args: [0, 1, 59, 0, 60, 3], kind: 'array' },
  matchAspect3: { args: [0, 1, 59, 0, 60, 3, 3, 3], kind: 'array' },
  matchAspect4: { args: [0, 1, 59, 0, 60, 3, 3, 3], kind: 'array' },
  nextRetro: { args: [k.MERCURY, jd, false, 400, flags], kind: 'array' },
  nextAspect: { args: [k.SUN, 0, 0, jd, false, 400, flags], kind: 'array' },
  nextAspectWith: { args: [k.MOON, 0, k.SUN, jd, false, 400, flags], kind: 'array' },
  housePos: { args: [280, 48.85, 23.44, hsys, 2.35, 0], kind: 'number' },
  lunEclipseWhenLoc: { args: [2_460_310.5, geo, flags, false], kind: 'object' },
  fixstar2: { args: ['Sirius', jd, flags], kind: 'object' },
  fixstar2Ut: { args: ['Sirius', jd, flags], kind: 'object' },
  fixstar2Mag: { args: ['Sirius'], kind: 'number' },
  azaltRev: { args: [jd, 0, geo, 180, 30], kind: 'array' },
  signName: { args: [0], kind: 'string' },
  jdnow: { args: [], kind: 'number' },
  parseCoord: { args: ["48°52'N"], kind: 'number' },
  formatCoord: { args: [48.85, true], kind: 'string' },
  longToRasi: { args: [2.35], kind: 'number' },
  longToNavamsa: { args: [2.35], kind: 'number' },
  longToNakshatra: { args: [2.35], kind: 'array' },
  nakshatraName: { args: [0], kind: 'string' },
  ramanHouses: { args: [120, 280, false], kind: 'array' },
  residentialStrength: { args: [15, houseMidpoints], kind: 'number' },
  ochchabala: { args: [0, 120], kind: 'number' },
  naisargakaRelation: { args: [0, 1], kind: 'number' },
  saturnFourStars: { args: [jd, flags], kind: 'array' },
  version: { args: [], kind: 'string' },
  normDeg: { args: [361], kind: 'number' },
  diffDegSigned: { args: [350, 10], kind: 'number' },
  normCs: { args: [129600001], kind: 'number' },
  signIngressUt: { args: [k.SUN, jd, flags, false], kind: 'object' },
  retrogradeStationUt: { args: [k.MERCURY, jd, flags], kind: 'object' },
  arabicPart: { args: [120, 220, 280], kind: 'number' },
  transitToDegree: { args: [k.SUN, 0, jd, flags, false], kind: 'number' },
  mcTransitUt: { args: [k.SUN, jd, jd, 48.85, 2.35, hsys, flags, false], kind: 'number' },
  solarReturnJd: { args: [jd, 2024, flags], kind: 'number' },
  lunarReturnJd: { args: [jd, jd, flags], kind: 'number' },
  midpoint: { args: [350, 10], kind: 'number' },
  signRuler: { args: [0], kind: 'number' },
  signRulerModern: { args: [0], kind: 'number' },
  zodiacSignName: { args: [0], kind: 'string' },
  lonToSign: { args: [2.35], kind: 'array' },
  localApparentSolarTime: { args: [jd, 2.35], kind: 'number' },
  annualProfection: { args: [cusps, 25], kind: 'array' },
  vimshottariDasha: { args: [jd, 120, 120], kind: 'array' },
  omerFromJd: { args: [omerJd + 1], kind: 'object' },
  omerDayJd: { args: [5784, 1], kind: 'number' },
  omerStartJd: { args: [5784], kind: 'number' },
  omerDays: { args: [5784], kind: 'array' },
  omerPeriod: { args: [jd], kind: 'object' },
  omerDeclaration: { args: [1], kind: 'string' },
  jewishHolidays: { args: [5784], kind: 'array' },
  jewishHolidayJd: { args: [5784, 'Rosh Hashanah'], kind: 'number' },
  hebrewYearFromJd: { args: [jd], kind: 'number' },
  jdToHebrewDate: { args: [jd], kind: 'object' },
  easterGregorian: { args: [2024], kind: 'object' },
  easterOrthodox: { args: [2024], kind: 'object' },
  easterJd: { args: [2024], kind: 'number' },
  easterOrthodoxJd: { args: [2024], kind: 'number' },
  christianFeasts: { args: [2024], kind: 'array' },
  christianFixedFeasts: { args: [2024], kind: 'array' },
  hijriFromJd: { args: [jd], kind: 'object' },
  hijriToJd: { args: [1445, 1, 1], kind: 'number' },
  hijriMonthName: { args: [1], kind: 'string' },
  daysInHebrewYear: { args: [5784], kind: 'number' },
  monthsInHebrewYear: { args: [5784], kind: 'number' },
  isHebrewLeapYear: { args: [5784], kind: 'boolean' },
  hebrewMonthDays: { args: [5784, 1], kind: 'number' },
  hebrewMonthStartJd: { args: [5784, 1], kind: 'number' },
  hebrewNewYearJd: { args: [5784], kind: 'number' },
  isHijriLeapYear: { args: [1445], kind: 'boolean' },
  hijriMonthDays: { args: [1445, 1], kind: 'number' },
  hijriMonthStartJd: { args: [1445, 1], kind: 'number' },
  hijriNewYearJd: { args: [1445], kind: 'number' },
  isBahaiLeapYear: { args: [180], kind: 'boolean' },
  islamicObservances: { args: [1445], kind: 'array' },
  gregorianToHijriYears: { args: [2024], kind: 'object' },
  panchanga: { args: [jd], kind: 'object' },
  tryPanchanga: { args: [jd], kind: 'object' },
  hinduFestivals: { args: [2024], kind: 'array' },
  vesakJd: { args: [2024], kind: 'number' },
  uposathaDays: { args: [2024], kind: 'array' },
  nowruzJd: { args: [2024], kind: 'number' },
  gregorianToSolarHijri: { args: [2024], kind: 'number' },
  nawRuzJd: { args: [180], kind: 'number' },
  jdToBahai: { args: [jd], kind: 'object' },
  bahaiHolyDays: { args: [180], kind: 'array' },
  moonPhase: { args: [jd], kind: 'string' },
  moonIllumination: { args: [jd], kind: 'number' },
  moonElongation: { args: [jd], kind: 'number' },
  moonPhaseAngle: { args: [jd], kind: 'number' },
  nextNewMoon: { args: [jd], kind: 'number' },
  nextFirstQuarter: { args: [jd], kind: 'number' },
  nextFullMoonPhase: { args: [jd], kind: 'number' },
  nextLastQuarter: { args: [jd], kind: 'number' },
  moonPhasesForMonth: { args: [2024, 1], kind: 'array' },
  moonPhaseInfo: { args: [jd], kind: 'object' },
  egyptianTermsRuler: { args: [2.35], kind: 'number' },
  decanRuler: { args: [2.35], kind: 'number' },
  fullDignity: { args: [k.SUN, 2.35, true], kind: 'array' },
  almuten: { args: [2.35, true], kind: 'array' },
  firdaria: { args: [jd, true, 75], kind: 'array' },
  fourPillars: { args: [jd, 12, 280], kind: 'array' },
  solarTermPosition: { args: [280], kind: 'array' },
  tonalpohualli: { args: [jd], kind: 'array' },
  xiuhpohualli: { args: [jd], kind: 'array' },
  tzolkin: { args: [jd], kind: 'array' },
  haab: { args: [jd], kind: 'array' },
  calendarRound: { args: [jd], kind: 'array' },
  medicineWheelTotem: { args: [280], kind: 'array' },
  egyptianDecan: { args: [2.35], kind: 'array' },
  solarCycle: { args: [jd], kind: 'object' },
  grandSolarEpoch: { args: [2_334_672.5], kind: 'string' },
  cycleNickname: { args: [19], kind: 'string' },
  isDayChart: { args: [280, cusps], kind: 'boolean' },
  meanSidtime: { args: [jd], kind: 'number' },
  triplicityRulers: { args: [2.35], kind: 'array' },
  sabbatsForYear: { args: [2024], kind: 'array' },
  sabbatJd: { args: [2024, 'Ostara'], kind: 'number' },
  nextSabbat: { args: [jd], kind: 'object' },
  esbatsForYear: { args: [2024], kind: 'array' },
  nextEsbat: { args: [jd], kind: 'object' },
  secondaryProgressions: { args: [jd, 25, [k.SUN, k.MOON, k.MARS], 48.85, 2.35, hsys, flags], kind: 'object' },
  solarArcDirections: { args: [jd, 25, [k.SUN, 280, k.MOON, 220, k.MARS, 330], 120, flags], kind: 'array' },
  midpointTable: { args: [[k.SUN, 0, k.MOON, 60, k.MARS, 30], 3], kind: 'array' },
  calcChartAspects: { args: [aspectPositions, [0, 60, 90, 120, 180], 3], kind: 'array' },
  calcChartAspectsAuto: { args: [aspectPositions, [0, 60, 90, 120, 180]], kind: 'array' },
  sexagenaryName: { args: [0], kind: 'array' },
  monthlyProfection: { args: [cusps, 25, 6], kind: 'array' },
  icTransitUt: { args: [k.SUN, jd, jd, 48.85, 2.35, hsys, flags, false], kind: 'number' },
  ascTransitUt: { args: [k.SUN, jd, jd, 48.85, 2.35, hsys, flags, false], kind: 'number' },
  dscTransitUt: { args: [k.SUN, jd, jd, 48.85, 2.35, hsys, flags, false], kind: 'number' },
  nextAspectCusp: { args: [k.SUN, 0, 10, jd, 48.85, 2.35, hsys, false, flags], kind: 'object' },
  nextAspectCusp2: { args: [k.SUN, 60, 10, jd, 48.85, 2.35, hsys, false, flags], kind: 'object' },
  degnorm: { args: [361], kind: 'number' },
  difdeg2n: { args: [350, 10], kind: 'number' },
  nextFullMoon: { args: [jd], kind: 'number' },
  nextSabbatName: { args: [jd], kind: 'string' },
  solcrossUt: { args: [0, jd, flags], kind: 'number' },
  isoWeek: { args: [jd], kind: 'array' },
  dayOfYear: { args: [2024, 1, 1], kind: 'number' },
  weeksInIsoYear: { args: [2024], kind: 'number' },
  mayaLongCount: { args: [jd], kind: 'array' },
  mayaLongCountStr: { args: [jd], kind: 'string' },
  yallopQ: { args: [10, 12, 15], kind: 'array' },
  bestTimeMethod: { args: [jd, jd + 0.05], kind: 'number' },
  vietnameseMonthStartJd: { args: [jd], kind: 'number' },
  vietnameseChineseBoundaryDiffers: { args: [jd], kind: 'boolean' },
  copticToJd: { args: [2024, 1, 1], kind: 'number' },
  jdToCoptic: { args: [jd], kind: 'array' },
  ethiopicToJd: { args: [2024, 1, 1], kind: 'number' },
  jdToEthiopic: { args: [jd], kind: 'array' },
  isCopticLeapYear: { args: [2024], kind: 'boolean' },
  copticMonthDays: { args: [2024, 1], kind: 'number' },
  fasliNowruzJd: { args: [2024], kind: 'number' },
  jdToFasli: { args: [jd], kind: 'array' },
  losarJd: { args: [2024], kind: 'number' },
  tibetanYearName: { args: [2024], kind: 'array' },
  approxHebrewYear: { args: [jd], kind: 'number' },
  arabicPartsSeven: { args: [120, 280, 220, 45, 330, 30, 280, 260, true], kind: 'array' },
  diffDeg: { args: [350, 10], kind: 'number' },
  distanceToMc: { args: [30, 120], kind: 'number' },
  easterJulian: { args: [2024], kind: 'array' },
  elapsedDays: { args: [5784], kind: 'bigint' },
  geoToDms: { args: [48.85], kind: 'array' },
  heliacalUt: { args: [jd, geo, atmosphere, observer, 'venus', 1, flags], kind: 'array' },
  helioCross: { args: [k.MARS, 0, jd, flags, 1], kind: 'number' },
  helioCrossUt: { args: [k.MARS, 0, jd, flags, 1], kind: 'number' },
  houseSystemChar: { args: [0], kind: 'number' },
  houseSystemId: { args: [hsys], kind: 'number' },
  housesArmc: { args: [280, 48.85, 23.44, hsys], kind: 'object' },
  housesArmcEx2: { args: [280, 48.85, 23.44, hsys], kind: 'object' },
  housesFromArmc: { args: [280, 48.85, 23.44, hsys], kind: 'object' },
  islamicObservancesForJd: { args: [jd], kind: 'array' },
  jdEtToUtc: { args: [jd, 1], kind: 'array' },
  jdUtToUtc: { args: [jd, 1], kind: 'array' },
  karanaName: { args: [1], kind: 'string' },
  latToLmt: { args: [jd, 2.35], kind: 'number' },
  lmtToLat: { args: [jd, 2.35], kind: 'number' },
  lowerMeridianTransitUt: { args: [k.MARS, jd, geo, flags], kind: 'object' },
  lunOccultWhenGlob: { args: [2_456_658, k.VENUS, '', flags, 0, false], kind: 'object' },
  lunOccultWhenLoc: { args: [2_456_658, k.VENUS, '', flags, geo, false], kind: 'object' },
  lunOccultWhere: { args: [2_456_953.5, k.VENUS, '', flags], kind: 'object' },
  meanSiderealTimeDeg: { args: [jd], kind: 'number' },
  meridianTransitUt: { args: [k.MARS, jd, geo, flags], kind: 'object' },
  mooncross: { args: [0, jd, flags], kind: 'number' },
  mooncrossBackUt: { args: [0, jd, flags], kind: 'number' },
  mooncrossUt: { args: [0, jd, flags], kind: 'number' },
  nextAspect2: { args: [k.SUN, 0, 0, jd, false, 400, flags], kind: 'array' },
  nextAspectWith2: { args: [k.MOON, 0, k.SUN, jd, false, 400, flags], kind: 'array' },
  nextFullMoonAfter: { args: [jd], kind: 'number' },
  nextNewMoonAfter: { args: [jd], kind: 'number' },
  nextPrincipalPhase: { args: [jd, 2], kind: 'object' },
  nodAps: { args: [jd, k.MARS, flags, 0], kind: 'array' },
  nodApsUt: { args: [jd, k.MARS, flags, 0], kind: 'array' },
  parallacticAngle: { args: [30, 20, 48.85], kind: 'number' },
  parseTime: { args: ['12:34:56'], kind: 'array' },
  pheno: { args: [jd, k.MARS, flags], kind: 'array' },
  phenoUt: { args: [jd, k.MARS, flags], kind: 'array' },
  planetConjunctMc: { args: [30, 120, 3], kind: 'boolean' },
  planetHouseNumber: { args: [30, cusps], kind: 'number' },
  planetOnMidpoint: { args: [30.5, 30, 3], kind: 'number' },
  rasiDiff: { args: [0, 3], kind: 'number' },
  rasiDiff2: { args: [0, 3], kind: 'number' },
  rasiNorm: { args: [13], kind: 'number' },
  riseTransTrueHor: { args: [jd, k.SUN, flags, k.CALC_RISE, geo, 1013, 15, 0], kind: 'object' },
  sameSect: { args: [k.MARS, true], kind: 'boolean' },
  siderealModeFlag: { args: [1], kind: 'number' },
  siderealModeId: { args: [0], kind: 'number' },
  siderealTimeDeg: { args: [jd], kind: 'number' },
  sidtime0: { args: [jd, 23.44, 0.004], kind: 'number' },
  signExaltation: { args: [k.MARS], kind: 'number' },
  signLord: { args: [0], kind: 'number' },
  solarHijriToGregorian: { args: [1403], kind: 'number' },
  solcross: { args: [0, jd, flags], kind: 'number' },
  solcrossBackUt: { args: [0, jd, flags], kind: 'number' },
  tatkalikaRelation: { args: [0, 3], kind: 'number' },
  timeEqu: { args: [jd], kind: 'number' },
  ttToUt: { args: [jd], kind: 'number' },
  tzAbbrFind: { args: ['UTC'], kind: 'array' },
  utcTimeZone: { args: [2024, 1, 1, 12, 34, 56, 3], kind: 'array' },
  yearsDiff: { args: [jd, jd + 365.25, flags], kind: 'number' },
  ayanamsaEx: { args: [jd, flags], kind: 'number' },
  ayanamsaExUt: { args: [jd, flags], kind: 'number' },
  centisecToDegStr: { args: [360000], kind: 'string' },
  centisecToLonlatStr: { args: [360000, 'E', 'W'], kind: 'string' },
  centisecToTimeStr: { args: [366100, ':', false], kind: 'string' },
  coordTransformWithSpeed: { args: [[30, 10, 1, 0.1, 0.2, 0.3], 23.44], kind: 'array' },
  csRoundSec: { args: [150], kind: 'bigint' },
  currentFileData: { args: [0], kind: 'null' },
  dateConversion: { args: [2024, 1, 1, 12, 103], kind: 'number' },
  defaultOrb: { args: [k.SUN, k.MOON, 60], kind: 'number' },
  degToCs: { args: [12.9], kind: 'bigint' },
  deltatEx: { args: [jd, flags], kind: 'number' },
  diffCs: { args: [200, 50], kind: 'bigint' },
  diffCsSigned: { args: [50, 200], kind: 'bigint' },
  diffRadSigned: { args: [0, Math.PI / 2], kind: 'number' },
  gauquelinSector: { args: [jd, k.MARS, '', flags, 0, geo, 1013, 15], kind: 'number' },
  getOrbitalElements: { args: [jd, k.MARS, flags], kind: 'object' },
  heliacalPhenoUt: { args: [jd, geo, atmosphere, observer, 'venus', 1, flags], kind: 'array' },
  isApplying: { args: [59, 1, 60], kind: 'boolean' },
  libraryPath: { args: [], kind: 'string' },
  makePillar: { args: [0, 0], kind: 'object' },
  midpointRad: { args: [0, Math.PI / 2], kind: 'number' },
  normRad: { args: [-Math.PI / 2], kind: 'number' },
  orbitMaxMinTrueDistance: { args: [jd, k.MARS, flags], kind: 'object' },
  setLapseRate: { args: [0.0065], kind: 'unit' },
  setTidAcc: { args: [-25.8], kind: 'unit' },
  tidAcc: { args: [], kind: 'number' },
  visLimitMag: { args: [jd, geo, atmosphere, observer, 'venus', flags], kind: 'array' },
  wrapSigned180: { args: [181], kind: 'number' },
} satisfies ArgumentCases;

const manifest: { coreFunctions: string[]; functions: Record<string, string> } = JSON.parse(
  readFileSync(new URL('../api-manifest.json', import.meta.url), 'utf8'),
);

function assertFiniteContent(value: unknown, location: string): void {
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), `${location} must be finite`);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) assertFiniteContent(entry, `${location}.${key}`);
}

function assertOutput(value: unknown, kind: OutputKind): void {
  if (kind === 'unit') {
    assert.ok(value === null || value === undefined);
    return;
  }
  if (kind === 'null') {
    assert.equal(value, null);
    return;
  }
  if (kind === 'array') {
    assert.ok(Array.isArray(value));
    assert.ok(value.length > 0, 'valid fixture must produce at least one result');
  } else if (kind === 'object') {
    assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value));
    assert.ok(Object.keys(value).length > 0);
  } else {
    assert.equal(typeof value, kind);
    if (kind === 'string') assert.notEqual(value, '');
  }
  assertFiniteContent(value, 'result');
}

afterEach(() => {
  c.setSidMode(k.SIDM_FAGAN_BRADLEY);
  c.setTopo(0, 0, 0);
  c.setDeltaTUserdef(NaN);
});

test('every free core function and compatibility alias has a typed runtime fixture', () => {
  assert.deepEqual(Object.keys(cases).sort(), Object.values(manifest.functions).sort());
  assert.ok(manifest.coreFunctions.length >= 300);
});

for (const name of Object.keys(cases) as Array<keyof typeof cases>) {
  test(`core API: ${name}`, () => {
    const fixture = cases[name];
    const result: unknown = Reflect.apply(c[name], undefined, fixture.args);
    assertOutput(result, fixture.kind);
  });
}
