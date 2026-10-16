# Celestial WASM

Baseada na biblioteca original [Celestial](https://github.com/geraldo-netto/celestial),
criada por [geraldo-netto](https://github.com/geraldo-netto). Agradecemos ao autor por
disponibilizar o motor de efemérides que fundamenta esta versão em WebAssembly e
sua camada de gráficos TypeScript.

Biblioteca de efemérides em Rust/WebAssembly com bindings TypeScript completos,
mapas astrológicos e tabelas em SVG, além de relatórios em português com saídas
estruturadas, em texto, HTML e Markdown. Funciona em Node.js e em workers de módulo do navegador.
O runtime não depende de DOM, canvas, N-API ou pacotes JavaScript externos.

Este diretório é a raiz independente da biblioteca: código, configurações,
scripts, lockfiles, testes, documentação e licença estão contidos nele. Pode ser
copiado para um repositório próprio sem arquivos do diretório pai.

- `celestial-wasm`: motor WASM, 300 funções públicas do core, três aliases e
  bindings dos 69 métodos/builders públicos.
- `celestial-wasm/charts`: cálculo de mapas natais e planetários geocêntricos,
  seis temas, paletas light/dark/personalizadas e componentes SVG independentes.
- `celestial-wasm/reports`: relatórios coletivos em pt-BR para 2026–2035, eventos temporais, catálogo estático composto e JSON com cache.
- `celestial-wasm/wasm`: arquivo binário para resolução explícita de URL ou bytes.
- `celestial-wasm/locations`: busca de cidades no Open-Meteo e conversão de
  nascimento local para UTC entre 1930 e 2040, com histórico IANA de horário de verão.

## Instalar a partir do código-fonte

Requisitos de desenvolvimento: **Node.js 24 ou posterior**, npm, Python 3, Rust
via rustup e o CLI wasm-bindgen. O arquivo `rust-toolchain.toml` seleciona Rust
**1.96.0** e o target `wasm32-unknown-unknown`; o CLI precisa corresponder à versão
**0.2.129** fixada no core WASM.

Execute todos os comandos dentro deste diretório, independentemente de onde ele
tenha sido copiado:

```sh
cd celestial
npm ci
cargo install wasm-bindgen-cli --version 0.2.129 --locked
npm run build
npm test
```

`npm ci` instala somente ferramentas de desenvolvimento, com versões fixadas em
`package-lock.json`. `npm run build` gera JavaScript, WebAssembly, declarações
TypeScript e os módulos de gráficos, relatórios e localização em `pkg/`. O core mantém seu
`Cargo.lock`.

## Instalar em uma aplicação

A distribuição ainda não foi publicada em um registro. Gere um pacote local:

```sh
# Dentro da biblioteca; prepack executa o build.
npm pack

# Dentro da aplicação consumidora, use o caminho real do arquivo gerado.
npm install /caminho/celestial/celestial-wasm-0.2.0.tgz
```

O consumidor recebe artefatos compilados e tipos; não precisa de Rust ou Python
para executá-los. O pacote inclui a licença e as fontes correspondentes. O
tarball leva o lock npm como `npm-shrinkwrap.json`, pois npm não inclui
`package-lock.json` em arquivos de distribuição. A publicação no registro não
faz parte desses comandos; `private: true` evita publicação acidental.

## Uso rápido no navegador ou em worker

```ts
import init, * as core from 'celestial-wasm';
import {
  createChartCalculator,
  renderChartSvg,
  renderWheelSvg,
  renderPositionsSvg,
} from 'celestial-wasm/charts';

await init();
const calculator = createChartCalculator(core);

const natal = calculator.natal({
  date: '2026-10-15',
  time: '21:04:57',
  timeZone: 'America/Sao_Paulo',
  location: { label: 'São Paulo', latitude: -23.55052, longitude: -46.633308 },
  houseSystem: 'P',
});

const complete = renderChartSvg(natal, { theme: 'botanical', colors: 'dark' });
const wheel = renderWheelSvg(natal, { theme: 'editorial' }); // light por padrão
const positions = renderPositionsSvg(natal, { theme: 'prism', colors: 'light' });

// Em um worker: envie as strings e os dados para a aplicação.
postMessage({ complete, wheel, positions, data: natal });
```

`init()` procura `celestial_wasm_bg.wasm` ao lado do JavaScript gerado. Configure
o empacotador para preservar/copiar esse arquivo ou passe a URL pública dos
bytes explicitamente: `await init({ module_or_path: wasmUrl })`. O export
`celestial-wasm/wasm` permite que o empacotador resolva o asset conforme sua própria
convenção. O servidor deve servir `.wasm` como `application/wasm`.

Inicialize uma vez por worker. O calculator usa uma instância dedicada do motor:
seleciona ΔT automático antes de cada cálculo, sem restaurar overrides anteriores.
As chamadas de cálculo e renderização são síncronas depois da inicialização.

Para obter apenas posições planetárias geocêntricas, sem casas nem localização:

```ts
const sky = calculator.planetary({
  instant: '2026-10-16T00:04:57Z',
  timeZone: 'America/Sao_Paulo',
});
const svg = renderChartSvg(sky, { theme: 'atlas' });
```

Um instante ISO exige `Z` ou offset explícito. Data/hora local exige fuso IANA.
Horas inexistentes ou ambíguas durante mudanças de horário são rejeitadas; um
instante com offset explícito permite escolher a ocorrência desejada. Coordenadas
não são usadas para descobrir automaticamente o fuso.

## Busca de cidade natal e conversão para UTC

O módulo `celestial-wasm/locations` funciona sem inicializar o WASM. A busca
retorna possibilidades para o usuário selecionar; a conversão usa uma base IANA
versionada e embutida, incluindo registros históricos anteriores a 1970.

```ts
import { createCitySearchClient, resolveBirthTime } from 'celestial-wasm/locations';

const cities = createCitySearchClient();
const candidates = await cities.search('São Pau', { countryCode: 'BR' });
// Exiba os rótulos e IDs. Exemplo após o usuário escolher São Paulo:
const city = await cities.get(3448439);
const birth = resolveBirthTime({ date: '1990-01-15', time: '10:30', location: city });
// birth.instant === '1990-01-15T12:30:00.000Z' (horário de verão nessa data)
// Com um calculator inicializado: calculator.natal(birth).
```

A faixa de datas locais é **1930-01-01 a 2040-12-31**. Horários repetidos exigem
escolha explícita entre `earlier` e `later`; horários inexistentes são rejeitados.
Datas futuras seguem as regras previstas na versão IANA incluída. O serviço
gratuito do Open-Meteo é destinado a uso não comercial; o cliente também aceita
endpoint e chave de uma assinatura comercial. Consulte o
[guia de cidades, UTC, erros e atualização dos fusos](locations/README.md).

## Uso em Node.js

```ts
import { readFile, writeFile } from 'node:fs/promises';
import init, * as core from 'celestial-wasm';
import { createChartCalculator, renderChartSvg } from 'celestial-wasm/charts';

await init({
  module_or_path: await readFile(new URL(import.meta.resolve('celestial-wasm/wasm'))),
});
const sky = createChartCalculator(core).planetary({ instant: '2026-10-16T00:04:57Z' });
await writeFile('mapa.svg', renderChartSvg(sky, { theme: 'minimal', colors: 'dark' }));
```

## Temas, cores e transparência

[<img src="docs/images/editorial-light-natal-chart.png" alt="Mapa natal no tema Editorial, paleta clara" width="220">](docs/themes.md)
[<img src="docs/images/midnight-dark-natal-chart.png" alt="Mapa natal no tema Observatório, paleta escura" width="220">](docs/themes.md)
[<img src="docs/images/prism-light-natal-chart.png" alt="Mapa natal no tema Prisma, paleta clara" width="220">](docs/themes.md)

Veja o [catálogo visual completo](docs/themes.md): os seis temas em light e dark,
com mapas natais, planetários e cada roda/tabela individual, gerados pela biblioteca.

Os mesmos parâmetros `theme` e `colors` funcionam no mapa completo, na roda, nas
tabelas e nos componentes individuais.

| Nome exibido | Valor de `theme` |
| --- | --- |
| Editorial | `editorial` |
| Observatório | `midnight` |
| Botânico | `botanical` |
| Prisma | `prism` |
| Atlas | `atlas` |
| Essencial | `minimal` |

`theme` tem padrão `editorial`. `colors` aceita `light` (padrão em **todos** os
temas), `dark` ou uma estrutura completa `ThemeColors`. O nome do tema seleciona
a composição; a estrutura de cores seleciona sua aparência.

```ts
import { getTheme, renderChartSvg, type ThemeColors } from 'celestial-wasm/charts';

const colors: ThemeColors = getTheme('botanical', 'dark').colors;
colors.accent = '#f0c879';
colors.foreground = '#f3f4ef';
colors.surface = 'transparent';
colors.elements = ['#eeb29a', '#aad6a0', '#e3cf89', '#92cbd8'];

const customized = renderChartSvg(natal, { theme: 'botanical', colors });
```

Todos os SVGs têm **fundo transparente**, inclusive as partes que antes usavam a
cor de fundo do tema. `ThemeColors.background` é apenas uma recomendação de cor
para o elemento HTML hospedeiro; nunca é pintada no SVG. Você pode trocar o fundo
da página sem regenerar o desenho. Escolha light para páginas claras e dark para
páginas escuras para manter a leitura.

Superfícies de tabelas, faixas e setores são partes do desenho e mantêm suas cores.
Para remover o preenchimento das superfícies, use `surface: 'transparent'`.
O contrato completo, cada campo da paleta e formatos de cor aceitos estão no
[guia de mapas, temas e estruturas](charts/README.md).

## SVG completo ou componentes independentes

| Função | Saída |
| --- | --- |
| `renderChartSvg` | Composição completa do tema |
| `renderWheelSvg` | Roda independente |
| `renderTablesSvg` | Conjunto das tabelas |
| `renderPositionsSvg` | Tabela de posições |
| `renderHousesSvg` | Tabela de casas; `undefined` no planetário |
| `renderAspectMatrixSvg` | Matriz de aspectos |
| `renderAspectsSvg` | Lista de aspectos com orbe e fase |
| `renderChartBundle` | Todos os SVGs acima em um objeto |

Os glifos astrológicos são caminhos vetoriais próprios. Textos usam fontes de
sistema. A API também expõe fragmentos `<g>` para montar uma composição própria,
com posição e largura configuráveis. Consulte os tipos e exemplos no guia de
charts. Rótulos podem se afastar para evitar colisões; os marcadores dos astros e
os extremos das linhas de aspectos continuam nas longitudes calculadas.

## Relatórios astrológicos

O módulo `celestial-wasm/reports` gera relatórios para um dia, um mês ou qualquer
intervalo entre **2026 e 2035**. Inclui presenças e ingressos em signos, aspectos,
retrogradações, estações, fases lunares e eclipses, com datas, durações e
interpretações em português. A leitura é coletiva, ocidental, tropical e
geocêntrica, com enfoque psicológico: traz um panorama geral e cinco áreas,
**saúde, relacionamentos, finanças, trabalho e família**.

| Método do gerador | Saída |
| --- | --- |
| `report(input)` | Objeto TypeScript com todos os eventos, durações e interpretações |
| `reportJSON(input)` | Relatório completo serializado em JSON |
| `reportText(input, options?)` | Parágrafos cronológicos completos; permite escolher as áreas |
| `reportHTML(input, options?)` | Relatório completo em fragmento HTML |
| `reportMarkdown(input, options?)` | Relatório completo em Markdown |
| `reportCompact(input, options?)` | Objeto com panorama, destaques e frases por área |
| `reportCompactText(input, options?)` | Versão compacta em parágrafos prontos para exibição |
| `reportCompactHTML(input, options?)` | Versão compacta em fragmento HTML |
| `reportCompactMarkdown(input, options?)` | Versão compacta em Markdown |
| `reportAstro(input, options?)` | Leitura editorial com título, panorama e passagens cronológicas rastreáveis |
| `reportAstroText(input, options?)` | Leitura astro em prosa, com datas e reflexões práticas |
| `reportAstroHTML(input, options?)` | Leitura astro em fragmento HTML |
| `reportAstroMarkdown(input, options?)` | Leitura astro em Markdown |

Exemplo no navegador ou em worker (para Node.js, use a
[inicialização com os bytes do WASM](#uso-em-nodejs)):

```ts
import init, * as core from 'celestial-wasm';
import { createReportGenerator } from 'celestial-wasm/reports';

await init();
const generator = createReportGenerator(core);
const period = {
  start: '2026-02-01',
  end: '2026-02-28',
  timeZone: 'America/Sao_Paulo',
};

const fullReport = generator.report(period);
const compactReport = generator.reportCompact(period);
const monthText = generator.reportCompactText(period);
const astroText = generator.reportAstroText(period);
const dayText = generator.reportCompactText({
  start: '2026-02-17',
  end: '2026-02-17',
  timeZone: 'America/Sao_Paulo',
});
```

Datas no formato `YYYY-MM-DD` incluem o dia inicial e o final; repetir a data
seleciona um único dia. A versão compacta traz, por padrão, até cinco destaques
para o mês e três para o dia, além das cinco áreas. O catálogo de interpretações
é estático e local. Reutilize o gerador para aproveitar os caches de cálculos,
relatórios, JSON e textos.

A leitura `astro` desenvolve os eventos selecionados em prosa, com título
temático, panorama e a seção “O MOMENTO ATUAL”. Usa um corpus editorial local e
versionado, sem chamadas a modelos de linguagem ou serviços externos. O padrão
seleciona até quatro eventos no dia e dezoito no mês ou período;
`{ maxEvents: 8 }` ajusta esse limite, entre 1 e 32. O JSON preserva as fontes de
cada passagem e informa quantos eventos ficaram fora da seleção.

HTML e Markdown estão disponíveis para as três leituras, com as mesmas opções
dos respectivos métodos de texto. O HTML contém um `<article lang="pt-BR">`
com títulos, seções e parágrafos, sem estilos ou scripts. Os renderizadores
`renderReportHTML`, `renderReportMarkdown`, `renderCompactReportHTML`,
`renderCompactReportMarkdown`, `renderAstroReportHTML` e `renderAstroReportMarkdown`
reaproveitam objetos já calculados. Conteúdo textual é escapado em ambos os
formatos, inclusive quando contém marcação fornecida pelo consumidor.

Consulte a **[documentação detalhada dos relatórios](reports/README.md)** para
formatos de entrada e saída, durações, fusos, opções, critérios de seleção e
limites da leitura. Há exemplos completos em [JSON](reports/examples/february-2026.json)
e [texto](reports/examples/february-2026.txt), além das versões compactas de
[mês](reports/examples/february-2026-compact.txt) e [dia](reports/examples/2026-02-17-compact.txt).
O comando `npm run build:reports && node reports/examples/generate-astro.ts`
gera as leituras astro de outubro de 2026 e de 16 de outubro em JSON e texto,
no diretório `reports/examples/`.
O comando `node reports/examples/generate-markup.ts` converte os exemplos JSON
existentes para [HTML completo](reports/examples/february-2026.html) e
[Markdown completo](reports/examples/february-2026.md), além das leituras compacta
e astro, sem repetir o cálculo astronômico.

## Interpretações do mapa natal

O módulo `celestial-wasm/reports` também oferece
`createNatalReportGenerator(core)` para mapas natais de **1930 a 2040**.
As interpretações usam lente psicológica, com textos de Astra revisados pelo
skill `humanizar-pt-br`. Um único objeto calculado fornece **JSON, texto puro,
Markdown e HTML simples**, mantendo o mesmo conteúdo entre apresentações.
O catálogo local possui 380 entradas editoriais e 971 combinações rastreáveis,
sem chamadas a modelos ou à rede durante a geração. Consulte a
[API natal, as convenções e os exemplos](reports/README.md#interpretação-psicológica-do-mapa-natal).

## Aplicação de exemplo

A aplicação em [`examples/app/`](examples/app/README.md) reúne a leitura Astro
do dia, a leitura Astro do mês e o mapa natal completo em uma interface em
HTML, CSS e JavaScript, sem framework. A página inicial tem cards em tons
pastéis e ilustrações SVG; os formulários incluem seletores de data, busca de
cidade e confirmação explícita de horários repetidos na mudança do relógio.

```sh
npm run build
npm run example
# Abra http://127.0.0.1:4173/
```

O shell aparece imediatamente. Um loader acompanha o carregamento do WASM,
e um worker executa os cálculos para manter a interface responsiva. Os
relatórios podem ser baixados em JSON, texto puro, Markdown e HTML; os gráficos
natais também podem ser baixados individualmente em SVG. As leituras coletivas
cobrem 2026–2035 e o natal cobre 1930–2040. A conversão histórica usa a base
IANA da biblioteca; apenas a busca de cidades exige um serviço externo.

`npm run example:build` exporta os assets locais e as fontes correspondentes
para `dist/example-app/`, prontos para um servidor HTTP estático. Veja as
[instruções, requisitos e testes do exemplo](examples/app/README.md).

## Documentação e comandos

- [Guia de mapas, funções, temas, paletas, dados e erros](charts/README.md).
- [Guia de relatórios coletivos, intervalos, catálogo e cache](reports/README.md).
- [Referência completa gerada das APIs TypeScript](docs/api-reference.md).
- [Relatório técnico das correções e orientação para backport no upstream](docs/backport-correcoes-celestial.md).
- [Cidades, coordenadas e horário de nascimento em UTC](locations/README.md).
- [Contratos do binding WASM](wasm/README.md).
- [Arquitetura](docs/architecture.md), [portabilidade e baseline dos testes](docs/portability.md).
- [Origem e avisos da distribuição](NOTICE), [licença](LICENSE), [limites herdados](TODO.md).
- [Galeria de SVGs reais](charts/examples/gallery/index.html), regenerável após copiar a biblioteca.

| Comando | Ação |
| --- | --- |
| `npm run build` | Compila Rust/WASM, bindings, charts, reports e locations |
| `npm run build:charts` | Recompila somente TypeScript, após existir o build WASM |
| `npm test` | Core WASM, bindings, gráficos, relatórios, cidades/UTC, aplicação, referência API e avisos de licença |
| `npm run test:core` | Testes unitários, integração e Rustdoc em WASM |
| `npm run test:bindings` | Build e testes TypeScript sobre o WASM real |
| `npm run build:reports` | Compila somente relatórios TypeScript, após existir o build WASM |
| `npm run test:reports` | Build, validação temporal, catálogo, eventos e caches de relatórios |
| `npm run test:charts` | Build, tipos, testes SVG/worker e mutações dirigidas |
| `npm run build:locations` | Compila a API de cidades e UTC, sem exigir WASM |
| `npm run test:locations` | Verifica busca de cidades, seleção e conversão histórica para UTC |
| `npm run timezones:check` | Reproduz e verifica offline os dados IANA embutidos |
| `npm run example` | Abre o servidor local da aplicação em 127.0.0.1:4173 |
| `npm run example:build` | Exporta a aplicação estática autocontida para dist/example-app |
| `npm run test:example` | Verifica servidor, exportação e integração real da aplicação |
| `npm run gallery` | Gera SVGs, galeria interativa e catálogo visual de todos os componentes |
| `npm run docs` | Regenera a referência a partir das declarações compiladas |
| `npm run docs:check` | Detecta referência API desatualizada |
| `npm run licenses` | Regenera avisos das dependências Rust usadas no build WASM |
| `npm run licenses:check` | Detecta avisos de dependências desatualizados |
| `npm pack` | Gera tarball instalável, compilando antes |

A galeria usa o instante fixo `2026-10-16T00:04:57Z`, correspondente a
15/10/2026 às 21:04:57 em São Paulo, para facilitar comparações reproduzíveis.
Seus SVGs permanecem transparentes; somente as prévias PNG recebem uma cor de
página. `sharp` é usado apenas no desenvolvimento para inspecionar os SVGs.

## Licença e origem

Esta distribuição mantém **AGPL-3.0-or-later**, conforme os manifests do projeto
original [Celestial](https://github.com/geraldo-netto/celestial), de `geraldo-netto`,
na revisão `0e2bb383bc7b1b20112bd9ef6b01e7548bf09eb2`. A mesma licença cobre as
adaptações WASM e a camada TypeScript desta distribuição. O texto GNU AGPL v3 está
preservado integralmente em [LICENSE](LICENSE); [NOTICE](NOTICE) registra origem,
autoria, revisão e alterações. O [README original](UPSTREAM-README.md) também
foi preservado. As dependências mantêm suas próprias licenças, com textos e avisos
em [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).

O motor combina séries VSOP87D com dados Swiss versionados e embutidos para
Lua, Mercúrio, Netuno, Plutão, Quíron, nodo verdadeiro e ΔT no intervalo natal
de 1930 a 2040. O runtime Rust/WASM não exige Swiss instalada. Fora das tabelas,
usa aproximações analíticas cuja precisão não é coberta pela auditoria.
A [auditoria de precisão](docs/validation/precision-1930-2040.txt) registra a
amostragem, os resíduos e as diferenças de convenção. Nos corpos tabulados,
a comparação mede fidelidade à Swiss, não valida uma teoria física independente.
