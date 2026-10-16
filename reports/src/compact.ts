import editorial from '../data/editorial-pt-BR.json' with { type: 'json' };
import compactEditorial from '../data/compact-pt-BR.json' with { type: 'json' };
import { REPORT_DOMAINS, type AstrologyReport, type CompactAstrologyReport, type CompactReportOptions, type ReportEvent, type ReportDomain } from './types.ts';
export const COMPACT_REPORT_VERSION = '1.0.0';
const source = compactEditorial as unknown as { version: string; overview: Record<string,string>; templates: Record<string,string>; disclaimer: string; components: Record<string, Record<string,string>> };
const labels = (editorial as unknown as { narrative: { bodies: Record<string,string>; signs: string[]; aspects: Record<string,string>; phases: Record<string,string>; domains: Record<string,string> } }).narrative;
export function normalizeCompactOptions(options: CompactReportOptions = {}) {
  const maxHighlights = options.maxHighlights;
  if (maxHighlights !== undefined && (!Number.isInteger(maxHighlights) || maxHighlights < 1 || maxHighlights > 8)) throw new RangeError('maxHighlights must be an integer from 1 to 8');
  const requested = options.domains ?? REPORT_DOMAINS.filter(d => d !== 'general');
  if (requested !== 'all' && requested !== 'none' && (!Array.isArray(requested) || requested.some(d => !REPORT_DOMAINS.includes(d)) || new Set(requested).size !== requested.length)) throw new RangeError('Invalid compact domains');
  const domains = requested === 'none' ? [] : requested === 'all' ? [...REPORT_DOMAINS] : REPORT_DOMAINS.filter(d => requested.includes(d));
  return { maxHighlights, domains: domains.filter(d => d !== 'general'), version: COMPACT_REPORT_VERSION, editorialVersion: source.version };
}
function localDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}
function actual(event: ReportEvent, start: number, end: number) {
  return event.exact.some(t => Date.parse(t) >= start && Date.parse(t) < end) || (!event.boundary.startClipped && Date.parse(event.start) >= start && Date.parse(event.start) < end);
}
function related(a: ReportEvent, b: ReportEvent) {
  if (a.kind !== 'eclipse') return false;
  const solar = a.catalogKey.split(':')[1] === 'solar';
  const phase = b.kind === 'phase' && b.catalogKey.split(':')[1] === (solar ? 'new' : 'full');
  const aspect = b.kind === 'aspect' && b.bodies.includes('sun') && b.bodies.includes('moon') && Number(b.details.angle) === (solar ? 0 : 180);
  return (phase || aspect) && a.exact.some(t => b.exact.some(u => Math.abs(Date.parse(t) - Date.parse(u)) <= 86_400_000));
}
/** A small editorial view of an existing report; full events remain available in the source report. */
export function compactReport(report: AstrologyReport, options: CompactReportOptions = {}): CompactAstrologyReport {
  const normalized = normalizeCompactOptions(options);
  const start = Date.parse(report.range.start), end = Date.parse(report.range.endExclusive), zone = report.range.timeZone;
  const first = localDate(report.range.start, zone), last = localDate(new Date(end - 1).toISOString(), zone);
  const clock = (value: string) => new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(value));
  const next = localDate(report.range.endExclusive, zone);
  const monthStart = new Date(`${first.slice(0,7)}-01T00:00:00Z`);
  monthStart.setUTCMonth(monthStart.getUTCMonth()+1);
  const isMonth = start % 1000 === 0 && end % 1000 === 0 && first.endsWith('-01') && next === monthStart.toISOString().slice(0,10) && clock(report.range.start) === '00:00:00' && clock(report.range.endExclusive) === '00:00:00';
  const kind = first === last ? 'day' : isMonth ? 'month' : 'period';
  const maxHighlights = normalized.maxHighlights ?? (kind === 'day' ? 3 : 5);
  const eclipses = report.entries.filter(e => e.event.kind === 'eclipse').map(e => e.event);
  const groups = new Map<string, ReportEvent[]>();
  for (const { event } of report.entries) {
    if (eclipses.some(e => related(e, event))) continue;
    const group = groups.get(event.catalogKey) ?? []; group.push(event); groups.set(event.catalogKey, group);
  }
  function score(events: ReportEvent[]) {
    const e = events[0], changing = events.some(e => actual(e,start,end)), lunar = e.bodies.includes('moon');
    let rank = e.kind === 'eclipse' ? 100 : e.kind === 'station' ? 90 : e.kind === 'sign' && changing && !lunar ? 80 : e.kind === 'aspect' && changing && !lunar ? 70 : e.kind === 'phase' ? 60 : changing ? 45 : 10;
    if (e.kind === 'aspect' && e.bodies.some(b => ['jupiter','saturn','uranus','neptune','pluto'].includes(b))) rank += 8;
    if (e.kind === 'aspect' && events.some(e => e.exact.some(t => Date.parse(t) >= start && Date.parse(t) < end))) rank += 8;
    if (kind !== 'day') {
      const slow = ['jupiter','saturn','uranus','neptune','pluto'];
      if (e.kind === 'sign' && changing && slow.includes(e.bodies[0])) rank += 12;
      if (e.kind === 'aspect' && e.bodies.every(body => slow.includes(body)) && events.some(event => event.exact.some(t => Date.parse(t) >= start && Date.parse(t) < end))) rank += 10;
    }
    if (kind === 'day' && changing) rank += 100;
    if (lunar && e.kind !== 'phase' && e.kind !== 'eclipse') rank -= 20;
    return rank;
  }
  for (const events of groups.values()) events.sort((a,b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  const sorted = [...groups.values()].sort((a,b) => score(b)-score(a) || a[0].start.localeCompare(b[0].start) || a[0].catalogKey.localeCompare(b[0].catalogKey));
  const chosen: ReportEvent[][] = [];
  const hasChanges = sorted.some(es => es.some(e => actual(e,start,end)));
  for (const events of sorted) {
    const background = !events.some(e => actual(e,start,end));
    if (background && chosen.some(es => !es.some(e => actual(e,start,end)))) continue;
    if (background && hasChanges && chosen.length >= maxHighlights - 1) continue;
    chosen.push(events);
    if (chosen.length === maxHighlights) break;
  }
  const crossYear = first.slice(0,4) !== last.slice(0,4);
  const date = (value: string) => new Intl.DateTimeFormat('pt-BR',{ timeZone:zone, day:'numeric', month:'short', ...(crossYear ? { year: 'numeric' as const } : {}), hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).format(new Date(value));
  const interpretations: CompactAstrologyReport['interpretations'] = {};
  const highlights = chosen.map(events => {
    events.sort((a,b) => a.start.localeCompare(b.start));
    const e = events[0], interpretation = report.interpretations[e.catalogKey];
    interpretations[e.catalogKey] = { key:e.catalogKey,title:interpretation.title,sourceKeys:[...interpretation.sourceKeys] };
    const [,first,second,third] = e.catalogKey.split(':');
    const exact = [...new Set(events.flatMap(e => e.exact).filter(t => Date.parse(t)>=start && Date.parse(t)<end))].sort();
    const background = !events.some(e => actual(e,start,end));
    let timing = exact.length ? exact.slice(0,3).map(date).join('; ') + (exact.length > 3 ? `; mais ${exact.length-3} passagens exatas no período` : '') : background ? `Em curso no período observado (${date(report.range.start)} a ${date(new Date(end-1).toISOString())})` : events.slice(0,3).map(e => date(e.start)).join('; ') + (events.length > 3 ? `; mais ${events.length-3} ocorrências` : '');
    const key = e.kind === 'sign' ? background ? 'signPresence' : 'signIngress' : e.kind === 'station' ? second === 'direct' ? 'stationDirect' : 'stationRetrograde' : e.kind === 'eclipse' ? first === 'solar' ? !exact.length ? 'eclipseSolarBackground' : 'eclipseSolar' : !exact.length ? 'eclipseLunarBackground' : 'eclipseLunar' : e.kind;
    const values:Record<string,string> = {body:labels.bodies[e.bodies[0]],body1:labels.bodies[e.bodies[0]],body2:labels.bodies[e.bodies[1]],sign:labels.signs[Number(second)],aspect:labels.aspects[third],phase:labels.phases[first],when:timing,exact:timing};
    if (e.kind === 'retrograde') timing = `Intervalo observado: ${events.slice(0,3).map(event => `${date(event.start)} até ${date(event.end)}`).join('; ')}${events.length > 3 ? `; mais ${events.length-3} intervalos` : ''}`;
    if (e.kind === 'aspect' && exact.length) timing = `Exato em ${timing}`;
    const rawText = (source.templates[key] ?? interpretation.title).replace(/\{(\w+)\}/g,(_,name:string)=> values[name] ?? '');
    const text = rawText.charAt(0).toLocaleUpperCase('pt-BR') + rawText.slice(1);
    return {eventIds:events.map(e=>e.id),interpretationKey:e.catalogKey,title:interpretation.title,text,timing,exact,background};
  });
  const sentence = (key:string, domain:ReportDomain) => {
    const componentKeys = report.interpretations[key].sourceKeys;
    return componentKeys.map(k => source.components[k]?.[domain]).filter(Boolean).join(' ');
  };
  const dominant = highlights.slice(0,kind === 'day' ? 1 : 2);
  const domains = normalized.domains.map(domain => {
    const keys = dominant.map(h => h.interpretationKey);
    // The same dominant sources inform every area, independent of the requested subset.
    const text = keys.map(key => source.components[report.interpretations[key].sourceKeys[0]]?.[domain]).filter(Boolean).join(' ');
    return {domain,text:highlights.length ? text : source.overview.empty,eventIds:dominant.flatMap(h => h.eventIds),interpretationKeys:keys};
  });
  const general = highlights.slice(0,kind === 'day' ? 1 : 2).map(h=>sentence(h.interpretationKey,'general')).join(' ');
  const selectedEvents = highlights.reduce((sum,h)=>sum+h.eventIds.length,0);
  highlights.sort((a,b) => {
    const time = (h: typeof a) => h.exact[0] ?? report.entries.find(e => e.event.id === h.eventIds[0])!.event.start;
    return time(a).localeCompare(time(b)) || a.interpretationKey.localeCompare(b.interpretationKey);
  });
  return {version:COMPACT_REPORT_VERSION,catalogVersion:source.version,sourceReportVersion:report.version,locale:'pt-BR',kind,range:{...report.range},overview:highlights.length ? `${source.overview[kind]} ${general}`.trim() : source.overview.empty,highlights,domains,interpretations,selection:{totalEvents:report.entries.length,selectedEvents,omittedEvents:report.entries.length-selectedEvents,maxHighlights,policy:'editorial-priority-v1'},disclaimer:source.disclaimer};
}
export function renderCompactReportText(report: CompactAstrologyReport): string {
  const format = new Intl.DateTimeFormat('pt-BR',{timeZone:report.range.timeZone,day:'numeric',month:'long',year:'numeric'});
  const start = format.format(new Date(report.range.start));
  const end = format.format(new Date(Date.parse(report.range.endExclusive)-1));
  const heading = report.kind === 'day' ? start : `${start} a ${end}`;
  return [heading,report.overview,...report.highlights.map(h=>`${h.timing}: ${h.text}`),...report.domains.map(d=>`${labels.domains[d.domain]}: ${d.text}`),report.disclaimer].filter(Boolean).join('\n\n');
}
