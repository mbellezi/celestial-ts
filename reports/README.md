# Relatórios coletivos e natais

`celestial-wasm/reports` fornece relatórios em JSON, texto puro, HTML simples e Markdown em português. Os relatórios coletivos cobrem intervalos entre 2026 e 2035; os [relatórios natais](#interpretação-psicológica-do-mapa-natal) aceitam nascimentos de 1930 a 2040. Ambos adotam uma lente psicológica e referência ocidental, tropical e geocêntrica.

## Relatórios coletivos

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

## Leitura astro em prosa

`generator.reportAstro(input, options?)` retorna um `AstroReport` com título temático, panorama e passagens em ordem cronológica. `generator.reportAstroText(input, options?)` apresenta essa leitura em texto, com a seção “O MOMENTO ATUAL”, transições datadas e reflexões práticas. No dia, a leitura é mais breve; no mês e em outros períodos, há espaço para desenvolver a sequência dos acontecimentos.

```ts
const october = {
  start: '2026-10-01',
  end: '2026-10-31',
  timeZone: 'America/Sao_Paulo',
};
const astro = generator.reportAstro(october);
const astroText = generator.reportAstroText(october);
const shorter = generator.reportAstro(october, { maxEvents: 8 });

// Também é possível reaproveitar um relatório completo já calculado.
import { astroReport, renderAstroReportText } from 'celestial-wasm/reports';
const fromFull = astroReport(generator.report(october));
const fromObject = renderAstroReportText(fromFull);
```

`maxEvents` aceita inteiros de 1 a 32. O padrão seleciona até quatro eventos para um único dia local e dezoito para um mês ou outro período. A seleção é deliberada: `selection` informa o total de eventos, quantos foram selecionados e quantos foram omitidos. As versões completa e compacta mantêm seus próprios formatos e critérios.

A prosa é determinística e usa um corpus editorial local versionado, sem LLM, API ou acesso à rede durante a geração. O conteúdo parte dos eventos calculados: não acrescenta Quíron, configurações de aspectos ou acontecimentos ausentes dos dados. Cada passagem preserva `eventIds`, `interpretationKeys`, `sourceKeys` e `exact`, permitindo conferir sua origem no relatório completo. `editorialVersion` identifica a versão do corpus. Os horários e as datas seguem o fuso solicitado; condições que já estavam em curso são descritas como continuidade, sem simular um novo ingresso, e os instantes exatos pertencem ao intervalo consultado.

Os caches `astro` e `astroRendered` reutilizam os cálculos e respeitam `cacheSize` e o orçamento estimado de 8 MiB por cache. Objetos retornados são cópias independentes, opções equivalentes compartilham a chave canônica e `clearCache()` também limpa esses resultados.

Após compilar o núcleo WASM, execute:

```sh
npm run build:reports
node reports/examples/generate-astro.ts
```

O script usa `America/Sao_Paulo` e salva quatro arquivos em `reports/examples/`: `october-2026-astro.json`, `october-2026-astro.txt`, `2026-10-16-astro.json` e `2026-10-16-astro.txt`. Também imprime contagem de palavras, seleção editorial, tempo da primeira consulta, tempo da recuperação em cache e estatísticas dos caches.


## HTML e Markdown

As três leituras oferecem HTML básico e Markdown. Os métodos do gerador usam
as mesmas opções das respectivas saídas em texto:

| Leitura | HTML | Markdown | Opções |
| --- | --- | --- | --- |
| Completa | `generator.reportHTML(input, options?)` | `generator.reportMarkdown(input, options?)` | `ReportTextOptions`, com seleção de áreas em `domains` |
| Compacta | `generator.reportCompactHTML(input, options?)` | `generator.reportCompactMarkdown(input, options?)` | `CompactReportOptions`, com `maxHighlights` e `domains` |
| Astro | `generator.reportAstroHTML(input, options?)` | `generator.reportAstroMarkdown(input, options?)` | `AstroReportOptions`, com `maxEvents` |

Para formatar um objeto existente, use os renderizadores independentes. Eles
não inicializam o WASM, consultam serviços externos nem repetem cálculos
astronômicos:

```ts
import {
  renderReportHTML,
  renderReportMarkdown,
  renderCompactReportHTML,
  renderCompactReportMarkdown,
  renderAstroReportHTML,
  renderAstroReportMarkdown,
} from 'celestial-wasm/reports';

const fullHTML = renderReportHTML(january, { domains: ['general', 'family'] });
const fullMarkdown = renderReportMarkdown(january, { domains: 'all' });
const compact = generator.reportCompact(input, { maxHighlights: 4 });
const compactHTML = renderCompactReportHTML(compact);
const compactMarkdown = renderCompactReportMarkdown(compact);
const astro = generator.reportAstro(input, { maxEvents: 8 });
const astroHTML = renderAstroReportHTML(astro);
const astroMarkdown = renderAstroReportMarkdown(astro);
```

O HTML é um fragmento `<article lang="pt-BR">` com títulos hierárquicos, seções
e parágrafos. Não inclui `doctype`, documento completo, CSS ou scripts; a
aplicação hospedeira define a apresentação. A leitura completa organiza a
cronologia com títulos de evento e subtítulos por área selecionada. A compacta
inclui “Panorama”, “Destaques”, “Áreas da vida”, quando houver áreas, e “Sobre esta
leitura”. A astro usa seu título temático e as seções “Panorama”, “O MOMENTO
ATUAL” e “Sobre esta leitura”. As datas e o conteúdo seguem os respectivos
objetos e renderizadores de texto.

Os campos de conteúdo são tratados como texto literal: o HTML escapa caracteres
reservados, e o Markdown escapa caracteres de marcação e HTML literal. Uma tag
presente no texto de uma interpretação aparece como texto, sem ser inserida como
HTML ativo. O Markdown usa títulos e parágrafos comuns, sem depender de extensões.

As saídas do gerador compartilham os caches `rendered`, `compactRendered` e
`astroRendered` com o texto, usando chaves distintas por formato e opções.
Cada cache mantém o limite `cacheSize` e o orçamento estimado de 8 MiB;
`clearCache()` limpa também essas saídas. Reutilizar um objeto com os
renderizadores independentes permite gerar outros formatos sem consultar o
gerador novamente.

Após `npm run build:reports`, execute:

```sh
node reports/examples/generate-markup.ts
```

O script lê os JSON já salvos em `reports/examples/`, sem inicializar o núcleo
WASM, e gera estes pares de arquivos:

| Leitura | HTML | Markdown |
| --- | --- | --- |
| Completa de fevereiro de 2026 | [february-2026.html](examples/february-2026.html) | [february-2026.md](examples/february-2026.md) |
| Compacta de fevereiro de 2026 | [february-2026-compact.html](examples/february-2026-compact.html) | [february-2026-compact.md](examples/february-2026-compact.md) |
| Astro de outubro de 2026 | [october-2026-astro.html](examples/october-2026-astro.html) | [october-2026-astro.md](examples/october-2026-astro.md) |

## Interpretação psicológica do mapa natal

`createNatalReportGenerator(core)` calcula o mapa com o mesmo núcleo auditado e
monta as interpretações a partir de um catálogo local. A organização segue o
relatório PDF fornecido como referência: ascendente e regências, meio do céu,
planetas em signos e casas, retrogradações, nodos e aspectos, com leituras da
vida pessoal e profissional. Os textos são originais, redigidos por **Astra**
com o skill **humanizar-pt-br**. O conteúdo adota uma lente psicológica, conforme
as regras editoriais do projeto.

```ts
import init, * as core from 'celestial-wasm';
import {
  createNatalReportGenerator,
  renderNatalReportJSON,
  renderNatalReportText,
  renderNatalReportMarkdown,
  renderNatalReportHTML,
} from 'celestial-wasm/reports';

await init();
const natal = createNatalReportGenerator(core, { cacheSize: 128 });
const input = {
  name: 'Pessoa Exemplo',
  date: '1972-05-28',
  time: '01:00:00',
  timeZone: 'America/Sao_Paulo',
  location: {
    label: 'Ribeirão Preto, SP, Brasil',
    latitude: -(21 + 10 / 60),
    longitude: -(47 + 48 / 60),
  },
};

// Uma única base calculada e interpretada, quatro apresentações.
const report = natal.report(input);
const json = renderNatalReportJSON(report, 2);
const text = renderNatalReportText(report);
const markdown = renderNatalReportMarkdown(report);
const html = renderNatalReportHTML(report);
```

As quatro saídas usam o mesmo `NatalReport`. Os renderizadores não calculam
novamente o céu nem reescrevem os parágrafos. Texto puro, Markdown e HTML
percorrem uma estrutura de apresentação comum, na mesma ordem, com os mesmos
títulos, dados e interpretações. O JSON preserva também números com precisão
completa e referências de auditoria. O HTML é um fragmento `<article lang="pt-BR">`
com títulos, parágrafos e tabelas, sem CSS, scripts ou recursos externos. HTML e
Markdown escapam conteúdo literal, inclusive nome e local informados pelo usuário.

| Saída direta do gerador | A partir do objeto existente |
| --- | --- |
| `natal.reportJSON(input, options?, space?)` | `renderNatalReportJSON(report, space?)` |
| `natal.reportText(input, options?, renderOptions?)` | `renderNatalReportText(report, renderOptions?)` |
| `natal.reportMarkdown(input, options?, renderOptions?)` | `renderNatalReportMarkdown(report, renderOptions?)` |
| `natal.reportHTML(input, options?, renderOptions?)` | `renderNatalReportHTML(report, renderOptions?)` |

Por padrão, ambas as perspectivas aparecem. `renderOptions.perspectives` aceita
`['personal']`, `['professional']`, ambas ou `[]`, preservando a base do relatório.
Para interpretar um mapa previamente calculado, use
`interpretNatalChart(chart, { name?, includeMinorAspects?, orbs? })`. São
necessários os dez corpos principais, casas e localização válidos; valores
derivados inconsistentes são rejeitados. O nodo verdadeiro é opcional nessa
entrada, com a ausência registrada em `coverage.nodesIncluded`. Quíron pode
constar dos dados, mas não recebe interpretação neste catálogo e aparece em
`coverage.unsupportedBodies`.

### Datas e convenções de cálculo

O intervalo aceito, depois da conversão do fuso, é
`1930-01-01T00:00:00Z <= instant < 2041-01-01T00:00:00Z`. A entrada pode conter
data, hora e fuso IANA ou um `instant` ISO com `Z` ou deslocamento explícito.
Horas locais inexistentes ou duplicadas na mudança de horário de verão são
rejeitadas; um instante com deslocamento explícito resolve a ambiguidade.

O gerador calcula os dez planetas de Sol a Plutão e o nodo verdadeiro, com ΔT
automático. Usa Placidus por padrão; `houseSystem: 'E'` seleciona casas iguais e
`'W'`, signos inteiros. Placidus em regiões onde o método é indefinido produz
erro. As casas dos planetas seguem intervalos de longitude entre cúspides, sem
antecipar um planeta para a casa seguinte. O nodo Sul é derivado da longitude
oposta ao Norte; sua casa é determinada pelas cúspides efetivas.

As posições do PDF não são copiadas para a saída. No exemplo de 1972, a posição
do nodo impressa na referência coincide com o nodo médio; este gerador usa o
nodo verdadeiro, identificado em `calculation.node`. Os orbes da referência
também não são inferidos de sua descrição “Weak Orbes”. Essas convenções podem
alterar os aspectos incluídos, embora a organização editorial seja semelhante.

Os nove aspectos e seus orbes padrão são:

| Ângulo | Aspecto | Orbe |
| ---: | --- | ---: |
| 0° | Conjunção | 8° |
| 30° | Semissextil | 2° |
| 45° | Semiquadratura | 2° |
| 60° | Sextil | 5° |
| 90° | Quadratura | 6° |
| 120° | Trígono | 6° |
| 135° | Sesquiquadratura | 2° |
| 150° | Quincúncio | 3° |
| 180° | Oposição | 8° |

`{ includeMinorAspects: false }` mantém somente 0°, 60°, 90°, 120° e 180°.
`{ orbs: { 0: 10, 90: 5 } }` substitui limites; são aceitos valores finitos de
0° a 12°. Zero exige igualdade angular exata. Se limites personalizados se
sobrepõem, é escolhido o aspecto com menor erro angular absoluto; no empate,
o menor ângulo. Cada par aparece uma vez na seção de aspectos, e as seções dos
corpos mantêm referências em `relatedAspectIds`. Não se usa o orbe para afirmar
intensidade psicológica. Aspectos de nodos com ângulos e ASC–MC não integram o
catálogo. Não há inferência de aspecto aplicativo ou separativo dos ângulos.

### Catálogo, dados e cache

O catálogo tem **380 entradas editoriais**, com dois campos de texto cada,
redigidos por Astra. Ele resolve **971 combinações teóricas**:

| Família | Entradas resolvidas |
| --- | ---: |
| Dez planetas em doze signos | 120 |
| Dez planetas em doze casas | 120 |
| Ascendente e meio do céu em signos | 24 |
| Eixo nodal em signos e casas | 24 |
| Retrogradação de Mercúrio a Plutão | 8 |
| 75 pares × nove aspectos | 675 |
| **Total** | **971** |

As 675 leituras de aspectos combinam 75 textos específicos de pares com nove
textos de relação angular. Portanto, as 971 combinações não são 971 ensaios
independentes, nem todas ocorrem astronomicamente. `sourceKeys` registra a
composição de cada leitura. O catálogo não cresce com a quantidade de datas:
o mapa calculado escolhe as entradas correspondentes. Não há chamada a LLM ou
rede durante a geração.

`getNatalCatalog()` retorna todas as combinações, `getNatalCatalogInfo()` expõe
contagens e autoria, e `resolveNatalInterpretation(key)` resolve uma chave
canônica. Os arquivos de origem são `data/natal-positions-pt-BR.json` e
`data/natal-patterns-pt-BR.json`. O relatório preserva `chart`, `calculation`,
`regents`, `aspects`, `readings`, `sections` e `interpretations`; as seções e
leituras apontam para fatos e fontes, sem reproduzir um aspecto nas duas
seções planetárias.

O cache por gerador tem limite de entradas e orçamento estimado de 8 MiB.
As chaves incluem versões, instante, fuso, nome, localização, sistema de casas e
opções normalizadas. Resultados retornados são cópias independentes.
`cacheStats` expõe uso e acertos; `clearCache()` limpa o cache. Reutilize o mesmo
gerador para os quatro formatos e limpe seu cache após mudanças externas de
configuração no núcleo. A formatação pode ser feita diretamente sobre um
objeto já recebido, sem inicializar o WASM.

Para reproduzir o exemplo com os dados de nascimento da referência:

```sh
npm run build:reports
node reports/examples/generate-natal.ts
```

O script calcula uma única vez e salva [JSON](examples/natal-1972.json),
[texto puro](examples/natal-1972.txt), [Markdown](examples/natal-1972.md) e
[HTML simples](examples/natal-1972.html). A precisão astronômica e suas
limitações permanecem documentadas na
[auditoria de 1930 a 2040](../docs/validation/precision-1930-2040.txt).
