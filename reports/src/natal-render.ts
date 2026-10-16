import { NATAL_LABELS, NATAL_POINT_NAMES } from './natal-catalog.ts';
import type { NatalPerspective, NatalRenderOptions, NatalReport } from './natal-types.ts';

type Block = { kind: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] };
const signs = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
const names: Readonly<Record<string, string>> = { ...NATAL_POINT_NAMES, chiron: 'Quíron' };
const line = (value: string): string => value.replace(/\s+/gu, ' ').trim();
const decimal = new Intl.NumberFormat('pt-BR', { useGrouping: false, maximumFractionDigits: 6 });
const number = (value: number): string => value !== 0 && Math.abs(value) < 0.00001
  ? value.toExponential(5).replace('.', ',') : decimal.format(value);

function position(longitude: number): string {
  // Display truncation avoids displaying 30 degrees inside the preceding sign.
  // The canonical report retains the original full-precision coordinates.
  const sign = Math.floor(longitude / 30);
  const ticks = Math.floor((longitude - sign * 30) * 360_000);
  const degrees = Math.floor(ticks / 360_000), minutes = Math.floor(ticks / 6_000) % 60;
  const seconds = ((ticks % 6_000) / 100).toFixed(2).replace('.', ',');
  return `${degrees}°${String(minutes).padStart(2, '0')}′${seconds.padStart(5, '0')}″ ${signs[sign]}`;
}

function perspectives(options: NatalRenderOptions): NatalPerspective[] {
  if (!options || typeof options !== 'object' || Array.isArray(options)
    || Object.keys(options).some(k => k !== 'perspectives')) throw new RangeError('Opções de apresentação natal inválidas.');
  const chosen = options.perspectives ?? ['personal', 'professional'];
  if (!Array.isArray(chosen) || [...chosen].some(value => value !== 'personal' && value !== 'professional')
    || new Set(chosen).size !== chosen.length) throw new RangeError('Perspectivas natais inválidas.');
  return (['personal', 'professional'] as const).filter(value => chosen.includes(value));
}

/** One document tree supplies all human-readable representations of the same report. */
function document(report: NatalReport, options: NatalRenderOptions): Block[] {
  if (!report || report.scope !== 'natal-psychological' || !Array.isArray(report.sections)
    || !Array.isArray(report.readings) || !report.interpretations) throw new TypeError('Relatório natal inválido.');
  const domains = perspectives(options), blocks: Block[] = [];
  const heading = (level: 1 | 2 | 3 | 4, text: string) => blocks.push({ kind: 'heading', level, text: line(text) });
  const paragraph = (text: string) => { if (text.trim()) blocks.push({ kind: 'paragraph', text: line(text) }); };
  const readings = new Map(report.readings.map(value => [value.id, value]));
  const aspects = new Map(report.aspects.map(value => [value.id, value]));
  heading(1, report.name ? `${report.title}: ${report.name}` : report.title);
  paragraph(report.introduction);
  heading(2, 'Dados do nascimento');
  paragraph(`Data e hora: ${report.chart.displayDateTime}. Fuso: ${report.chart.timeZone}. Instante UTC: ${report.chart.instant}.`);
  const place = report.chart.location;
  paragraph(`Local: ${place.label ? `${place.label}; ` : ''}latitude ${number(place.latitude)}°, longitude ${number(place.longitude)}°.`);
  paragraph(`Zodíaco tropical, posições geocêntricas. Casas: ${({ P: 'Placidus', E: 'Iguais', W: 'Signos inteiros' })[report.chart.houses.system]}. Nodo lunar: ${report.coverage.nodesIncluded ? 'verdadeiro' : 'não incluído'}.`);
  heading(2, 'Posições calculadas');
  blocks.push({ kind: 'table', headers: ['Astro', 'Posição no zodíaco', 'Casa', 'Movimento', 'Velocidade (°/dia)'],
    rows: report.chart.bodies.map(body => [names[body.key] ?? body.key, position(body.longitude), String(body.house ?? ''),
      body.retrograde ? 'Retrógrado' : 'Direto', number(body.speedLongitude)]) });
  paragraph(`Ascendente: ${position(report.chart.houses.ascendant)}. Meio do Céu: ${position(report.chart.houses.midheaven)}.`);
  const node = report.readings.find(value => value.kind === 'nodeSign')?.evidence;
  if (node?.southNodeLongitude !== undefined) paragraph(`Nodo Sul: ${position(node.southNodeLongitude)}; casa ${node.southNodeHouse}.`);
  blocks.push({ kind: 'table', headers: ['Casa', 'Cúspide'], rows: report.chart.houses.cusps.slice(1).map((cusp, i) => [String(i + 1), position(cusp)]) });
  for (const section of report.sections) {
    if (!section.readingIds.length) continue;
    heading(2, section.title);
    for (const id of section.readingIds) {
      const reading = readings.get(id);
      if (!reading) throw new Error(`Leitura natal ausente: ${id}`);
      const interpretation = report.interpretations[reading.interpretationKey];
      if (!interpretation) throw new Error(`Interpretação natal ausente: ${reading.interpretationKey}`);
      heading(3, interpretation.title);
      if (reading.evidence.aspectId) {
        const aspect = aspects.get(reading.evidence.aspectId);
        if (!aspect) throw new Error(`Aspecto natal ausente: ${reading.evidence.aspectId}`);
        paragraph(`Separação: ${number(aspect.separation)}°. Orbe: ${number(aspect.orb)}°; limite configurado: ${number(aspect.maxOrb)}°.`);
      }
      for (const domain of domains) {
        heading(4, NATAL_LABELS[domain]);
        for (const text of interpretation[domain]) paragraph(text);
      }
    }
    const regent = report.regents.find(value => value.point === section.id);
    if (regent) {
      heading(3, NATAL_LABELS.regency ?? 'Regências');
      for (const [kind, body] of [['tradicional', regent.traditional], ['moderno', regent.modern]] as const) {
        if (!body) continue;
        const linked = report.readings.filter(value => (value.kind === 'sign' || value.kind === 'house')
          && value.evidence.points.includes(body)).map(value => report.interpretations[value.interpretationKey].title);
        paragraph(`Regente ${kind}: ${NATAL_POINT_NAMES[body]}. ${linked.join('; ')}.`);
      }
      if (NATAL_LABELS.rulerReference) paragraph(NATAL_LABELS.rulerReference);
    }
  }
  heading(2, 'Sobre esta leitura');
  paragraph(report.methodology);
  paragraph(`As casas dos corpos são atribuídas pela longitude eclíptica, sem antecipação para a casa seguinte. Aspectos menores: ${report.calculation.includeMinorAspects ? 'incluídos' : 'não incluídos'}.`);
  if (!report.coverage.nodesIncluded) paragraph('O mapa fornecido não inclui o nodo verdadeiro; a seção de nodos não foi gerada.');
  if (report.coverage.unsupportedBodies.length) paragraph(`Sem interpretação neste catálogo: ${report.coverage.unsupportedBodies.map(key => names[key] ?? key).join(', ')}.`);
  paragraph(report.disclaimer);
  return blocks;
}

function html(value: string): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/gu, character => entities[character]);
}
function markdown(value: string): string {
  return value.replace(/[\\`*_{}\[\]<>#|~&]/gu, character => `\\${character}`)
    .replace(/^([+=-])/u, '\\$1').replace(/^(\d{1,9})([.)])(?=\s|$)/u, '$1\\$2');
}

/** Serialize the canonical report without recalculating or rewriting interpretations. */
export function renderNatalReportJSON(report: NatalReport, space?: number): string {
  if (space !== undefined && (!Number.isInteger(space) || space < 0 || space > 10)) throw new RangeError('space deve ser inteiro entre 0 e 10.');
  return JSON.stringify(report, null, space);
}

export function renderNatalReportText(report: NatalReport, options: NatalRenderOptions = {}): string {
  return document(report, options).map(block => block.kind === 'table'
    ? [block.headers.join(' | '), ...block.rows.map(row => row.join(' | '))].join('\n') : block.text).join('\n\n');
}

export function renderNatalReportMarkdown(report: NatalReport, options: NatalRenderOptions = {}): string {
  return document(report, options).map(block => {
    if (block.kind === 'heading') return `${'#'.repeat(block.level)} ${markdown(block.text)}`;
    if (block.kind === 'paragraph') return markdown(block.text);
    const row = (values: string[]) => `| ${values.map(markdown).join(' | ')} |`;
    const separator = `| ${block.headers.map(() => '---').join(' | ')} |`;
    return [row(block.headers), separator, ...block.rows.map(row)].join('\n');
  }).join('\n\n');
}

/** Simple semantic HTML fragment; no scripts, styles, links or external resources. */
export function renderNatalReportHTML(report: NatalReport, options: NatalRenderOptions = {}): string {
  const body = document(report, options).map(block => {
    if (block.kind === 'heading') return `  <h${block.level}>${html(block.text)}</h${block.level}>`;
    if (block.kind === 'paragraph') return `  <p>${html(block.text)}</p>`;
    return ['  <table>', `    <thead><tr>${block.headers.map(text => `<th scope="col">${html(text)}</th>`).join('')}</tr></thead>`,
      '    <tbody>', ...block.rows.map(row => `      <tr>${row.map(text => `<td>${html(text)}</td>`).join('')}</tr>`), '    </tbody>', '  </table>'].join('\n');
  });
  return ['<article lang="pt-BR">', ...body, '</article>'].join('\n');
}
