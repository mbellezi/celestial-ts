# Interface TypeScript

Esta interface utiliza a biblioteca original [Celestial](https://github.com/geraldo-netto/celestial),
de [geraldo-netto](https://github.com/geraldo-netto). Agradecemos ao autor por
disponibilizar o motor Rust e seus testes, base deste port WebAssembly.

A [referência completa da API](../docs/api-reference.md) reúne todos os exports
de `celestial-wasm` e `celestial-wasm/charts`: funções, classes, métodos, campos,
aliases e constantes. Ela é gerada das declarações do build, incluindo JSDoc
disponível. Na pasta do pacote, execute `npm run build`, `npm run docs` e
`npm run docs:check`; a última etapa detecta documentação desatualizada.

## Inicialização e cálculo

No navegador, carregue o módulo e inicialize o WASM antes do primeiro cálculo:

```ts
import init, * as celestial from 'celestial-wasm';

await init();
const k = celestial.constants();
const jdUt = celestial.julday(2000, 1, 1, 12, k.GREG_CAL);
const flags = k.FLG_BUILTIN | k.FLG_SPEED;
const sun = celestial.calcUt(jdUt, k.SUN, flags);
```

O inicializador padrão resolve `celestial_wasm_bg.wasm` ao lado do módulo emitido.
O empacotador/servidor precisa disponibilizar esse arquivo. Para fornecer bytes
explicitamente no Node.js:

```ts
import { readFile } from 'node:fs/promises';
import init from 'celestial-wasm';

const bytes = await readFile(new URL(import.meta.resolve('celestial-wasm/wasm')));
await init({ module_or_path: bytes });
```

`init` é assíncrono. `initSync({ module: bytes })` é a alternativa quando os bytes
ou um `WebAssembly.Module` já estão disponíveis. Depois da inicialização, cálculos,
builders e renderizadores SVG são síncronos. A instância possui configuração
mutável, como modo sideral, observador e delta-T; use instâncias isoladas em
workers quando precisar de configurações independentes ou cálculos demorados.

## Escalas, unidades e índices

- `calc`/`CalcOptions.tt` recebem dia juliano em TT; `calcUt`/`CalcOptions.ut`
  recebem UT. `utcToJd` retorna `{ et, ut1 }` para escolher a escala explicitamente.
  `julday` converte componentes de calendário; seu argumento `hour` é hora decimal.
- Nas posições esféricas padrão, `lon`/`lat` são graus, `dist` é unidade
  astronômica (AU), `speedLon`/`speedLat` são graus/dia e `speedDist` é AU/dia.
  Flags de coordenadas/unidades alteram a representação; por exemplo,
  `FLG_EQUATORIAL` seleciona ascensão reta/declinação. Consulte o contrato da
  função e do core ao combinar flags.
- Latitude geográfica é positiva ao norte e longitude ao leste. `houses` recebe
  `lat, lon`, nessa ordem. Vetores `geopos` usam `[lon, lat, altitudeEmMetros]`.
- Prefira IDs e flags de `constants()` a números literais. Os calendários usam
  `JUL_CAL = 0` e `GREG_CAL = 1`; sistemas de casas no core são códigos de byte,
  como `'P'.charCodeAt(0)`. A camada charts aceita as letras `'P'`, `'W'` e `'E'`.
- Signos usam índices `0..11` (Áries a Peixes); casas usam `1..12`. As ordens
  dos demais enums e das estratégias de lote estão em [methods.d.ts](methods.d.ts).
  IDs/flags inteiros rejeitam valores fracionários, não finitos e fora do alcance
  do tipo Rust; wrappers numéricos de unidades preservam o `f64` original.

## Builders e gráficos

Os builders WASM consomem o receptor ao encadear. Guarde o valor retornado e não
reutilize nem libere um objeto já consumido. O resultado equivale à função livre:

```ts
const sun = celestial.CalcOptions.ut(jdUt, flags).body(k.SUN).get();
const positions = celestial.CalcOptions.ut(jdUt, flags)
  .bodies([k.SUN, k.MOON]).getMany();
```

`SearchOptions`, `RiseTransOptions` e `AspectOrbs` expõem os respectivos métodos
do core. `free()` libera uma instância WASM ainda não consumida.

Para gráficos, injete o namespace WASM inicializado em
`createChartCalculator(celestial)`, importado de `celestial-wasm/charts`. Use
`natal` com data/hora/localização ou `planetary` para posições geocêntricas sem
casas. O calculador seleciona delta-T automático em cada cálculo e assume
propriedade da configuração da instância recebida. Os renderizadores recebem os
dados calculados; `THEMES`, `getTheme` e `resolveTheme` separam composição visual
de paleta clara, escura ou personalizada. Consulte [charts](../charts/README.md)
para entradas, temas e SVGs transparentes.

## Cobertura e resultados

`api.d.ts` é gerado a partir dos adaptadores Rust e incorporado às declarações
emitidas pelo `wasm-bindgen`. `api-manifest.json` relaciona os nomes Rust e
JavaScript de todas as funções livres. `methods-manifest.json` cobre os métodos
dos tipos públicos; `methods.d.ts` complementa os tipos gerados das classes.

Execute `python3 wasm/generate.py --check` a partir do workspace Cargo para
verificar a cobertura e a atualização dos arquivos gerados. As regressões em
`tests/*.test.ts` importam os tipos emitidos e executam o WASM real no Node.js.

Os resultados mantêm os campos do core, com nomes JavaScript em camelCase:

- `calcMany` e `calcUtMany` retornam um item por corpo, na ordem de entrada:
  `{ status: "ok", value: PlanetPos }` ou
  `{ status: "error", value: CelestialError }`. Um erro preserva os demais itens.
- Os resultados de casas preservam os 13 elementos de `cusps` (índice zero sem
  uso) e os 10 elementos de `ascmc`. Os vetores de velocidades seguem os mesmos
  índices.
- `antiscion` retorna os vetores `antiscion` e `contrantiscion`.
- `secondaryProgressions` retorna `positions: [{ body, position }]`, com todos os
  campos de `PlanetPos`, e `houses: { cusps, ascmc }`.
- `nextAspectCusp` e `nextAspectCusp2` preservam `jd`, `pos`, `cusps` e `ascmc`.
- `midpointTable` preserva os corpos, a longitude e `planetsOnMidpoint` com
  corpo e orbe. Os calendários e os quatro pilares preservam nomes e índices.

Esses contratos preservam dados que os antigos adaptadores N-API resumiam.
Entradas compactadas de posições precisam conter pares ou trios completos;
uma cauda incompleta gera erro.

Erros lançados são objetos JavaScript `Error` com `kind` e `details`, além de
`message`. `details` preserva os campos originais, inclusive a precisão dos
valores de latitude e dia juliano que a mensagem legível arredonda. Campos que
não pertencem à variante são `null`. Erros por item de lote usam o mesmo DTO.

`Option::None` é `null`; valores IEEE `NaN` e infinitos atravessam a interface
sem conversão JSON. Resultados Rust `i64` usam `bigint`, incluindo
`elapsedDays`, os utilitários de centissegundos e `GMT_CORRELATION`.
