import { todayInTimeZone, formatUtcOffset, reportRange } from './calendar.js';

const $ = id => document.getElementById(id);
const modes = {
  dia: { kind: 'day', title: 'O céu do dia', eyebrow: '01 / RELATÓRIO DO DIA', description: 'Selecione uma data para consultar a leitura Astro do dia.', aside: 'Uma pausa no dia', copy: 'Uma leitura dos trânsitos do dia, com temas para refletir sobre suas reações e escolhas cotidianas.', detail: 'O relatório considera o dia completo no fuso selecionado. Você pode baixar a mesma leitura em quatro formatos.', icon: 'sun' },
  mes: { kind: 'month', title: 'O céu do mês', eyebrow: '02 / RELATÓRIO DO MÊS', description: 'Escolha o mês e o ano para consultar a leitura Astro do período.', aside: 'O mês, por inteiro', copy: 'Observe os temas do mês e suas possíveis relações com conflitos internos, desejos e possibilidades de mudança.', detail: 'A leitura vai do primeiro ao último dia do mês. Os horários dos eventos seguem o fuso que você escolher.', icon: 'moon' },
  natal: { kind: 'natal', title: 'O seu mapa natal', eyebrow: '03 / MAPA NATAL', description: 'Informe data, horário e local de nascimento para calcular o mapa natal e consultar sua leitura.', aside: 'Um olhar para você', copy: 'Explore os símbolos do seu mapa como pontos de partida para compreender necessidades emocionais, recursos pessoais e contradições.', detail: 'Nascimentos de 1930 a 2040. O fuso histórico da cidade é aplicado automaticamente. Se o horário ocorreu duas vezes, você poderá escolher a ocorrência.', icon: 'orbit' },
};
let mode = 'inicio', ready = false, busy = false, worker, locations, cityClient;
let sequence = 0, initializationGeneration = 0, activeCalculation = 0, selectedCity = null;
let searchTimer, searchController, searchSequence = 0, candidates = [], activeOption = -1;
let currentResult = null, timeChoice = null;
const requests = new Map();
const rememberedDates = {};

function setError(message) {
  $('form-error').textContent = message ?? '';
  $('form-error').hidden = !message;
}
function setButtons() {
  document.querySelectorAll('.generate-button').forEach(button => { button.disabled = !ready || busy; });
  $('period-fields').disabled = busy;
  $('natal-fields').disabled = busy;
}
function showView(name) {
  for (const id of ['home', 'form', 'result']) $(id + '-view').hidden = id !== name;
  $('busy-panel').hidden = name !== 'busy';
}
function focusHeading(id) {
  window.scrollTo({ top: 0, behavior: 'instant' });
  $(id).focus({ preventScroll: true });
}
function route() {
  const routeName = location.hash.slice(1);
  if (routeName === 'main') { $('main').focus(); return; }
  const nextMode = Object.hasOwn(modes, routeName) ? routeName : 'inicio';
  if (timeChoice && nextMode !== 'natal') finishTimeChoice(null);
  if (busy) cancelCalculation(false);
  mode = nextMode;
  setError();
  document.querySelectorAll('.main-nav a').forEach(link => {
    if (link.hash === '#' + mode) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (mode === 'inicio') {
    showView('home');
    if (routeName === 'explorar') $('explorar').scrollIntoView();
    else focusHeading('home-title');
    return;
  }
  const config = modes[mode];
  $('form-title').textContent = config.title;
  $('form-eyebrow').textContent = config.eyebrow;
  $('form-description').textContent = config.description;
  $('aside-title').textContent = config.aside;
  $('aside-eyebrow').textContent = mode === 'natal' ? 'SEU MAPA, SEUS DADOS' : 'LEITURA ASTRO';
  $('aside-description').textContent = config.copy;
  $('aside-detail').textContent = config.detail;
  $('form-icon').firstElementChild.setAttribute('href', '#icon-' + config.icon);
  $('natal-form').hidden = mode !== 'natal';
  $('period-form').hidden = mode === 'natal';
  if (mode !== 'natal') {
    const month = mode === 'mes', input = $('period-date');
    input.type = month ? 'month' : 'date';
    input.min = month ? '2026-01' : '2026-01-01';
    input.max = month ? '2035-12' : '2035-12-31';
    input.value = rememberedDates[mode] ?? todayInTimeZone($('period-zone').value).slice(0, month ? 7 : 10);
    $('period-label').textContent = month ? 'Escolha o mês e o ano' : 'Escolha uma data';
    $('period-submit-label').textContent = month ? 'Gerar relatório do mês' : 'Gerar relatório do dia';
  }
  showView('form');
  focusHeading('form-title');
}

function request(type, input, onProgress) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      const error = new Error('O processamento demorou mais que o esperado. Tente novamente.');
      failWorker(error);
    }, type === 'init' ? 120_000 : 180_000);
    requests.set(id, { resolve, reject, onProgress, timeout });
    worker.postMessage({ id, type, input });
  });
}
function clearRequests(error) {
  for (const pending of requests.values()) {
    clearTimeout(pending.timeout);
    pending.reject(error);
  }
  requests.clear();
}
function bootFailure(error) {
  ready = false;
  setButtons();
  $('boot-panel').hidden = false;
  $('boot-panel').classList.add('failed');
  $('boot-panel').setAttribute('aria-busy', 'false');
  $('boot-title').textContent = 'Não foi possível carregar';
  $('boot-message').textContent = error.message || 'Confira a conexão e tente novamente.';
  $('boot-progress').hidden = true;
  $('boot-percent').textContent = '';
  $('retry-boot').hidden = false;
  $('engine-status').className = 'engine-status failed';
  $('engine-label').textContent = 'Carregamento interrompido';
}
function failWorker(error) {
  worker?.terminate();
  clearRequests(error);
  bootFailure(error);
}
function bootProgress(message) {
  $('boot-message').textContent = message.message;
  const determinate = message.phase === 'loading' && message.total > 0;
  $('boot-progress').hidden = false;
  if (determinate) {
    $('boot-progress').max = message.total;
    $('boot-progress').value = message.loaded;
    $('boot-percent').textContent = Math.floor(Math.min(100, message.loaded / message.total * 100)) + '%';
  } else {
    $('boot-progress').removeAttribute('value');
    $('boot-percent').textContent = '';
  }
}
async function boot() {
  const generation = ++initializationGeneration;
  ready = false;
  worker?.terminate();
  clearRequests(new Error('Carregamento reiniciado.'));
  setButtons();
  $('boot-panel').hidden = false;
  $('boot-panel').classList.remove('failed');
  $('boot-panel').setAttribute('aria-busy', 'true');
  $('boot-title').textContent = 'Preparando o seu espaço';
  $('retry-boot').hidden = true;
  $('engine-status').className = 'engine-status';
  $('engine-label').textContent = 'Preparando o céu';
  bootProgress({ message: 'Carregando a biblioteca de cálculos. Você já pode escolher uma leitura.' });
  try {
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module', name: 'celestial-example' });
    worker.addEventListener('message', ({ data }) => {
      if (generation !== initializationGeneration) return;
      const pending = requests.get(data.id);
      if (!pending) return;
      if (data.type === 'progress') { pending.onProgress?.(data); return; }
      clearTimeout(pending.timeout);
      requests.delete(data.id);
      if (data.type === 'error') pending.reject(new Error(data.message));
      else pending.resolve(data.result);
    });
    worker.addEventListener('error', event => {
      event.preventDefault();
      if (generation === initializationGeneration) failWorker(new Error('Não foi possível executar o motor. Use um navegador atualizado e confira se os arquivos da aplicação estão disponíveis.'));
    });
    await Promise.all([
      request('init', undefined, bootProgress),
      import('../../pkg/locations/index.js').then(module => {
        if (generation !== initializationGeneration) return;
        locations = module;
        cityClient = module.createCitySearchClient();
      }),
    ]);
    if (generation !== initializationGeneration) return;
    ready = true;
    $('boot-panel').hidden = true;
    $('boot-panel').setAttribute('aria-busy', 'false');
    $('engine-status').className = 'engine-status ready';
    $('engine-label').textContent = 'Pronto para explorar';
    setButtons();
    if (mode === 'natal' && !selectedCity && $('city-search').value.trim().length >= 2) searchCities();
  } catch (error) {
    if (generation === initializationGeneration) {
      worker?.terminate();
      clearRequests(error);
      bootFailure(error);
    }
  }
}

function closeOptions() {
  $('city-options').hidden = true;
  $('city-search').setAttribute('aria-expanded', 'false');
  $('city-search').removeAttribute('aria-activedescendant');
  activeOption = -1;
}
function highlightOption(index) {
  activeOption = index;
  [...$('city-options').children].forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
  const option = $('city-options').children[index];
  if (option) {
    $('city-search').setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  }
}
function selectCity(index) {
  const city = candidates[index];
  if (!city) return;
  selectedCity = city;
  $('city-search').value = city.label;
  $('city-search').setCustomValidity('');
  $('city-status').textContent = 'Cidade selecionada. O fuso histórico será aplicado à data informada.';
  const name = document.createElement('strong'); name.textContent = city.label;
  const detail = document.createElement('span'); detail.textContent = `${city.latitude.toFixed(4)}°, ${city.longitude.toFixed(4)}° · ${city.timeZone}`;
  $('selected-city').replaceChildren(name, detail);
  $('selected-city').hidden = false;
  closeOptions();
  $('city-search').focus();
}
async function searchCities() {
  const query = $('city-search').value.trim(), currentSearch = ++searchSequence;
  searchController?.abort();
  searchController = new AbortController();
  closeOptions();
  candidates = [];
  if (query.length < 2) { $('city-status').textContent = 'Digite ao menos duas letras e selecione uma cidade.'; return; }
  if (!cityClient) { $('city-status').textContent = 'Aguarde o carregamento da biblioteca para buscar cidades.'; return; }
  $('city-status').textContent = 'Buscando cidades…';
  try {
    const result = await cityClient.search(query, { signal: searchController.signal });
    if (currentSearch !== searchSequence) return;
    candidates = result;
    $('city-options').replaceChildren(...result.map((city, index) => {
      const option = document.createElement('li');
      option.className = 'city-option'; option.id = `city-option-${index}`;
      option.setAttribute('role', 'option'); option.setAttribute('aria-selected', 'false');
      const label = document.createElement('span'); label.textContent = city.label;
      const detail = document.createElement('small'); detail.textContent = city.timeZone;
      option.append(label, detail);
      option.addEventListener('mousedown', event => event.preventDefault());
      option.addEventListener('click', () => selectCity(index));
      return option;
    }));
    $('city-status').textContent = result.length ? `${result.length} cidades encontradas. Selecione a sua cidade.` : 'Nenhuma cidade encontrada. Tente o início do nome ou acrescente o estado ou país.';
    $('city-options').hidden = !result.length;
    $('city-search').setAttribute('aria-expanded', String(!!result.length));
  } catch (error) {
    if (currentSearch !== searchSequence || error.code === 'aborted') return;
    $('city-status').textContent = 'Não foi possível buscar cidades. Confira sua conexão e digite novamente para tentar.';
  }
}
$('city-search').addEventListener('input', () => {
  selectedCity = null;
  $('selected-city').hidden = true;
  $('city-search').setCustomValidity('');
  clearTimeout(searchTimer); searchController?.abort(); searchSequence++;
  closeOptions();
  searchTimer = setTimeout(searchCities, 350);
});
$('city-search').addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeOptions(); return; }
  if ($('city-options').hidden || !candidates.length) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    highlightOption(activeOption < 0 ? (event.key === 'ArrowDown' ? 0 : candidates.length - 1)
      : (activeOption + (event.key === 'ArrowDown' ? 1 : -1) + candidates.length) % candidates.length);
  } else if (event.key === 'Enter' && activeOption >= 0) { event.preventDefault(); selectCity(activeOption); }
});
document.addEventListener('click', event => { if (!event.target.closest('.city-combobox')) closeOptions(); });
$('city-search').addEventListener('blur', closeOptions);

function chooseTime(error) {
  return new Promise(resolve => {
    timeChoice = resolve;
    $('time-candidates').replaceChildren(...error.candidates.map((candidate, index) => {
      const label = document.createElement('label'); label.className = 'time-candidate';
      const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'occurrence';
      radio.value = index === 0 ? 'earlier' : 'later'; radio.required = true;
      const description = document.createElement('span');
      const title = document.createElement('strong'); title.textContent = `${index === 0 ? 'Primeira' : 'Segunda'} ocorrência · ${formatUtcOffset(candidate.utcOffsetSeconds)}`;
      const instant = document.createElement('small'); instant.textContent = `Tempo universal: ${formatInstant(candidate.instant)} UTC`;
      description.append(title, instant); label.append(radio, description); return label;
    }));
    $('time-dialog').showModal();
  });
}
function finishTimeChoice(value) {
  const resolve = timeChoice; timeChoice = null;
  $('time-dialog').close(); resolve?.(value);
}
$('time-choice-form').addEventListener('submit', event => {
  event.preventDefault();
  finishTimeChoice(new FormData(event.currentTarget).get('occurrence'));
});
$('cancel-time-choice').addEventListener('click', () => finishTimeChoice(null));
$('time-dialog').addEventListener('cancel', event => { event.preventDefault(); finishTimeChoice(null); });
$('time-dialog').addEventListener('close', () => { if (timeChoice) finishTimeChoice(null); });

function formatInstant(value) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(value));
}
async function calculate(type, input) {
  if (!ready || busy) return;
  const token = ++activeCalculation;
  busy = true; setButtons(); setError(); closeOptions(); showView('busy');
  $('busy-title').textContent = type === 'natal' ? 'Desenhando seu mapa' : 'Preparando sua leitura';
  $('busy-message').textContent = 'Calculando as posições e organizando o relatório…';
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('busy-title').focus({ preventScroll: true });
  try {
    const result = await request(type, input, progress => { $('busy-message').textContent = progress.message; });
    if (token !== activeCalculation) return;
    currentResult = result;
    renderResult(result);
  } catch (error) {
    if (token !== activeCalculation) return;
    showView('form'); setError(error.message);
  } finally {
    if (token === activeCalculation) { busy = false; setButtons(); }
  }
}
function cancelCalculation(showForm = true) {
  ++activeCalculation;
  busy = false;
  if (showForm) showView('form');
  boot();
}
$('period-form').addEventListener('submit', event => {
  event.preventDefault();
  const kind = modes[mode].kind, date = $('period-date').value;
  rememberedDates[mode] = date;
  try { reportRange(kind, date); }
  catch (error) { setError(error.message); return; }
  calculate('astro', { kind, date, timeZone: $('period-zone').value });
});
$('period-date').addEventListener('change', () => { rememberedDates[mode] = $('period-date').value; });
$('natal-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!ready || busy) return;
  setError();
  if (!selectedCity) {
    $('city-search').setCustomValidity('Selecione uma cidade na lista de resultados.');
    $('city-search').reportValidity(); return;
  }
  const birthInput = { date: $('birth-date').value, time: $('birth-time').value, location: selectedCity };
  const name = $('birth-name').value.trim() || undefined, houseSystem = $('house-system').value;
  try {
    let birth;
    try { birth = locations.resolveBirthTime(birthInput); }
    catch (error) {
      if (error.code !== 'ambiguous_time') throw error;
      const disambiguation = await chooseTime(error);
      if (!disambiguation || mode !== 'natal' || !ready) return;
      birth = locations.resolveBirthTime({ ...birthInput, disambiguation });
    }
    if (birth.instant < '1930-01-01T00:00:00.000Z' || birth.instant >= '2041-01-01T00:00:00.000Z') {
      throw new Error('Após a conversão de fuso, esse nascimento fica fora do intervalo UTC de 1930 a 2040 aceito pelo mapa natal.');
    }
    await calculate('natal', { birth, name, houseSystem });
  } catch (error) { setError(error.message); }
});

function renderChart() {
  const svg = currentResult?.svgs?.[$('chart-kind').value];
  // Only markup generated by the library's escaping SVG renderer enters this container.
  $('chart-svg').innerHTML = svg ?? '';
  $('download-svg').disabled = !svg;
}
function renderResult(result) {
  $('result-title').textContent = result.title;
  $('result-eyebrow').textContent = result.kind === 'natal' ? 'SEU MAPA NATAL' : 'RELATÓRIO ASTRO · ' + (result.kind === 'month' ? 'MÊS' : 'DIA');
  $('result-context').textContent = result.kind === 'natal' ? result.birth.location.label ?? '' : `Horários em ${result.range.timeZone}`;
  $('chart-panel').hidden = result.kind !== 'natal';
  $('birth-summary').hidden = result.kind !== 'natal';
  if (result.kind === 'natal') {
    const birth = result.birth;
    const summary = [
      ['Nascimento local', formatInstant(birth.localDateTime + 'Z')],
      ['Fuso histórico', `${birth.timeZone} · ${formatUtcOffset(birth.utcOffsetSeconds)}`],
      ['Tempo universal', formatInstant(birth.instant) + ' UTC'],
      ...(birth.resolution !== 'unique' ? [['Ocorrência confirmada', birth.resolution === 'earlier' ? 'Primeira ocorrência' : 'Segunda ocorrência']] : []),
    ];
    $('birth-summary').replaceChildren(...summary.map(([label, value]) => {
      const block = document.createElement('div'), title = document.createElement('small');
      title.textContent = label; block.append(title, document.createTextNode(value)); return block;
    }));
    $('chart-kind').value = 'wheel';
    for (const option of $('chart-kind').options) option.disabled = !result.svgs[option.value];
    renderChart();
  }
  // HTML comes exclusively from the library's text-escaping report renderers.
  $('report-content').innerHTML = result.html;
  for (const table of $('report-content').querySelectorAll('table')) {
    const wrapper = document.createElement('div'); wrapper.className = 'table-scroll';
    wrapper.tabIndex = 0; wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', 'Tabela do relatório, deslize para ver todas as colunas');
    table.replaceWith(wrapper); wrapper.append(table);
  }
  showView('result'); focusHeading('result-title');
}
function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
$('download-report').addEventListener('click', () => {
  if (!currentResult) return;
  const format = $('download-format').value;
  const extension = { html: 'html', text: 'txt', markdown: 'md', json: 'json' }[format];
  const mime = { html: 'text/html', text: 'text/plain', markdown: 'text/markdown', json: 'application/json' }[format];
  let content = currentResult[format];
  if (format === 'html') content = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(currentResult.title)}</title><style>body{max-width:900px;margin:40px auto;padding:0 24px;color:#303b38;background:#fffefa;font:16px/1.8 Georgia,serif}h1,h2,h3{line-height:1.3}table{border-collapse:collapse;font:12px Arial,sans-serif;max-width:100%;display:block;overflow:auto}th,td{padding:9px;border-bottom:1px solid #ddd}svg{max-width:100%;height:auto}</style></head><body>${currentResult.svgs?.chart ?? ''}${content}</body></html>`;
  download(content, `celestial-${currentResult.kind}.${extension}`, mime + ';charset=utf-8');
});
$('download-svg').addEventListener('click', () => {
  const kind = $('chart-kind').value;
  if (currentResult?.svgs?.[kind]) download(currentResult.svgs[kind], `celestial-natal-${kind}.svg`, 'image/svg+xml;charset=utf-8');
});
$('chart-kind').addEventListener('change', renderChart);
$('edit-input').addEventListener('click', () => { showView('form'); focusHeading('form-title'); });
$('retry-boot').addEventListener('click', boot);
$('cancel-calculation').addEventListener('click', () => cancelCalculation());
window.addEventListener('hashchange', route);
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault(); $('main').focus();
});
document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach(link => {
  link.addEventListener('click', () => { if (link.hash === location.hash) route(); });
});
window.addEventListener('pagehide', () => { searchController?.abort(); worker?.terminate(); });
window.addEventListener('pageshow', event => { if (event.persisted) boot(); });
try {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (![...$('period-zone').options].some(option => option.value === localZone)) {
    $('period-zone').add(new Option(`Seu fuso · ${localZone}`, localZone));
  }
  $('period-zone').value = localZone;
} catch { $('period-zone').value = 'UTC'; }
route();
boot();
