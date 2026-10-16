# Relatórios coletivos

`celestial-wasm/reports` fornece JSON em português para intervalos entre 2026 e 2035. A referência é ocidental, tropical e geocêntrica; a leitura é coletiva e psicológica, sem mapa natal ou previsão individual.

```ts
import init, * as core from 'celestial-wasm';
import { createReportGenerator } from 'celestial-wasm/reports';
await init();
const generator = createReportGenerator(core, { cacheSize: 128 });
const input = { start: '2026-01-01', end: '2026-01-31', timeZone: 'America/Sao_Paulo' };
const january = generator.report(input);
console.log(JSON.stringify(january));
// For repeated JSON delivery, reuse the cached serialized result:
const json = generator.reportJSON(input);
const sameJson = generator.reportJSON(input); // cached serialized result
```

Datas `YYYY-MM-DD` incluem todos os dias informados, da meia-noite local inicial até a meia-noite posterior ao último dia. Instantes com `Z` ou deslocamento explícito usam término exclusivo. Não misture as formas. O fuso padrão é UTC. `calculation` registra os corpos e orbes efetivamente usados para reproduzir o cálculo. Datas inválidas, horários locais ambíguos ou inexistentes, períodos vazios e datas fora de 2026–2035 são rejeitados.

Os dez corpos padrão são Sol, Lua, Mercúrio, Vênus, Marte, Júpiter, Saturno, Urano, Netuno e Plutão. `bodies` seleciona um subconjunto sem duplicatas. Os cinco aspectos maiores usam orbes padrão de 6° para conjunção, quadratura, trígono e oposição, e 4° para sextil. `orbs: { 90: 4 }` substitui um valor; cada valor deve ficar entre 0,001° e 10°. O motor calcula ocorrências astronômicas e intervalos dentro desses orbes. O refinamento numérico dos cruzamentos não representa a precisão física da efeméride; o limite mínimo de orbe mantém as janelas acima da resolução temporal do detector. Fases lunares e eclipses são eventos coletivos incluídos independentemente do subconjunto de corpos.

Cada entrada contém o evento, os instantes exatos encontrados, `interpretationKey`, `durationWithinRangeDays` e `fullDurationDays` (nulo quando os limites completos são desconhecidos). `interpretations` armazena uma única interpretação por chave, compartilhada pelas ocorrências; as contribuições das sínteses referenciam essa chave e os eventos. `boundary.startClipped` e `boundary.endClipped` indicam limites censurados pela consulta: a duração sobreposta não equivale à duração total do fenômeno. Eventos pontuais têm início e fim iguais e duração zero. Eventos `retrograde` são segmentos de retrogradação em um signo: seu `fullDurationDays`, quando conhecido, mede esse segmento, não o ciclo retrógrado inteiro. Não se atribui uma duração interpretativa arbitrária a eclipses. As seis sínteses (`general`, `health`, `relationships`, `finance`, `work`, `family`) preservam todas as contribuições e seus identificadores de evento; a duração não funciona como medida de importância, intensidade ou probabilidade. Ocorrências com a mesma chave de catálogo são agrupadas nas contribuições, preservando todos os seus identificadores e somando a duração sobreposta. O texto de síntese usa até seis grupos e elimina parágrafos repetidos; a ordem editorial prioriza eclipse, estação, fase, aspecto, retrogradação e presença em signo, depois duração e chave canônica. Essa escolha de destaque não expressa evidência científica de influência.

Os componentes editoriais foram redigidos por Astra, com revisão de linguagem segundo a skill [humanizar-pt-br](../.codex/skills/humanizar-pt-br/SKILL.md), versionada neste repositório. O catálogo estático compõe 529 combinações resolvidas a partir de parágrafos completos escritos para corpos, pares, signos, aspectos e classes de evento. `sourceKeys` torna a composição verificável; as 529 combinações não são 529 ensaios independentes. São 225 aspectos teóricos, 120 presenças em signo, 16 estações, 96 retrogradações em signo, 48 fases em signo e 24 eclipses em signo. Nem toda chave teórica ocorre no céu geocêntrico. `getCatalog()` retorna cópias novas das combinações disponíveis.

As leituras sobre saúde e finanças propõem reflexão; não diagnosticam doenças nem orientam investimentos. O catálogo inclui seu enquadramento e limites em `disclaimer` e `methodology`.

Cada gerador possui caches LRU limitados de relatórios, eventos e amostras astronômicas. Relatórios, eventos, amostras e JSON possuem também orçamento estimado de 8 MiB por cache; resultados maiores são entregues sem serem armazenados. A estimativa usa dois bytes por caractere de JSON, não uma medição exata do heap. As chaves incluem versões, intervalo completo, corpos canônicos e orbes; relatórios incluem também o fuso. Resultados são clonados para impedir contaminação por mutações do consumidor. `cacheStats` expõe tamanho, limite, acertos e faltas; `clearCache()` limpa tudo. `reportJSON(input, space?)` também armazena a serialização, evitando nova montagem, clonagem e serialização em chamadas repetidas. Reutilize o gerador. Alterações externas na configuração do mesmo núcleo exigem limpar seus caches. A primeira consulta calcula os eventos; repetições idênticas recuperam o relatório armazenado. Não há promessa de latência constante para consultas inéditas de dez anos.

Execute `npm run build:reports` após compilar o núcleo WASM; `npm run test:reports` compila o módulo e executa seus testes. O build principal e o empacotamento incluem o submódulo. `node reports/examples/generate.ts` gera o exemplo completo de fevereiro de 2026 e mede a primeira chamada e a recuperação do JSON em cache.


Os 45 eclipses do período (22 solares e 23 lunares) usam um catálogo estático de contatos globais do [EclipseWise](https://www.eclipsewise.com/), com classificação e referência cruzada aos catálogos da [NASA](https://eclipse.gsfc.nasa.gov/eclipse.html). A duração global usa P1–P4; `centralDurationSeconds`, fornecido pela NASA, permanece separado e não é usado como duração global. Visibilidade e duração locais para um observador não são calculadas. Os horários previstos em UT1 são serializados no formato ISO para interoperabilidade e identificados em `details.timeScale`; esse formato não implica precisão garantida em UTC. Os contatos descrevem o fenômeno global, sem determinar visibilidade em um local.

As fontes e os dados extraídos estão em `reports/data/eclipses.json` e `reports/data/eclipsewise-source.json`. O extrator `node reports/scripts/extract-eclipse-catalog.mjs solar.html lunar.html` combina as duas páginas NASA salvas localmente com os fatos de contato transcritos em `reports/data/eclipsewise-source.json` e reproduz o catálogo enriquecido após validar os 45 eventos. O arquivo de fatos preserva as 45 URLs primárias; a classificação e os contatos mantêm sua origem identificada por campo.


`renderReportText(report, options?)` transforma o objeto já calculado em texto cronológico completo; `generator.reportText(input, options?)` combina cálculo, recuperação do relatório e cache do texto. O padrão inclui a leitura geral de todos os eventos. Use `{ domains: 'all' }` para as seis áreas, `{ domains: ['health', 'family'] }` para áreas específicas ou `{ domains: [] }` apenas para a cronologia. Não há truncamento silencioso: períodos extensos geram textos extensos. As datas usam o fuso do relatório, incluindo ano e horário. A prosa exibe minutos normalmente, segundos em consultas menores que um minuto e milissegundos em consultas menores que um segundo; o JSON preserva os instantes em formato ISO com milissegundos. Limites censurados são descritos como continuidade; presença já iniciada não é apresentada como um novo ingresso. Para eclipses, o intervalo global físico e o máximo permanecem distintos da janela consultada.

```ts
import { renderReportText } from 'celestial-wasm/reports';
const text = renderReportText(january, { domains: ['general', 'relationships'] });
const allAreas = generator.reportText(input, { domains: 'all' });
```

O exemplo em `reports/examples/generate.ts` também salva `february-2026.txt`, com todos os eventos e sua interpretação geral, usando os mesmos dados do exemplo JSON.

## Leitura compacta de um mês ou dia

`generator.reportCompact(input, options?)` entrega um JSON pequeno com panorama, destaques e frases por área. `generator.reportCompactText(input, options?)` entrega a mesma leitura em texto. As funções completas `report`, `reportJSON` e `reportText` continuam disponíveis. Também é possível chamar `compactReport(fullReport, options?)` e `renderCompactReportText(compact)` sem repetir o cálculo astronômico.

```ts
const month = generator.reportCompact({ start: '2026-02-01', end: '2026-02-28', timeZone: 'America/Sao_Paulo' });
const dayText = generator.reportCompactText({ start: '2026-02-17', end: '2026-02-17', timeZone: 'America/Sao_Paulo' });
const custom = generator.reportCompact(input, { maxHighlights: 4, domains: ['work', 'family'] });
```

O padrão oferece até três destaques para um único dia local e cinco para meses e outros períodos. Dias de 23 ou 25 horas são reconhecidos pelo calendário do fuso. `maxHighlights` aceita inteiros de 1 a 8. As cinco áreas práticas aparecem por padrão; `domains: 'all'` inclui todas as cinco áreas práticas (a leitura geral permanece no panorama), `domains: 'none'` ou `[]` remove as áreas e uma lista seleciona áreas específicas. O panorama breve permanece presente. As regras de datas inclusivas e instantes com término exclusivo são as mesmas do relatório completo.

A seleção editorial favorece eclipses, estações, ingressos não lunares e aspectos exatos. Em meses e períodos, ingressos dos planetas de Júpiter a Plutão e aspectos exatos entre esses planetas recebem preferência sobre aspectos de planetas rápidos; no dia, mudanças dentro da consulta recebem preferência sobre condições já em curso. Presenças longas não preenchem todos os destaques. Eventos repetidos compartilham um destaque, com identificadores e datas exatas preservados, sem inventar continuidade entre passagens. Fase e aspecto Sol–Lua associados a um eclipse são omitidos para evitar redundância. Essa prioridade organiza a leitura e não mede influência ou probabilidade.

`selection` registra eventos totais, selecionados e omitidos; a omissão é deliberada. `eventIds`, `interpretationKey` e o pequeno dicionário `interpretations` permitem conferir cada destaque no relatório completo. Os caches `compact` e `compactRendered` reutilizam o relatório calculado, respeitam `cacheSize` e o orçamento estimado de 8 MiB cada; `clearCache()` também os limpa. Opções equivalentes usam a mesma chave canônica e objetos retornados são cópias independentes.

Execute `npm run build:reports && node reports/examples/generate-compact.ts` para reproduzir os exemplos de [mês em JSON](examples/february-2026-compact.json), [mês em texto](examples/february-2026-compact.txt), [dia em JSON](examples/2026-02-17-compact.json) e [dia em texto](examples/2026-02-17-compact.txt). O script imprime contagens de palavras, seleção e tempos da primeira consulta e do cache.
