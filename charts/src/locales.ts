import type { AspectAngle, BodyKey, ChartLocale, ElementKey } from './types.ts';

export type ChartErrorCode = 'invalidDate' | 'invalidTime' | 'invalidInstant' | 'invalidDateTime'
  | 'unknownTimeZone' | 'ambiguousTime' | 'nonexistentTime' | 'invalidLocation'
  | 'invalidBodies' | 'invalidHouseSystem' | 'invalidLocale' | 'calculationFailed';

export interface ChartMessages {
  labels: Record<'natal' | 'planetary' | 'instant' | 'dateTime' | 'timeZone' | 'location'
    | 'latitude' | 'longitude' | 'julianDay' | 'planet' | 'sign' | 'degree' | 'distance'
    | 'speed' | 'retrograde' | 'house' | 'aspect' | 'orb' | 'applying' | 'separating'
    | 'elements' | 'element' | 'positions' | 'houses' | 'aspectMatrix' | 'aspectsTable'
    | 'noAspects' | 'retrogradeShort' | 'directShort' | 'cusp' | 'body1' | 'body2', string>;
  bodies: Record<BodyKey, string>;
  signs: readonly [string, string, string, string, string, string, string, string,
    string, string, string, string];
  aspects: Record<AspectAngle, string>;
  elements: Record<ElementKey, string>;
  errors: Record<ChartErrorCode, string>;
}

const messages: Record<ChartLocale, ChartMessages> = {
  'pt-BR': {
    labels: {
      natal: 'Mapa natal', planetary: 'Posições planetárias', instant: 'Instante UTC',
      dateTime: 'Data e hora local', timeZone: 'Fuso horário', location: 'Local',
      latitude: 'Latitude', longitude: 'Longitude', julianDay: 'Dia juliano', planet: 'Astro',
      sign: 'Signo', degree: 'Grau', distance: 'Distância (UA)', speed: 'Velocidade (°/dia)',
      retrograde: 'Retrógrado', house: 'Casa', aspect: 'Aspecto', orb: 'Orbe',
      applying: 'Aplicativo', separating: 'Separativo', elements: 'Elementos', element: 'Elemento',
      positions: 'Posições', houses: 'Casas', aspectMatrix: 'Matriz de aspectos',
      aspectsTable: 'Aspectos', noAspects: 'Nenhum aspecto principal neste conjunto.',
      retrogradeShort: 'R', directShort: 'D', cusp: 'Cúspide', body1: 'Astro 1', body2: 'Astro 2',
    },
    bodies: {
      sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
      jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão',
      trueNode: 'Nodo verdadeiro', chiron: 'Quíron',
    },
    signs: ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião',
      'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'],
    aspects: { 0: 'Conjunção', 60: 'Sextil', 90: 'Quadratura', 120: 'Trígono', 180: 'Oposição' },
    elements: { fire: 'Fogo', earth: 'Terra', air: 'Ar', water: 'Água' },
    errors: {
      invalidDate: 'Informe uma data válida no formato AAAA-MM-DD, entre os anos 0001 e 9999.',
      invalidTime: 'Informe uma hora válida no formato HH:mm ou HH:mm:ss.',
      invalidInstant: 'Informe um instante ISO 8601 válido com Z ou deslocamento UTC explícito.',
      invalidDateTime: 'Informe um instante explícito ou uma data, hora e fuso horário locais.',
      unknownTimeZone: 'Informe um fuso horário IANA válido.',
      ambiguousTime: 'Esta hora local ocorre duas vezes. Informe um instante com deslocamento UTC explícito.',
      nonexistentTime: 'Esta hora local não existe devido à mudança de fuso horário.',
      invalidLocation: 'Informe latitude entre −90 e 90 e longitude entre −180 e 180, ambas finitas.',
      invalidBodies: 'Informe uma lista não vazia de astros válidos, sem duplicatas.',
      invalidHouseSystem: 'Escolha o sistema de casas P, W ou E.',
      invalidLocale: 'Escolha o idioma pt-BR ou en.',
      calculationFailed: 'O motor não retornou um resultado astronômico válido para estes dados.',
    },
  },
  en: {
    labels: {
      natal: 'Natal chart', planetary: 'Planetary positions', instant: 'UTC instant',
      dateTime: 'Local date and time', timeZone: 'Time zone', location: 'Location',
      latitude: 'Latitude', longitude: 'Longitude', julianDay: 'Julian day', planet: 'Body',
      sign: 'Sign', degree: 'Degree', distance: 'Distance (AU)', speed: 'Speed (°/day)',
      retrograde: 'Retrograde', house: 'House', aspect: 'Aspect', orb: 'Orb',
      applying: 'Applying', separating: 'Separating', elements: 'Elements', element: 'Element',
      positions: 'Positions', houses: 'Houses', aspectMatrix: 'Aspect matrix',
      aspectsTable: 'Aspects', noAspects: 'No major aspects in this selection.',
      retrogradeShort: 'R', directShort: 'D', cusp: 'Cusp', body1: 'Body 1', body2: 'Body 2',
    },
    bodies: {
      sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
      jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
      trueNode: 'True node', chiron: 'Chiron',
    },
    signs: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
      'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    aspects: { 0: 'Conjunction', 60: 'Sextile', 90: 'Square', 120: 'Trine', 180: 'Opposition' },
    elements: { fire: 'Fire', earth: 'Earth', air: 'Air', water: 'Water' },
    errors: {
      invalidDate: 'Enter a valid YYYY-MM-DD date between years 0001 and 9999.',
      invalidTime: 'Enter a valid time as HH:mm or HH:mm:ss.',
      invalidInstant: 'Enter a valid ISO 8601 instant with Z or an explicit UTC offset.',
      invalidDateTime: 'Enter an explicit instant or a local date, time and time zone.',
      unknownTimeZone: 'Enter a valid IANA time zone.',
      ambiguousTime: 'This local time occurs twice. Enter an instant with an explicit UTC offset.',
      nonexistentTime: 'This local time does not exist because of a time zone transition.',
      invalidLocation: 'Enter finite latitude from −90 to 90 and longitude from −180 to 180.',
      invalidBodies: 'Enter a nonempty list of valid bodies without duplicates.',
      invalidHouseSystem: 'Choose house system P, W or E.',
      invalidLocale: 'Choose language pt-BR or en.',
      calculationFailed: 'The engine did not return a valid astronomical result for these inputs.',
    },
  },
};

export class ChartError extends Error {
  readonly code: ChartErrorCode;

  constructor(code: ChartErrorCode, locale: ChartLocale = 'pt-BR', options?: ErrorOptions) {
    super(messages[locale === 'en' ? 'en' : 'pt-BR'].errors[code], options);
    this.name = 'ChartError';
    this.code = code;
  }
}

export function getMessages(locale: ChartLocale = 'pt-BR'): ChartMessages {
  if (locale !== 'pt-BR' && locale !== 'en') throw new ChartError('invalidLocale');
  return messages[locale];
}
