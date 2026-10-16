import editorial from '../data/editorial-pt-BR.json' with { type: 'json' };
import { REPORT_BODIES, REPORT_DOMAINS, type DomainText, type ResolvedInterpretation } from './types.ts';
interface Source extends DomainText { title: string }
const source = editorial as unknown as { version: string; disclaimer: string; methodology: string; components: Record<string, Source> };
export const CATALOG_VERSION = source.version;
export const DISCLAIMER = source.disclaimer;
export const METHODOLOGY = source.methodology;
const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const aspects: Record<string, string> = { 0: 'conjunction', 60: 'sextile', 90: 'square', 120: 'trine', 180: 'opposition' };
const resolved = new Map<string, ResolvedInterpretation>();
export function resolveInterpretation(key: string): ResolvedInterpretation {
  const existing = resolved.get(key);
  if (existing) return { ...existing, sourceKeys: [...existing.sourceKeys] };
  if (!/^(?:aspect:[a-z]+:[a-z]+:(?:0|60|90|120|180)|sign:[a-z]+:(?:[0-9]|1[01])|station:[a-z]+:(?:retrograde|direct)|retrograde:[a-z]+:(?:[0-9]|1[01])|phase:(?:new|firstQuarter|full|lastQuarter):(?:[0-9]|1[01])|eclipse:(?:solar|lunar):(?:[0-9]|1[01]))$/.test(key)) throw new RangeError(`Invalid catalog key: ${key}`);
  const [kind, first, second, third] = key.split(':');
  let sourceKeys: string[];
  switch (kind) {
    case 'aspect': sourceKeys = [`pair:${first}:${second}`, `aspect:${aspects[third]}`]; break;
    case 'sign': sourceKeys = [`body:${first}`, `sign:${signs[+second]}`]; break;
    case 'station': sourceKeys = [second === 'direct' ? `body:${first}` : `retro:${first}`, `station:${second}`]; break;
    case 'retrograde': sourceKeys = [`retro:${first}`, `sign:${signs[+second]}`]; break;
    case 'phase': sourceKeys = [`phase:${first}`, `sign:${signs[+second]}`]; break;
    case 'eclipse': sourceKeys = [`eclipse:${first}`, `sign:${signs[+second]}`]; break;
    default: throw new RangeError(`Unknown catalog key: ${key}`);
  }
  const records = sourceKeys.map(sourceKey => {
    const record = source.components[sourceKey];
    if (!record) throw new RangeError(`Missing editorial source: ${sourceKey}`);
    return record;
  });
  const record: ResolvedInterpretation = { key, sourceKeys, title: records.map(r => r.title).join(' · '),
    ...Object.fromEntries(REPORT_DOMAINS.map(domain => [domain, records.map(r => r[domain]).join('\n\n')])) as DomainText };
  resolved.set(key, Object.freeze({ ...record, sourceKeys: Object.freeze([...sourceKeys]) as unknown as string[] }));
  return record;
}
/** Resolved combinations are composed from individually authored complete paragraphs. */
export function getCatalog(): ResolvedInterpretation[] {
  const keys: string[] = [];
  REPORT_BODIES.forEach((body, i) => {
    for (let sign = 0; sign < 12; sign++) keys.push(`sign:${body}:${sign}`);
    for (const other of REPORT_BODIES.slice(i + 1)) for (const angle of Object.keys(aspects)) keys.push(`aspect:${body}:${other}:${angle}`);
    if (i > 1) {
      keys.push(`station:${body}:retrograde`, `station:${body}:direct`);
      for (let sign = 0; sign < 12; sign++) keys.push(`retrograde:${body}:${sign}`);
    }
  });
  for (let sign = 0; sign < 12; sign++) {
    for (const phase of ['new', 'firstQuarter', 'full', 'lastQuarter']) keys.push(`phase:${phase}:${sign}`);
    for (const type of ['solar', 'lunar']) keys.push(`eclipse:${type}:${sign}`);
  }
  return keys.map(resolveInterpretation);
}
