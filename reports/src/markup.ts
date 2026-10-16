import editorial from '../data/editorial-pt-BR.json' with { type: 'json' };
import { reportNarrativeEvents } from './text.ts';
import type { AstrologyReport, AstroReport, CompactAstrologyReport, ReportTextOptions } from './types.ts';

// Both formats share a small document tree, so content and heading order stay aligned.
interface Section {
  title: string;
  paragraphs?: string[];
  sections?: Section[];
}
interface Document {
  title: string;
  sections: Section[];
}

const domainLabels = editorial.narrative.domains;
const capitalized = (text: string) => text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1);
const headingText = (text: string) => text.replace(/\s+/gu, ' ').trim();
function paragraphs(text: string): string[] {
  return text.replace(/\r\n?/gu, '\n').split(/\n[\t ]*\n/gu)
    .map(value => value.trim().replace(/[\t ]*\n[\t ]*/gu, ' ')).filter(Boolean);
}

function escapeHTML(text: string): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/gu, character => entities[character]);
}

function escapeMarkdown(text: string): string {
  // Keep ordinary punctuation readable while neutralizing inline and block syntax.
  // Paragraphs and headings are already single lines, so only their start can form a list/fence.
  return text.replace(/[\\`*_{}\[\]<>#|~&]/gu, character => `\\${character}`)
    .replace(/^([+=-])/u, '\\$1')
    .replace(/^(\d{1,9})([.)])(?=\s|$)/u, '$1\\$2');
}

function renderHTML(document: Document): string {
  function section(value: Section, level: number, indent: string): string {
    const content = (value.paragraphs ?? []).flatMap(paragraphs).map(text => `${indent}  <p>${escapeHTML(text)}</p>`);
    const children = (value.sections ?? []).map(child => section(child, level + 1, `${indent}  `));
    return [`${indent}<section>`, `${indent}  <h${level}>${escapeHTML(headingText(value.title))}</h${level}>`,
      ...content, ...children, `${indent}</section>`].join('\n');
  }
  return ['<article lang="pt-BR">', `  <h1>${escapeHTML(headingText(document.title))}</h1>`,
    ...document.sections.map(value => section(value, 2, '  ')), '</article>'].join('\n');
}

function renderMarkdown(document: Document): string {
  function section(value: Section, level: number): string[] {
    return [`${'#'.repeat(level)} ${escapeMarkdown(headingText(value.title))}`,
      ...(value.paragraphs ?? []).flatMap(paragraphs).map(escapeMarkdown),
      ...(value.sections ?? []).flatMap(child => section(child, level + 1))];
  }
  return [`# ${escapeMarkdown(headingText(document.title))}`,
    ...document.sections.flatMap(value => section(value, 2))].join('\n\n');
}

function rangeLabel(range: AstrologyReport['range']): string {
  const format = new Intl.DateTimeFormat('pt-BR', { timeZone: range.timeZone, day: 'numeric', month: 'long', year: 'numeric' });
  const first = format.format(new Date(range.start));
  const last = format.format(new Date(Date.parse(range.endExclusive) - 1));
  return first === last ? first : `${first} a ${last}`;
}

function rangeNote(range: AstrologyReport['range']): string {
  const span = Date.parse(range.endExclusive) - Date.parse(range.start);
  const precision: Intl.DateTimeFormatOptions = span < 1000 ? { second: '2-digit', fractionalSecondDigits: 3 }
    : span < 60_000 ? { second: '2-digit' } : {};
  const format = new Intl.DateTimeFormat('pt-BR', { timeZone: range.timeZone, day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', ...precision });
  return `Período observado: de ${format.format(new Date(range.start))} a ${format.format(new Date(range.endExclusive))} (término exclusivo). Fuso: ${range.timeZone}.`;
}

function completeDocument(report: AstrologyReport, options: ReportTextOptions): Document {
  const events = reportNarrativeEvents(report, options);
  return {
    title: `Relatório completo: ${rangeLabel(report.range)}`,
    sections: [
      { title: 'Cronologia dos eventos',
        paragraphs: events.length ? [] : ['Nenhum evento foi encontrado no período selecionado.'],
        sections: events.map(event => ({ title: event.title, paragraphs: [event.chronology],
          sections: event.readings.map(reading => ({ title: reading.title, paragraphs: [reading.text] })),
        })),
      },
      { title: 'Sobre esta leitura', paragraphs: [rangeNote(report.range), report.disclaimer] },
    ],
  };
}

function compactDocument(report: CompactAstrologyReport): Document {
  return {
    title: `Relatório compacto: ${rangeLabel(report.range)}`,
    sections: [
      { title: 'Panorama', paragraphs: [report.overview] },
      { title: 'Destaques', paragraphs: report.highlights.length ? [] : ['Nenhum destaque foi selecionado para este período.'],
        sections: report.highlights.map(highlight => ({ title: highlight.title, paragraphs: [highlight.timing, highlight.text] })),
      },
      ...(report.domains.length ? [{ title: 'Áreas da vida', sections: report.domains.map(domain => ({
        title: capitalized(domainLabels[domain.domain]), paragraphs: [domain.text],
      })) }] : []),
      { title: 'Sobre esta leitura', paragraphs: [rangeNote(report.range), report.disclaimer] },
    ],
  };
}

function astroDocument(report: AstroReport): Document {
  return {
    title: report.title,
    sections: [
      { title: 'Panorama', paragraphs: [report.overview] },
      { title: 'O MOMENTO ATUAL', paragraphs: report.passages.length
        ? report.passages.flatMap(passage => passage.paragraphs) : ['Nenhuma passagem foi selecionada para este período.'] },
      { title: 'Sobre esta leitura', paragraphs: [rangeNote(report.range), report.disclaimer] },
    ],
  };
}

/** Basic HTML fragment with sections and escaped text, without styles or scripts. */
export function renderReportHTML(report: AstrologyReport, options: ReportTextOptions = {}): string {
  return renderHTML(completeDocument(report, options));
}
/** Markdown headings and paragraphs; report contents are treated as literal text. */
export function renderReportMarkdown(report: AstrologyReport, options: ReportTextOptions = {}): string {
  return renderMarkdown(completeDocument(report, options));
}
export function renderCompactReportHTML(report: CompactAstrologyReport): string {
  return renderHTML(compactDocument(report));
}
export function renderCompactReportMarkdown(report: CompactAstrologyReport): string {
  return renderMarkdown(compactDocument(report));
}
export function renderAstroReportHTML(report: AstroReport): string {
  return renderHTML(astroDocument(report));
}
export function renderAstroReportMarkdown(report: AstroReport): string {
  return renderMarkdown(astroDocument(report));
}
