import editorial from '../data/editorial-pt-BR.json' with { type: 'json' };
import { astroReading, ASTRO_EDITORIAL_VERSION } from './astro-editorial.ts';
import type { AstrologyReport, AstroPassage, AstroReport, AstroReportOptions, ReportEvent } from './types.ts';

export const ASTRO_REPORT_VERSION = '1.0.0';
const labels = editorial.narrative;
const DAY = 86_400_000;
const slow = new Set(['jupiter', 'saturn', 'uranus', 'neptune', 'pluto']);
const unique = (values: string[]) => [...new Set(values)];

export function normalizeAstroOptions(options: AstroReportOptions = {}, range?: AstrologyReport['range']) {
  const maxEvents = options.maxEvents;
  if (maxEvents !== undefined && (!Number.isInteger(maxEvents) || maxEvents < 1 || maxEvents > 32)) {
    throw new RangeError('maxEvents must be an integer from 1 to 32');
  }
  return { maxEvents: maxEvents ?? (range ? calendar(range).kind === 'day' ? 4 : 18 : undefined),
    version: ASTRO_REPORT_VERSION, editorialVersion: ASTRO_EDITORIAL_VERSION };
}

function calendar(range: AstrologyReport['range']) {
  const start = Date.parse(range.start), end = Date.parse(range.endExclusive);
  const format = new Intl.DateTimeFormat('en-CA', { timeZone: range.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const date = (at: string | number) => format.format(new Date(at));
  const first = date(start), last = date(end - 1);
  const nextMonth = new Date(`${first.slice(0, 7)}-01T00:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const midnight = (at: number) => at % 1000 === 0 && new Intl.DateTimeFormat('en-GB', {
    timeZone: range.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(at) === '00:00:00';
  const month = first.endsWith('-01') && date(end) === nextMonth.toISOString().slice(0, 10) && midnight(start) && midnight(end);
  const kind: AstroReport['kind'] = first === last ? 'day' : month ? 'month' : 'period';
  return { start, end, first, last, date, kind };
}

type Candidate = { event: ReportEvent; exact: string[]; at: string; background: boolean; rank: number };
type Moment = Candidate & { moment?: string };

function candidates(report: AstrologyReport, kind: AstroReport['kind']): Candidate[] {
  const start = Date.parse(report.range.start), end = Date.parse(report.range.endExclusive);
  const inside = (at: string) => Date.parse(at) >= start && Date.parse(at) < end;
  const entries = report.entries.filter(({ event: e }) => e.start === e.end ? inside(e.start)
    : Date.parse(e.start) < end && Date.parse(e.end) > start);
  const eclipses = entries.filter(({ event }) => event.kind === 'eclipse').map(({ event }) => event);
  const phases = entries.filter(({ event }) => event.kind === 'phase').map(({ event }) => event);
  const near = (a: ReportEvent, b: ReportEvent) => {
    const times = a.kind === 'eclipse' && typeof a.details.fullMaximum === 'string' ? [a.details.fullMaximum] : a.exact;
    return times.some(t => b.exact.some(u => Math.abs(Date.parse(t) - Date.parse(u)) < DAY));
  };
  return entries.flatMap(({ event: e }) => {
    // A lunation is described once, preferring the physical eclipse where applicable.
    if (eclipses.some(ec => {
      const solar = ec.catalogKey.split(':')[1] === 'solar';
      return ((e.kind === 'phase' && e.catalogKey.split(':')[1] === (solar ? 'new' : 'full'))
        || (e.kind === 'aspect' && e.bodies.includes('sun') && e.bodies.includes('moon')
          && Number(e.catalogKey.split(':')[3]) === (solar ? 0 : 180))) && near(ec, e);
    })) return [];
    if (e.kind === 'aspect' && e.bodies.includes('sun') && e.bodies.includes('moon')
      && phases.some(p => Number(p.details.angle) % 180 === Number(e.catalogKey.split(':')[3]) % 180 && near(p, e))) return [];
    const exact = unique(e.exact.filter(inside)).sort();
    const ingress = e.kind === 'sign' && !e.boundary.startClipped && inside(e.start);
    // Retrograde segments can contain their terminal direct station: their exact array is not an onset.
    const background = e.kind === 'retrograde' || (e.kind === 'sign' ? !ingress : !exact.length);
    const at = !background && exact.length ? exact[0] : new Date(Math.max(start, Date.parse(e.start))).toISOString();
    const lunar = e.bodies.includes('moon');
    let rank = e.kind === 'eclipse' ? 120 : e.kind === 'station' ? 110
      : e.kind === 'phase' ? ['new', 'full'].includes(e.catalogKey.split(':')[1]) ? 100 : 56
      : ingress && !lunar ? slow.has(e.bodies[0]) ? 108 : 88
      : e.kind === 'aspect' && exact.length ? e.bodies.every(b => slow.has(b)) ? 106 : lunar ? 48 : 85
      : ingress ? 46 : e.kind === 'aspect' ? 32 : e.kind === 'retrograde' ? 24 : 12;
    if (e.kind === 'aspect' && e.bodies.some(b => slow.has(b))) rank += 4;
    if (background) rank -= 40;
    if (kind === 'day' && !background) rank += 100;
    return [{ event: e, exact, at, background, rank }];
  }).sort((a, b) => b.rank - a.rank || a.at.localeCompare(b.at) || a.event.id.localeCompare(b.event.id));
}

function select(candidates: Candidate[], maxEvents: number, kind: AstroReport['kind'], date: (at: string) => string): Candidate[] {
  const selected: Candidate[] = [];
  const changing = candidates.filter(c => !c.background);
  const add = (c: Candidate) => { if (selected.length < maxEvents && !selected.includes(c)) selected.push(c); };
  // Monthly openings should cover the actual month's progression, not only its busiest week.
  if (kind === 'month' && maxEvents >= 3) {
    for (const third of [0, 1, 2]) {
      const candidate = changing.find(c => Math.min(2, Math.floor((Number(date(c.at).slice(-2)) - 1) / 10)) === third);
      if (candidate) add(candidate);
    }
  }
  for (const c of changing) add(c);
  const backgroundLimit = changing.length ? 1 : 2;
  let backgrounds = 0;
  for (const c of candidates.filter(c => c.background)) {
    if (backgrounds >= backgroundLimit) break;
    // Do not repeat a planet's retrograde segment beside its selected station or ingress.
    if (c.event.kind === 'retrograde' && selected.some(s => s.event.bodies[0] === c.event.bodies[0]
      && ['station', 'sign'].includes(s.event.kind))) continue;
    if (selected.some(s => s.event.catalogKey === c.event.catalogKey)) continue;
    if (selected.length < maxEvents) { add(c); backgrounds++; }
  }
  return selected.sort((a, b) => a.at.localeCompare(b.at) || a.event.id.localeCompare(b.event.id));
}

function facts(moment: Moment, report: AstrologyReport, kind: AstroReport['kind']): string {
  const { event: e, background, at } = moment;
  const [, first, second, third] = e.catalogKey.split(':');
  const body = labels.bodies[e.bodies[0]];
  const sign = labels.signs[Number(second)];
  const zone = report.range.timeZone;
  const date = (t: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: zone, day: 'numeric', month: 'long',
    ...(kind === 'period' ? { year: 'numeric' as const } : {}) }).format(new Date(t));
  const clock = (t: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(t));
  const when = kind === 'day' ? `Às ${clock(at)}` : `No dia ${date(at)}`;
  if (e.kind === 'aspect') {
    const aspect = labels.aspects[third as keyof typeof labels.aspects];
    const pair = `${body} e ${labels.bodies[e.bodies[1]]}`;
    if (!background) return `${when}, ${pair} formarão ${aspect} exat${['0', '90', '180'].includes(third) ? 'a' : 'o'}.`;
    const until = new Date(Math.min(Date.parse(e.end), Date.parse(report.range.endExclusive)) - 1).toISOString();
    const span = kind === 'day' ? 'Durante parte do dia' : `Entre ${date(at)} e ${date(until)}`;
    return `${span}, ${pair} estarão em ${aspect}, dentro da orbe considerada. O encontro exato não ocorre neste recorte.`;
  }
  if (e.kind === 'sign') return background
    ? `${kind === 'day' ? `Às ${clock(at)}` : `Em ${date(at)}`}, ${body} já estará em ${sign}.`
    : `${when}, ${body} entrará em ${sign}.`;
  if (e.kind === 'station') return `${when}, ${body} ${second === 'direct' ? 'retomará o movimento direto' : 'começará a retrogradar'}.`;
  if (e.kind === 'retrograde') return `${kind === 'day' ? 'Durante parte do dia' : `Em ${date(at)}`}, ${body} estará em movimento retrógrado em ${sign}.`;
  if (e.kind === 'phase') return `${when}, ocorrerá ${labels.phases[first as keyof typeof labels.phases]}, com a Lua em ${sign}.`;
  const category = first === 'solar' ? 'solar' : 'lunar';
  return moment.moment
    ? `${when}, o eclipse ${category} atingirá seu máximo global, com ${first === 'solar' ? 'o Sol' : 'a Lua'} em ${sign}.`
    : `Parte do intervalo físico global do eclipse ${category} coincide com ${kind === 'day' ? 'este dia' : 'este período'}; seu máximo fica fora do recorte. Isso não determina sua visibilidade local.`;
}

function opening(selected: Candidate[], kind: AstroReport['kind'], date: (at: string) => string): string {
  if (!selected.length) return 'Este recorte não apresenta destaques entre os eventos calculados. A seleção disponível não permite desenvolver uma leitura do período.';
  const strongest = [...selected].sort((a, b) => b.rank - a.rank || a.at.localeCompare(b.at) || a.event.id.localeCompare(b.event.id))[0];
  const reading = astroReading(strongest.event, kind);
  const first = `${kind === 'month' ? 'O mês' : kind === 'day' ? 'O dia' : 'O período'} convidará você a ${reading.theme.charAt(0).toLocaleLowerCase('pt-BR') + reading.theme.slice(1)}.`;
  if (kind === 'month') {
    const progression: string[] = [];
    const transitions = ['Nos primeiros dias, haverá um convite à reflexão sobre', 'Na parte central do mês, o foco estará em', 'O terço final dará destaque a temas como'];
    for (const [index, label] of transitions.entries()) {
      const current = selected.filter(c => !c.background && Math.min(2, Math.floor((Number(date(c.at).slice(-2)) - 1) / 10)) === index)
        .sort((a, b) => b.rank - a.rank || a.at.localeCompare(b.at) || a.event.id.localeCompare(b.event.id))[0];
      if (current) progression.push(`${label} ${astroReading(current.event, kind).focus}.`);
    }
    return [first, reading.overview, ...progression].join(' ');
  }
  const other = selected.find(c => c.event.id !== strongest.event.id && astroReading(c.event, kind).focus !== reading.focus);
  return [first, reading.overview, ...(other ? [astroReading(other.event, kind).overview] : [])].join(' ');
}

/** Versioned prose composed locally from selected calculated events, without a language-model service. */
export function astroReport(report: AstrologyReport, options: AstroReportOptions = {}): AstroReport {
  const normalized = normalizeAstroOptions(options, report.range), period = calendar(report.range);
  const maxEvents = normalized.maxEvents ?? (period.kind === 'day' ? 4 : 18);
  const selected = select(candidates(report, period.kind), maxEvents, period.kind, period.date);
  const moments: Moment[] = selected.flatMap(c => c.background || !c.exact.length ? [c]
    : c.exact.map(moment => ({ ...c, at: moment, moment })));
  moments.sort((a, b) => a.at.localeCompare(b.at) || a.event.id.localeCompare(b.event.id));
  const groups: Moment[][] = [];
  for (const moment of moments) {
    const last = groups.at(-1);
    // Connect nearby events, keeping their individual dates and precise source moments.
    const span = last && (period.kind === 'day' ? period.date(last[0].at) === period.date(moment.at)
      : Date.parse(moment.at) - Date.parse(last[0].at) < 2 * DAY);
    if (last && span && last.length < (period.kind === 'day' ? 2 : 3) && last[0].background === moment.background) last.push(moment);
    else groups.push([moment]);
  }
  const usedParagraphs = new Set<string>();
  const passages: AstroPassage[] = groups.map(group => {
    const ranked = [...group].sort((a, b) => b.rank - a.rank || a.at.localeCompare(b.at) || a.event.id.localeCompare(b.event.id));
    const readings = group.map(c => astroReading(c.event, period.kind));
    const paragraphs = group.flatMap((moment, index) => {
      let factual = facts(moment, report, period.kind);
      // State a shared date once; keep exact clock times in a daily reading.
      if (period.kind !== 'day' && index > 0 && period.date(group[index - 1].at) === period.date(moment.at)) {
        factual = factual.replace(/^No dia [^,]+, /u, index === 1 ? 'No mesmo dia, ' : 'Também nesse dia, ');
      }
      const reading = readings[index];
      const parts = [reading.lead, reading.nuance].filter(part => {
        if (!part || usedParagraphs.has(part)) return false;
        usedParagraphs.add(part);
        return true;
      });
      const prose = [[factual, ...parts].join(' ')];
      // Develop one event in each cluster, next to the facts it explains.
      if (moment === ranked[0]) {
        for (const paragraph of reading.paragraphs.slice(1)) {
          if (!usedParagraphs.has(paragraph)) { prose.push(paragraph); usedParagraphs.add(paragraph); }
        }
      }
      return prose;
    });
    return { at: group[0].at, background: group[0].background,
      eventIds: unique(group.map(c => c.event.id)), interpretationKeys: unique(group.map(c => c.event.catalogKey)),
      sourceKeys: unique(readings.flatMap(r => r.sourceKeys)), exact: unique(group.flatMap(c => c.moment ? [c.moment] : c.exact)).sort(),
      paragraphs,
    };
  });
  const strongest = [...selected].sort((a, b) => b.rank - a.rank || a.at.localeCompare(b.at) || a.event.id.localeCompare(b.event.id))[0];
  const titleDate = (at: string, monthOnly = false) => new Intl.DateTimeFormat('pt-BR', { timeZone: report.range.timeZone,
    ...(monthOnly ? {} : { day: 'numeric' as const }), month: 'long', year: 'numeric' }).format(new Date(at));
  const label = period.kind === 'month' ? `O MÊS DE ${titleDate(report.range.start, true)}`
    : period.kind === 'day' ? `O DIA ${titleDate(report.range.start)}`
    : `O PERÍODO DE ${titleDate(report.range.start)} A ${titleDate(new Date(period.end - 1).toISOString())}`;
  const title = `${label}: ${strongest ? astroReading(strongest.event, period.kind).theme : 'Observar o momento'}`.toLocaleUpperCase('pt-BR');
  const count = new Set(selected.map(c => c.event.id)).size;
  return { version: ASTRO_REPORT_VERSION, editorialVersion: ASTRO_EDITORIAL_VERSION, sourceReportVersion: report.version,
    catalogVersion: report.catalogVersion, locale: 'pt-BR', style: 'astro', kind: period.kind, range: { ...report.range },
    title, overview: opening(selected, period.kind, period.date), passages,
    selection: { totalEvents: report.entries.length, selectedEvents: count, omittedEvents: report.entries.length - count, maxEvents,
      policy: 'Seleção editorial de eclipses, estações, lunações, ingressos e aspectos exatos; distribuição ao longo do mês e até um contexto já em curso (dois na ausência de mudanças). Não mede intensidade nem probabilidade.' },
    disclaimer: 'Leitura astrológica simbólica e coletiva, sem caráter de previsão individual, diagnóstico ou orientação de investimento.',
  };
}

export function renderAstroReportText(report: AstroReport): string {
  return [report.title, report.overview, 'O MOMENTO ATUAL', ...report.passages.flatMap(p => p.paragraphs),
    `Datas e horários no fuso ${report.range.timeZone}.`, report.disclaimer].join('\n\n');
}
