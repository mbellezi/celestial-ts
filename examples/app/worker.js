import { reportRange } from './calendar.js';

let initialization;

const errorMessages = {
  unknownTimeZone: 'O fuso horário informado não foi reconhecido.',
  nonexistentTime: 'A meia-noite dessa data não existe no fuso selecionado devido a uma mudança de horário civil.',
  ambiguousTime: 'A meia-noite dessa data se repete no fuso selecionado; escolha outra data ou fuso.',
  invalidInstant: 'O instante informado é inválido.',
  invalidDateTime: 'A data ou a hora informada é inválida.',
};

function progress(id, phase, message, details = {}) {
  self.postMessage({ id, type: 'progress', phase, message, ...details });
}

async function downloadWasm(id) {
  progress(id, 'loading', 'Baixando o núcleo de cálculos…', { loaded: 0 });
  const response = await fetch(new URL('../../pkg/celestial_wasm_bg.wasm', import.meta.url));
  if (!response.ok) throw new Error(`Não foi possível carregar o WASM (HTTP ${response.status}).`);
  const length = Number(response.headers.get('content-length'));
  // Compressed transfer lengths cannot measure the decoded bytes returned by the stream.
  const total = length > 0 && !response.headers.get('content-encoding') ? length : undefined;
  let loaded = 0;
  const emit = () => progress(id, 'loading', 'Baixando o núcleo de cálculos…', {
    loaded, ...(total === undefined ? {} : { total, percent: Math.min(100, loaded / total * 100) }),
  });
  emit();
  if (!response.body) {
    const bytes = await response.arrayBuffer();
    loaded = bytes.byteLength;
    emit();
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let lastUpdate = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    if (performance.now() - lastUpdate >= 80) {
      emit();
      lastUpdate = performance.now();
    }
  }
  emit();
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function initialize(id) {
  if (initialization) return initialization;
  initialization = (async () => {
    progress(id, 'loading', 'Carregando as APIs e os catálogos do pacote…');
    const [core, reports, charts] = await Promise.all([
      import('../../pkg/celestial_wasm.js'),
      import('../../pkg/reports/index.js'),
      import('../../pkg/charts/index.js'),
    ]);
    const bytes = await downloadWasm(id);
    progress(id, 'initializing', 'Preparando o módulo WebAssembly…');
    await core.default({ module_or_path: bytes });
    return { reports, charts, generator: reports.createReportGenerator(core), calculator: charts.createChartCalculator(core) };
  })().catch(error => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

function astroResult(api, input) {
  const range = reportRange(input.kind, input.date);
  const report = api.generator.reportAstro({ ...range, timeZone: input.timeZone });
  return {
    kind: input.kind, title: report.title, range: report.range, report,
    html: api.reports.renderAstroReportHTML(report),
    text: api.reports.renderAstroReportText(report),
    markdown: api.reports.renderAstroReportMarkdown(report),
    json: JSON.stringify(report, null, 2),
  };
}

function natalResult(api, input) {
  const birth = input.birth;
  if (!birth || typeof birth.instant !== 'string' || typeof birth.timeZone !== 'string' || !birth.location
    || typeof birth.localDateTime !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(birth.localDateTime)) {
    throw new TypeError('Resolva a data, a hora e a cidade de nascimento antes de calcular o mapa.');
  }
  const chart = api.calculator.natal({
    instant: birth.instant, timeZone: birth.timeZone, location: birth.location,
    houseSystem: input.houseSystem ?? 'P', locale: 'pt-BR', bodies: [...api.reports.NATAL_BODIES, 'trueNode'],
  });
  const report = api.reports.interpretNatalChart(chart, { name: input.name });
  // Interpretations recanonicalize the chart through Intl. The confirmed civil
  // reading comes from the bundled tzdb/backzone, which may differ before 1970.
  // Format those local fields in UTC solely for presentation; keep the original
  // UTC instant, Julian day, positions, houses and aspects used for calculation.
  const localFields = new Date(`${birth.localDateTime}Z`);
  if (!Number.isFinite(localFields.getTime())) throw new TypeError('A data e a hora locais confirmadas são inválidas.');
  chart.displayDateTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'medium', hourCycle: 'h23',
  }).format(localFields);
  report.chart.displayDateTime = chart.displayDateTime;
  const title = report.name ? `${report.title}: ${report.name}` : report.title;
  const svgs = api.charts.renderChartBundle(chart, { title, locale: 'pt-BR', theme: 'botanical', colors: 'light', idPrefix: 'example-natal' });
  // The chart renderer currently builds its own long-format timestamp from
  // Intl instead of displayDateTime. Correct its visible/accessibility stamps;
  // the UTC metadata and all astronomical SVG geometry retain the same chart.
  const stampOptions = { dateStyle: 'long', timeStyle: 'medium' };
  const hostStamp = new Intl.DateTimeFormat('pt-BR', { ...stampOptions, timeZone: chart.timeZone }).format(new Date(chart.instant));
  const confirmedStamp = new Intl.DateTimeFormat('pt-BR', { ...stampOptions, timeZone: 'UTC' }).format(localFields);
  for (const key of Object.keys(svgs)) {
    if (typeof svgs[key] !== 'string') continue;
    svgs[key] = svgs[key]
      .replaceAll(` · ${hostStamp}</text>`, ` · ${confirmedStamp}</text>`)
      .replaceAll(`. ${hostStamp}.`, `. ${confirmedStamp}.`);
  }
  return {
    kind: 'natal', title, report, chart, birth,
    html: api.reports.renderNatalReportHTML(report),
    text: api.reports.renderNatalReportText(report),
    markdown: api.reports.renderNatalReportMarkdown(report),
    json: api.reports.renderNatalReportJSON(report, 2),
    svgs,
  };
}

self.addEventListener('message', async event => {
  const { id, type, input } = event.data ?? {};
  try {
    if (!['init', 'astro', 'natal'].includes(type)) throw new TypeError('Operação desconhecida.');
    const api = await initialize(id);
    if (type === 'init') {
      self.postMessage({ id, type: 'ready' });
      return;
    }
    if (!input || typeof input !== 'object') throw new TypeError('Dados de cálculo inválidos.');
    progress(id, 'calculating', type === 'natal' ? 'Calculando o mapa e organizando a leitura natal…' : 'Calculando os eventos e organizando a leitura…');
    const result = type === 'astro' ? astroResult(api, input) : natalResult(api, input);
    self.postMessage({ id, type: 'result', result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const houseFailure = error?.cause?.kind === 'HouseSystemFailed';
    const message = houseFailure
      ? 'Não foi possível calcular esse sistema de casas nessa latitude. Para latitudes polares, escolha Casas iguais (E) ou Signos inteiros (W).'
      : errorMessages[detail] ?? detail;
    self.postMessage({ id, type: 'error', message });
  }
});
