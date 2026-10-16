import positionsData from '../data/natal-positions-pt-BR.json' with { type: 'json' };
import patternsData from '../data/natal-patterns-pt-BR.json' with { type: 'json' };
import { NATAL_ASPECT_ANGLES, NATAL_BODIES, type NatalInterpretation, type NatalPoint, type NatalSection } from './natal-types.ts';

interface SourceEntry { title: string; personal: string; professional: string }
interface EditorialFile {
  version: string;
  authorship: { model: string; skill: string; reference: string };
  entries: Record<string, SourceEntry>;
}
interface EditorialLabels {
  title: string;
  sectionTitles: Record<NatalSection['id'], string>;
  personal: string; professional: string; overview: string;
  introduction: string; methodology: string; disclaimer: string;
  regency?: string; rulerReference?: string;
}
const positions = positionsData as unknown as EditorialFile;
const patterns = patternsData as unknown as EditorialFile & { labels: EditorialLabels };
export const NATAL_CATALOG_VERSION = '1.0.0';
export const NATAL_POINT_NAMES: Readonly<Record<NatalPoint, string>> = Object.freeze({
  sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte', jupiter: 'Júpiter',
  saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão', trueNode: 'Nodo Norte',
  ascendant: 'Ascendente', midheaven: 'Meio do Céu',
});
export const NATAL_LABELS: Readonly<EditorialLabels> = Object.freeze({ ...patterns.labels,
  sectionTitles: Object.freeze({ ...patterns.labels.sectionTitles }) });
const POINTS: readonly NatalPoint[] = [...NATAL_BODIES, 'trueNode', 'ascendant', 'midheaven'];
const ASPECT_NAMES: Record<number, string> = { 0: 'conjunção', 30: 'semissextil', 45: 'semiquadratura',
  60: 'sextil', 90: 'quadratura', 120: 'trígono', 135: 'sesquiquadratura', 150: 'quincúncio', 180: 'oposição' };
const sources: Record<string, SourceEntry> = Object.assign(Object.create(null), positions.entries, patterns.entries);

function allPairs(): [NatalPoint, NatalPoint][] {
  return POINTS.flatMap((a, i) => POINTS.slice(i + 1).filter(b =>
    !(i >= NATAL_BODIES.length && POINTS.indexOf(b) >= NATAL_BODIES.length)
  ).map(b => [a, b] as [NatalPoint, NatalPoint]));
}
const PAIRS = allPairs();
const directKeys: string[] = [];
for (const body of NATAL_BODIES) {
  for (let sign = 0; sign < 12; sign++) directKeys.push(`sign:${body}:${sign}`);
  for (let house = 1; house <= 12; house++) directKeys.push(`house:${body}:${house}`);
}
for (let sign = 0; sign < 12; sign++) for (const kind of ['ascendant', 'midheaven', 'nodeSign']) directKeys.push(`${kind}:${sign}`);
for (let house = 1; house <= 12; house++) directKeys.push(`nodeHouse:${house}`);
for (const body of NATAL_BODIES.slice(2)) directKeys.push(`retrograde:${body}`);
const resolvedKeys = [...directKeys, ...PAIRS.flatMap(([a, b]) => NATAL_ASPECT_ANGLES.map(angle => `aspect:${a}:${b}:${angle}`))];
const validKeys = new Set(resolvedKeys);
const sourceKeys = [...directKeys, ...PAIRS.map(([a, b]) => `pair:${a}:${b}`), ...NATAL_ASPECT_ANGLES.map(a => `aspect:${a}`)];
let validated = false;

function validateCatalog(): void {
  if (validated) return;
  for (const file of [positions, patterns]) {
    if (file.version !== NATAL_CATALOG_VERSION || file.authorship.model !== 'gpt-6-astra'
      || file.authorship.skill !== 'humanizar-pt-br') throw new Error('Metadados editoriais natais incompatíveis.');
  }
  if (Object.keys(sources).length !== sourceKeys.length) throw new Error('Contagem de fontes do catálogo natal inválida.');
  for (const key of sourceKeys) {
    const entry = sources[key];
    if (!entry || [entry.title, entry.personal, entry.professional].some(value => typeof value !== 'string' || !value.trim())) {
      throw new Error(`Entrada editorial natal ausente: ${key}`);
    }
    if (/\{(?!first\}|second\})[^}]*\}/u.test(`${entry.personal} ${entry.professional}`)) throw new Error(`Marcador editorial desconhecido: ${key}`);
  }
  if ([NATAL_LABELS.title, NATAL_LABELS.introduction, NATAL_LABELS.methodology, NATAL_LABELS.disclaimer,
    NATAL_LABELS.personal, NATAL_LABELS.professional, ...Object.values(NATAL_LABELS.sectionTitles)].some(v => typeof v !== 'string' || !v.trim())) {
    throw new Error('Rótulos do relatório natal incompletos.');
  }
  validated = true;
}

function paragraphs(text: string): string[] { return text.split(/\n\s*\n/u).map(p => p.trim()).filter(Boolean); }
/** Complete paragraphs authored by Astra; aspects compose one pair entry and one angular entry. */
export function resolveNatalInterpretation(key: string): NatalInterpretation {
  validateCatalog();
  if (typeof key !== 'string' || !validKeys.has(key)) throw new RangeError(`Chave natal inválida: ${String(key)}`);
  let selected: string[], title: string, first = '', second = '';
  if (key.startsWith('aspect:')) {
    const [, a, b, angle] = key.split(':');
    first = NATAL_POINT_NAMES[a as NatalPoint]; second = NATAL_POINT_NAMES[b as NatalPoint];
    selected = [`pair:${a}:${b}`, `aspect:${angle}`];
    title = `${first}: ${ASPECT_NAMES[Number(angle)]} com ${second}`;
  } else { selected = [key]; title = sources[key].title; }
  const substitute = (text: string) => text.replace(/\{first\}/gu, first).replace(/\{second\}/gu, second);
  return { key, sourceKeys: selected, title,
    personal: selected.flatMap(k => paragraphs(substitute(sources[k].personal))),
    professional: selected.flatMap(k => paragraphs(substitute(sources[k].professional))) };
}

/** All 971 theoretical combinations. Their presence does not imply astronomical occurrence. */
export function getNatalCatalog(): NatalInterpretation[] { validateCatalog(); return resolvedKeys.map(resolveNatalInterpretation); }
export function getNatalCatalogInfo() {
  validateCatalog();
  return { version: NATAL_CATALOG_VERSION, editorialEntryCount: sourceKeys.length, resolvedEntryCount: resolvedKeys.length,
    categories: { planetSigns: 120, planetHouses: 120, ascendants: 12, midheavens: 12, nodeSigns: 12,
      nodeHouses: 12, retrogradeBodies: 8, aspectPairs: PAIRS.length, aspectAngles: NATAL_ASPECT_ANGLES.length,
      resolvedAspects: PAIRS.length * NATAL_ASPECT_ANGLES.length },
    authorship: { model: 'gpt-6-astra', skill: 'humanizar-pt-br' }, usesLLMAtRuntime: false,
    composition: 'Cada aspecto combina o texto específico do par com o texto do ângulo; as outras entradas são individuais.' };
}
