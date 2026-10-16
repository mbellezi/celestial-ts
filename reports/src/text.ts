import editorial from '../data/editorial-pt-BR.json' with { type: 'json' };
import { REPORT_DOMAINS, type AstrologyReport, type ReportDomain, type ReportTextOptions } from './types.ts';

interface Narrative {
  bodies: Record<string, string>;
  signs: string[];
  aspects: Record<string, string>;
  phases: Record<string, string>;
  domains: Record<ReportDomain, string>;
  templates: Record<string, string>;
}
export function normalizeTextOptions(options: ReportTextOptions = {}): ReportDomain[] {
  const requested = options.domains ?? ['general'];
  if (requested === 'all') return [...REPORT_DOMAINS];
  if (!Array.isArray(requested) || requested.some(domain => !REPORT_DOMAINS.includes(domain)) || new Set(requested).size !== requested.length) throw new RangeError('Invalid text domains');
  return REPORT_DOMAINS.filter(domain => requested.includes(domain));
}

/** Render every report event in chronological order, with source-authored Portuguese templates. */
export function renderReportText(report: AstrologyReport, options: ReportTextOptions = {}): string {
  const narrative = (editorial as unknown as { narrative: Narrative }).narrative;
  if (!narrative) throw new Error('Narrative catalog is unavailable');
  const domains = normalizeTextOptions(options);
  const span = Date.parse(report.range.endExclusive) - Date.parse(report.range.start);
  const precision: Intl.DateTimeFormatOptions = span < 1000 ? { second: '2-digit', fractionalSecondDigits: 3 } : span < 60_000 ? { second: '2-digit' } : {};
  const format = new Intl.DateTimeFormat('pt-BR', { timeZone: report.range.timeZone, day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', ...precision, hourCycle: 'h23' });
  const date = (value: string) => format.format(new Date(value));
  const template = (key: string, values: Record<string, string>): string => {
    if (!narrative.templates[key]) throw new Error(`Missing narrative template: ${key}`);
    return narrative.templates[key].replace(/\{(\w+)\}/g, (_, name: string) => {
      if (!(name in values)) throw new Error(`Missing narrative placeholder: ${name}`);
      return values[name];
    });
  };
  const paragraphs: string[] = [];
  for (const entry of [...report.entries].sort((a, b) => a.event.start.localeCompare(b.event.start) || a.event.catalogKey.localeCompare(b.event.catalogKey))) {
    const event = entry.event;
    const [, first, second, third] = event.catalogKey.split(':');
    const values: Record<string, string> = {
      when: date(event.start), start: date(event.start), end: date(event.end),
      period: `de ${date(event.start)} a ${date(event.end)}`,
      body: narrative.bodies[event.bodies[0]] ?? '', body1: narrative.bodies[event.bodies[0]] ?? '', body2: narrative.bodies[event.bodies[1]] ?? '',
      sign: narrative.signs[Number(second)] ?? '', aspect: narrative.aspects[third] ?? '', phase: narrative.phases[first] ?? '',
      maximum: date(typeof event.details.fullMaximum === 'string' ? event.details.fullMaximum : event.exact[0] ?? event.start),
      exact: event.exact.map(date).join('; '),
      duration: '',
    };
    let key: string;
    switch (event.kind) {
      case 'sign': key = event.boundary.startClipped ? 'signPresence' : 'signIngress'; break;
      case 'aspect': key = 'aspect'; break;
      case 'retrograde': key = 'retrograde'; break;
      case 'station': key = second === 'direct' ? 'stationDirect' : 'stationRetrograde'; break;
      case 'phase': key = 'phase'; break;
      case 'eclipse':
        key = first === 'solar' ? 'eclipseSolar' : 'eclipseLunar';
        values.sign = narrative.signs[Number(second)] ?? '';
        if (typeof event.details.fullStart === 'string' && typeof event.details.fullEnd === 'string') {
          values.period = `de ${date(event.details.fullStart)} a ${date(event.details.fullEnd)}`;
          const seconds = Math.round((Date.parse(event.details.fullEnd) - Date.parse(event.details.fullStart)) / 1000);
          values.duration = `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}min ${seconds % 60}s`;
        }
        break;
    }
    const sentences = [template(key, values)];
    if (event.kind === 'eclipse' && narrative.templates.eclipseTimeScale) sentences.push(template('eclipseTimeScale', values));
    if (event.kind === 'eclipse' && values.duration && narrative.templates.eclipseDuration) sentences.push(template('eclipseDuration', values));
    if (event.boundary.startClipped) sentences.push(template('continuedBefore', values));
    if (event.boundary.endClipped) sentences.push(template('continuesAfter', values));
    if (event.kind === 'aspect' && event.exact.length) sentences.push(template('exactPassages', values));
    paragraphs.push(sentences.join(' '));
    const interpretation = report.interpretations[entry.interpretationKey];
    if (!interpretation) throw new Error(`Missing report interpretation: ${entry.interpretationKey}`);
    for (const domain of domains) paragraphs.push(domains.length === 1 && domain === 'general' ? interpretation[domain] : `${template('interpretationHeading', { ...values, domain: narrative.domains[domain] })}\n${interpretation[domain]}`);
  }
  return paragraphs.join('\n\n');
}
