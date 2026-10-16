# Mapas astrológicos em TypeScript e SVG

O motor de cálculo é a biblioteca original [Celestial](https://github.com/geraldo-netto/celestial),
de [geraldo-netto](https://github.com/geraldo-netto). Agradecemos ao autor por
disponibilizar o trabalho que tornou esta camada de gráficos possível.

Veja o [catálogo visual de todos os temas e componentes](../docs/themes.md), com
prévias reais light/dark, mapas natais/planetários e links para os SVGs separados.

Biblioteca do pacote `celestial-wasm/charts`, construída sobre o
core Rust Celestial em WASM. Calcula mapas natais e posições planetárias
geocêntricas e produz SVGs de rodas, tabelas e composições completas. Os cálculos
astronômicos vêm da instância WASM injetada; o TypeScript organiza os dados,
resolve a entrada de data/hora e desenha os gráficos.

O pacote `celestial-wasm` é autônomo e ainda não foi publicado no registro npm.
A licença preservada é `AGPL-3.0-or-later`; veja o
[README do pacote](../README.md) e a [licença](../LICENSE).

## Build, testes e galeria

Para desenvolver a biblioteca, use Node.js 24, Rust/rustup, Python 3 e
`wasm-bindgen-cli` 0.2.129. O arquivo `rust-toolchain.toml` seleciona Rust 1.96.0
e o target `wasm32-unknown-unknown`. Na pasta que contém o `package.json`
de `celestial-wasm`, execute:

```sh
cargo install wasm-bindgen-cli --version 0.2.129 --locked
npm ci
npm run build
npm test
npm run test:charts
npm run gallery
```

`build` compila o core WASM e a camada TypeScript, emitindo os módulos e tipos em
`pkg/`. `test` executa as suítes do core, dos bindings e de charts. `test:charts`
recompila apenas a camada TypeScript, verifica os tipos em modo estrito e executa
os testes Node com o WASM real, incluindo mutações dirigidas do renderizador.
O WASM precisa ter sido compilado antes. Para recompilar somente charts:

```sh
npm run build:charts
```

`gallery` recalcula os dados, gera os SVGs dos dois modos de cor e a página em
[`examples/gallery/`](examples/gallery/index.html). O gerador usa `sharp`, já
declarado nas dependências de desenvolvimento, somente para as prévias PNG.
A API distribuída retorna SVGs
e não depende de `sharp`, filesystem, canvas ou DOM.

## Instalação do pacote local

Na pasta da biblioteca, `npm pack` executa o build pelo hook `prepack` e cria
`celestial-wasm-0.2.0.tgz`, com JavaScript, WASM, tipos e fontes. O build do tarball
usa os pré-requisitos acima. No projeto consumidor, instale esse arquivo:

```sh
npm install /caminho/para/celestial-wasm-0.2.0.tgz
```

O consumidor do artefato compilado não precisa compilar Rust. O pacote oferece
três entradas: `celestial-wasm` para o core, `celestial-wasm/charts` para esta API
e `celestial-wasm/wasm` para o arquivo binário `.wasm`. A última entrada é um
asset, não um módulo JavaScript; seu carregamento depende do runtime ou empacotador.

## Inicialização em um worker de módulo

Depois de instalar o tarball e disponibilizar o asset WASM:

```ts
import init, * as celestial from 'celestial-wasm';
import {
  createChartCalculator,
  renderChartBundle,
} from 'celestial-wasm/charts';

await init();
const calculator = createChartCalculator(celestial);

const data = calculator.natal({
  instant: '2026-10-16T00:04:57Z',
  timeZone: 'America/Sao_Paulo',
  location: {
    label: 'São Paulo',
    latitude: -23.55052,
    longitude: -46.633308,
  },
  houseSystem: 'P',
  locale: 'pt-BR',
});

const svgs = renderChartBundle(data, {
  theme: 'editorial',
  colors: 'light',
  locale: 'pt-BR',
  idPrefix: 'exemplo-sao-paulo',
});
postMessage({ data, svgs });
```

`init()` carrega `celestial_wasm_bg.wasm` ao lado do módulo JavaScript gerado.
Se o empacotador mover esse arquivo, informe sua URL pública explicitamente:
`await init({ module_or_path: wasmUrl })`. Inicialize uma vez antes de criar o
calculator. Em Node, a mesma opção aceita os bytes lidos do arquivo; veja o
[gerador de exemplos](examples/generate.ts).

No Node, o export do binário também pode ser resolvido sem depender da estrutura
interna do pacote:

```ts
import { readFile } from 'node:fs/promises';
import init from 'celestial-wasm';

const wasmUrl = new URL(import.meta.resolve('celestial-wasm/wasm'));
await init({ module_or_path: await readFile(wasmUrl) });
```

A instância injetada pertence ao calculator: cada cálculo que chega ao motor
chama `setDeltaTUserdef(NaN)` para selecionar ΔT automático. O valor anterior não
é restaurado. Use uma instância dedicada, por exemplo em um worker dedicado,
sem compartilhá-la com chamadas que dependam de um override persistente de ΔT.
As posições usam explicitamente `FLG_BUILTIN | FLG_SPEED`, sem flags siderais ou
topocêntricas. O calculator não cria workers nem define um protocolo de mensagens;
as chamadas de cálculo e renderização são síncronas após a inicialização.

## Entradas: instante ou hora local

`natal(input)` e `planetary(input)` aceitam uma das duas formas de `DateTimeInput`:

```ts
import type { DateTimeInput } from 'celestial-wasm/charts';

// Um instante absoluto; o fuso controla a apresentação. O padrão é UTC.
const absolute: DateTimeInput = {
  instant: '2026-10-16T00:04:57Z', timeZone: 'America/Sao_Paulo',
};

// Uma data e hora locais, sempre acompanhadas do fuso.
const local: DateTimeInput = {
  date: '2026-10-15', time: '21:04:57', timeZone: 'America/Sao_Paulo',
};
```

As duas entradas representam **15 de outubro de 2026, 21:04:57 em São Paulo**.
Também é válido `instant: '2026-10-15T21:04:57-03:00'`. Não misture `instant`
com `date`/`time`. Um ISO sem `Z` ou deslocamento explícito é rejeitado.

Datas usam `AAAA-MM-DD`, calendário gregoriano e anos de `0001` a `9999`.
Horas usam `HH:mm` ou `HH:mm:ss`, com até três casas de fração de segundo.
Datas impossíveis, segundos intercalares e hora `24:00` não são aceitos.
O limite do formato de data não constitui uma garantia de precisão do motor
astronômico em todo esse intervalo.

Fusos são resolvidos por `Intl.DateTimeFormat` e pelos dados de fuso do runtime.
Informe um identificador IANA como `America/Sao_Paulo`; fusos desconhecidos são
rejeitados. Uma hora local inexistente durante mudança de horário gera
`nonexistentTime`; uma hora que ocorre duas vezes gera `ambiguousTime`.
Para escolher uma ocorrência da hora repetida, forneça `instant` com o deslocamento
UTC explícito. Não há escolha silenciosa da primeira ocorrência.

## Natal e planetário

O padrão inclui dez astros, nesta ordem: `sun`, `moon`, `mercury`, `venus`, `mars`,
`jupiter`, `saturn`, `uranus`, `neptune`, `pluto`. `bodies` substitui essa seleção;
aceita também `trueNode` e `chiron`, sem lista vazia ou duplicatas.

O natal exige `location` com latitude finita de −90 a 90 e longitude finita de
−180 a 180. Sul e oeste têm sinal negativo. `label` é opcional e descritivo;
não há geocodificação nem descoberta automática do fuso a partir das coordenadas.

| `houseSystem` | Sistema natal |
| --- | --- |
| `P` | Placidus, padrão |
| `W` | Signos inteiros |
| `E` | Casas iguais |

O planetário representa as posições zodiacais **tropicais e geocêntricas** do
instante, sem casas, ascendente ou meio do céu:

```ts
const sky = calculator.planetary({
  date: '2026-10-15',
  time: '21:04:57',
  timeZone: 'America/Sao_Paulo',
  bodies: ['sun', 'moon', 'mercury', 'venus', 'mars'],
});
```

Uma `location` opcional no planetário serve como contexto de apresentação;
não muda as posições geocêntricas. `houseSystem` não acrescenta casas ao planetário.
Os aspectos são conjunção, sextil, quadratura, trígono e oposição, com os orbes
automáticos do core. A API de charts não expõe configuração de orbes, zodíaco
sideral, posições heliocêntricas, sinastria ou rodas sobrepostas.

## Dados retornados

Ambos os métodos retornam `ChartData`, sem arredondar os números de cálculo:

| Campo | Conteúdo |
| --- | --- |
| `kind` | `natal` ou `planetary` |
| `instant` | ISO UTC normalizado, com milissegundos |
| `displayDateTime`, `timeZone` | Apresentação local e fuso resolvido |
| `julianDay` | Dia juliano UT usado pelo motor |
| `location` | Coordenadas e rótulo, quando informados |
| `bodies` | Lista de `BodyPosition`, na ordem selecionada |
| `houses` | Apenas no natal: `cusps`, `ascendant`, `midheaven`, `system` |
| `aspects` | Pares de IDs em `body1`/`body2`, `angle`, `orb` e `applying` |
| `elements` | Contagem simples dos astros por `fire`, `earth`, `air`, `water` |

Cada `BodyPosition` contém `id`, `key`, `longitude`, `latitude`, `distance`,
`speedLongitude`, `retrograde`, `sign`, `degreeInSign` e, no natal, `house`.
Longitudes ficam em `[0, 360)`, signos vão de `0` (Áries) a `11` (Peixes) e casas
de `1` a `12`. Distância é expressa em UA e velocidade longitudinal em graus/dia.
`retrograde` indica velocidade longitudinal negativa. `houses.cusps` preserva os
13 índices do core: o índice `0` não representa uma casa; use `1` a `12`.
`orb` é o afastamento do aspecto exato, em graus; `applying` indica aspecto
aplicativo. Elementos contam igualmente cada astro selecionado, sem pesos.

No exemplo completo de São Paulo acima, o WASM retorna dia juliano
`2461329.5034375`, dez astros e nove aspectos principais. Os valores usados nos
desenhos ficam registrados em [`examples/gallery/data.json`](examples/gallery/data.json).

## Temas, modos e paleta personalizada

`theme` escolhe a composição e `colors` escolhe as cores, independentemente:

```ts
import { getTheme, renderChartSvg } from 'celestial-wasm/charts';

const lightSvg = renderChartSvg(data, { theme: 'midnight' });
const darkSvg = renderChartSvg(data, { theme: 'midnight', colors: 'dark' });
const darkTheme = getTheme('midnight', 'dark');
// darkTheme.colors.background recomenda a cor do fundo HTML externo.
```

`ThemeId` aceita `editorial`, `midnight`, `botanical`, `prism`, `atlas` e `minimal`.
`ColorMode` aceita `light` ou `dark`. **Todos os temas usam `light` por padrão,
inclusive `midnight`**; o tema padrão é `editorial`.

`ThemeColorSelection` é um modo ou uma paleta completa `ThemeColors`. Exemplo
personalizado, reutilizável em qualquer composição:

```ts
import {
  renderChartBundle,
  type ThemeColors,
} from 'celestial-wasm/charts';

const palette: ThemeColors = {
  background: '#f7f4ea',
  foreground: '#26333a',
  muted: '#59656a',
  line: '#cad0cd',
  surface: 'transparent',
  accent: '#245e80',
  secondary: '#805338',
  elements: ['#a95640', '#607343', '#907321', '#357390'],
  aspects: {
    0: '#7853a5',
    60: '#337c82',
    90: '#b15348',
    120: '#466f9b',
    180: '#a44b45',
  },
};

const customSvgs = renderChartBundle(data, {
  theme: 'botanical',
  colors: palette,
});
```

Os nove campos da paleta são obrigatórios; `elements` tem exatamente quatro cores,
na ordem fogo, terra, ar e água, e `aspects` tem os cinco ângulos mostrados.
Não há mesclagem de paleta parcial nem aceitação de campos adicionais. Para
alterar poucas cores, comece com `getTheme('editorial', 'light').colors` e copie
os valores desejados.

São aceitos literais hex de 3, 4, 6 ou 8 dígitos, `rgb()`/`rgba()` e
`hsl()`/`hsla()` numéricos, além de `transparent`. RGB aceita canais de 0 a 255 ou
de 0% a 100%; HSL usa matiz numérico ou `deg` e saturação/luminosidade em
percentual. Alfa aceita 0 a 1 ou 0% a 100%. Há suporte às formas com vírgulas,
como `rgba(12, 34, 56, .5)`, e com espaços/barra, como
`hsl(210deg 45% 60% / 80%)`. Valores fora das faixas são rejeitados.
Nomes de cores como `red`, `currentColor`, `var()`, `url()`, `calc()` e palavras
globais de CSS não são aceitos. Isso mantém a paleta independente de estilos
herdados e evita referências externas ou trechos de CSS. O contraste da paleta
personalizada é responsabilidade de quem a define.

`THEMES` é o catálogo imutável de `ThemeDefinition`: metadados e
`palettes: { light, dark }`. `getTheme(id?, colors?)` retorna um `ChartTheme`
resolvido, com `colors: ThemeColors` e `mode: 'light' | 'dark' | 'custom'`, além
dos metadados `id`, `layout`, `label`, `description`, `font`, `headingFont` e `ring`.
Não procure cores diretamente no catálogo ou no objeto de tema:
use `definition.palettes.light.foreground` ou `theme.colors.foreground`.

`resolveTheme(theme?, colors?)` aceita um ID ou um `ChartTheme` já resolvido.
Sem seleção explícita, preserva as cores e o modo do objeto recebido; com
`colors`, aplica a nova seleção ao seu ID. Os retornos clonam cores, arrays e
metadados localizados: alterar um resultado não muda o catálogo nem chamadas
seguintes. As funções de renderização completas recebem o ID em `theme`; os
fragmentos de tabela aceitam também um tema resolvido.

### Transparência

O fundo externo do **SVG é sempre transparente**, tanto em `light` quanto em
`dark` ou paleta personalizada. O centro da roda também não recebe preenchimento.
`colors.background` é apenas uma recomendação para o fundo da página HTML ou do
contêiner que exibe o desenho; nunca é pintado como fundo pelo renderizador.
Ao escolher o modo escuro, aplique essa recomendação ao contêiner para preservar
a legibilidade das cores claras.

`colors.surface` continua sendo a tinta dos painéis e tabelas. Use
`surface: 'transparent'`, como no exemplo personalizado, para deixá-los sem
preenchimento também. Transparência do fundo não remove os traços, glifos,
setores coloridos ou demais elementos do desenho.

## SVGs completos e fragmentos

As funções de alto nível recebem `(data: ChartData, options?: RenderOptions)`.
As opções são `theme` (ID, padrão `editorial`), `colors` (modo ou paleta completa,
padrão `light`), `locale` (padrão `pt-BR`), `title` e `idPrefix`.
Escolha um `idPrefix` diferente para cada mapa ao inserir vários
SVGs no mesmo documento.

| Export | Retorno |
| --- | --- |
| `renderChartSvg` | SVG completo com composição do tema, roda e dados |
| `renderWheelSvg` | SVG completo da roda, com `viewBox` de 800 × 800 |
| `renderTablesSvg` | SVG completo com posições, casas quando houver, matriz e lista de aspectos |
| `renderPositionsSvg` | SVG completo da tabela de posições |
| `renderHousesSvg` | SVG completo das casas no natal; `undefined` no planetário |
| `renderAspectMatrixSvg` | SVG completo da matriz de aspectos |
| `renderAspectsSvg` | SVG completo da lista detalhada de aspectos |
| `renderChartBundle` | `ChartSvgBundle` com `chart`, `wheel`, `tables`, `positions`, `houses?`, `aspects` e `aspectList` |

No bundle, `aspects` preserva a **matriz de aspectos**, e `aspectList` é a
**lista detalhada**. Ambas também aparecem em `tables`. `houses` fica `undefined`
no planetário. Cada string do bundle é um documento SVG completo.
Por exemplo, `renderAspectsSvg(data, { theme: 'atlas', colors: 'dark' })` produz
somente a lista, sem exigir a composição completa. SVGs contêm formas vetoriais,
texto, título e descrição; os glifos são desenhos próprios em paths/círculos,
sem fonte astrológica. As legendas usam fontes de sistema. Os rótulos dos astros
podem ser afastados para evitar colisões; os marcadores e os extremos das linhas
de aspecto permanecem na longitude calculada. Graus exibidos nas tabelas são
formatados em graus, minutos e segundos, sem alterar os dados originais.

Para compor um SVG próprio, as quatro funções abaixo recebem
`(data: ChartData, options?: TableOptions)`, com opções padrão `{}`, e retornam
`{ svg: string, width: number, height: number }`. `svg` é um fragmento `<g>`, não
um documento SVG completo:

| Export | Fragmento |
| --- | --- |
| `renderPositionsTable` | Posições e indicação de retrogradação; coluna de casa apenas no natal |
| `renderHousesTable` | Doze cúspides; altura zero e grupo vazio sem casas |
| `renderAspectMatrix` | Matriz triangular com orbes e legenda |
| `renderAspectsTable` | Lista de pares, aspecto, orbe e estado aplicativo/separativo |

`TableOptions` aceita `theme?: ThemeId | ChartTheme`, `colors?: ThemeColorSelection`,
`locale`, `x`, `y` e `width` (padrão 360, mínimo 300). `x` e `y` deslocam o grupo.
O tema é resolvido por `resolveTheme`, com o mesmo padrão claro da API completa:

```ts
import { getTheme, renderPositionsTable } from 'celestial-wasm/charts';

const fragment = renderPositionsTable(data, {
  theme: getTheme('atlas', 'dark'),
  width: 430,
  x: 24,
  y: 24,
});
// fragment.svg é um <g>; inclua-o dentro do seu próprio documento <svg>.
```

Os demais exports públicos apoiam composições personalizadas:

| Export | Uso |
| --- | --- |
| `THEMES`, `getTheme(id?, colors?)`, `resolveTheme(theme?, colors?)` | Catálogo, seleção e resolução das cores do tema |
| `getMessages(locale?)` | Rótulos de astros, signos, aspectos, elementos e erros |
| `ChartError` | Erro do calculator com `code`, mensagem localizada e `cause` quando disponível |
| `renderGlyph(category, key, x, y, size, color)` | Fragmento vetorial centrado; categoria `body`, `sign` ou `aspect` |
| `normalizeAngle(angle)` | Normaliza ângulo finito em `[0, 360)` |
| `pointAt(longitude, rotation, cx, cy, radius)` | Converte posição angular para `{ x, y }` na convenção da roda |
| `layoutPlanetLabels(bodies, minGap?)` | Retorna `id`, `longitude` e `labelLongitude`; espaçamento padrão de 11° |

`renderGlyph` aceita IDs dos astros suportados, índices zodiacais `0..11` e ângulos
`0/60/90/120/180`; também aceita nomes em inglês como `sun`, `aries` e `trine`.
Tamanho e coordenadas precisam ser finitos, com tamanho positivo. Geometria
inválida, tema/glifo desconhecido ou dados inconsistentes de renderização podem
gerar `RangeError`. As declarações em `../pkg/charts/index.d.ts` são o contrato
TypeScript distribuído; exportam também os tipos de dados, temas e opções.

`ChartError.code` pode ser `invalidDate`, `invalidTime`, `invalidInstant`,
`invalidDateTime`, `unknownTimeZone`, `ambiguousTime`, `nonexistentTime`,
`invalidLocation`, `invalidBodies`, `invalidHouseSystem`, `invalidLocale` ou
`calculationFailed`. Erros de carregamento do WASM pertencem à inicialização.

## Idiomas e galeria dos seis estilos

`pt-BR` é o padrão e `en` é o segundo idioma. Passe `locale: 'en'` tanto ao cálculo
quanto à renderização para manter `displayDateTime`, erros e textos do SVG em
inglês. Textos do consumidor, como `title` e `location.label`, são preservados.

Todos os exemplos abaixo foram gerados pela própria biblioteca para o instante
fixo `2026-10-16T00:04:57Z`; o natal usa São Paulo, latitude `-23.55052`, longitude
`-46.633308`, fuso `America/Sao_Paulo` e casas Placidus. É uma demonstração do
instante informado, sem atribuição a um nascimento real.

| Tema | Composição | Natal claro | Natal escuro | Planetário claro | Planetário escuro |
| --- | --- | --- | --- | --- | --- |
| `editorial` — Editorial | Azul mineral, roda e coluna de dados | [SVG](examples/gallery/editorial-light-natal-chart.svg) | [SVG](examples/gallery/editorial-dark-natal-chart.svg) | [SVG](examples/gallery/editorial-light-planetary-chart.svg) | [SVG](examples/gallery/editorial-dark-planetary-chart.svg) |
| `midnight` — Observatório | Azul, cobre e roda ampla à direita | [SVG](examples/gallery/midnight-light-natal-chart.svg) | [SVG](examples/gallery/midnight-dark-natal-chart.svg) | [SVG](examples/gallery/midnight-light-planetary-chart.svg) | [SVG](examples/gallery/midnight-dark-planetary-chart.svg) |
| `botanical` — Botânico | Verde, argila e disposição vertical | [SVG](examples/gallery/botanical-light-natal-chart.svg) | [SVG](examples/gallery/botanical-dark-natal-chart.svg) | [SVG](examples/gallery/botanical-light-planetary-chart.svg) | [SVG](examples/gallery/botanical-dark-planetary-chart.svg) |
| `prism` — Prisma | Cores por elemento e painéis geométricos | [SVG](examples/gallery/prism-light-natal-chart.svg) | [SVG](examples/gallery/prism-dark-natal-chart.svg) | [SVG](examples/gallery/prism-light-planetary-chart.svg) | [SVG](examples/gallery/prism-dark-planetary-chart.svg) |
| `atlas` — Atlas | Azul, régua zodiacal e disposição técnica | [SVG](examples/gallery/atlas-light-natal-chart.svg) | [SVG](examples/gallery/atlas-dark-natal-chart.svg) | [SVG](examples/gallery/atlas-light-planetary-chart.svg) | [SVG](examples/gallery/atlas-dark-planetary-chart.svg) |
| `minimal` — Essencial | Espaço, traços delicados e poucos acentos | [SVG](examples/gallery/minimal-light-natal-chart.svg) | [SVG](examples/gallery/minimal-dark-natal-chart.svg) | [SVG](examples/gallery/minimal-light-planetary-chart.svg) | [SVG](examples/gallery/minimal-dark-planetary-chart.svg) |

Veja a [galeria navegável](examples/gallery/index.html), que aplica o fundo HTML
recomendado para visualizar cada modo. Abrir um SVG escuro isoladamente sobre o
fundo claro padrão de um visualizador pode reduzir o contraste dos textos.
Os arquivos seguem o padrão
`{theme}-{light|dark}-{natal|planetary}-{part}.svg`. Cada combinação gera as partes
`chart`, `wheel`, `tables`, `positions`, `aspects` (matriz) e `aspectList` (lista),
mais `houses` apenas no natal. Por exemplo:

- [Roda editorial clara](examples/gallery/editorial-light-natal-wheel.svg).
- [Posições atlas escuras](examples/gallery/atlas-dark-planetary-positions.svg).
- [Matriz prisma clara](examples/gallery/prism-light-natal-aspects.svg).
- [Lista botânica escura](examples/gallery/botanical-dark-natal-aspectList.svg).
- [Casas essencial claras](examples/gallery/minimal-light-natal-houses.svg).

Referências visuais fornecidas para o estudo: [Astro-Charts](https://astro-charts.com/),
[rodas do Astro Gold](https://www.astrogold.io/AG-MacOS-Help/wheels.html) e
[EQCalcs](https://astrology.co.uk/EQCalcs.htm). As composições e os glifos desta
biblioteca são originais; as referências não fornecem os cálculos nem os SVGs
dos exemplos e não implicam equivalência funcional ou endosso.

## Limites

O cálculo usa as efemérides embutidas do core e herda suas aproximações e limites.
Os testes de regressão não estabelecem equivalência de precisão com Swiss
Ephemeris, JPL ou outros programas. Não há efemérides externas, validação
astronômica independente ou garantia de exatidão para todo ano/coordenada aceito
pelo formato de entrada. Resultados não finitos são rejeitados pelo calculator.

A biblioteca não produz interpretações astrológicas, previsões em linguagem
natural, PDF ou imagens raster pela API pública. O gerador local de galeria cria
prévias PNG separadamente. O consumidor decide como exibir, salvar e transportar
os dados e SVGs. A suíte automatizada executa no Node; uma integração futura
precisa validar seu carregamento de WASM e apresentação no navegador escolhido.
