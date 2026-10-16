# Cidades e horário de nascimento

`celestial-wasm/locations` oferece busca de cidades no Open-Meteo e conversão de
data e horário local para UTC entre **1930-01-01 e 2040-12-31**, inclusive. Funciona
em Node.js, navegadores e workers, sem inicializar WASM ou instalar dependências
JavaScript de runtime. A busca usa rede; a conversão é síncrona e funciona offline.

## Buscar e selecionar uma cidade

```ts
import { createCitySearchClient, resolveBirthTime } from 'celestial-wasm/locations';

const cities = createCitySearchClient(); // language: 'pt', count: 10
const candidates = await cities.search('São Pau', { countryCode: 'BR' });
// Exiba candidates[].label e mantenha candidates[].id como valor da opção.
// O filtro de país é opcional: sem ele, a busca é mundial.

// Exemplo após o usuário confirmar São Paulo, cujo ID é 3448439:
const city = await cities.get(3448439);
const birth = resolveBirthTime({
  date: '1990-01-15',
  time: '10:30',
  location: city,
});

console.log(birth.instant);          // '1990-01-15T12:30:00.000Z'
console.log(birth.utcOffsetSeconds); // -7200: horário de verão nessa data
console.log(birth.timeZone);         // 'America/Sao_Paulo'
console.log(birth.location);         // latitude, longitude, timeZone, label
```

`search` retorna uma lista e nunca escolhe automaticamente a primeira cidade.
`get(id)` recupera uma cidade específica pelo identificador devolvido na busca.
Os próprios candidatos já contêm coordenadas e fuso, portanto também podem ser
passados diretamente para `resolveBirthTime` depois da seleção.

| Entrada | Comportamento |
| --- | --- |
| Zero ou um caractere | Lista vazia, sem chamada HTTP |
| Dois caracteres | Correspondência exata, conforme o Open-Meteo |
| Três ou mais caracteres | Busca pelo início de um nome indexado, ignorando acentos e maiúsculas |
| `name` com qualificador | Por exemplo, `Paris, France`; o qualificador deve corresponder ao país ou estado |
| `countryCode` | Filtro ISO de duas letras, como `BR` ou `PT` |
| `count` | De 1 a 100; padrão 10 |
| `language` | Idioma dos nomes, quando disponível; padrão `pt` |

A busca parcial é por **prefixo**, não por qualquer trecho no meio do nome nem
por correção de erros de digitação. A cobertura depende dos dados do provedor.
Latitude e longitude são as coordenadas da localidade cadastrada, sem
arredondamento adicional; não identificam uma maternidade ou endereço exato.

`City` contém `id`, `name`, `label`, `latitude`, `longitude` e `timeZone`.
Quando disponíveis, inclui `country`, `countryCode`, `admin1` a `admin4`,
`elevation`, `population`, `featureCode` e `postcodes`.

Em um seletor, aguarde uma pequena pausa na digitação antes de consultar e cancele
a busca anterior. O cliente recebe `AbortSignal` em `search` e `get`:

```ts
const controller = new AbortController();
const pending = cities.search('Campin', { signal: controller.signal });
controller.abort(); // pending rejeita com CitySearchError.code === 'aborted'
await pending.catch(error => {
  if (error.code !== 'aborted') throw error;
});
```

## Uso comercial e atribuição

A API pública gratuita do Open-Meteo é destinada a uso não comercial. Para uso
comercial, configure a assinatura e o endpoint correspondente no servidor:

```ts
const cities = createCitySearchClient({
  endpoint: 'https://customer-geocoding-api.open-meteo.com/v1/',
  apiKey: 'SUA_CHAVE', // mantenha a chave no servidor
});
```

`endpoint` também permite um proxy próprio, e `fetch` permite injetar um transporte
compatível. A biblioteca não implementa cache, retries ou debounce automaticamente.
Inclua a atribuição ao Open-Meteo e ao GeoNames na aplicação que exibe os resultados.
Veja a [documentação de geocoding](https://open-meteo.com/en/docs/geocoding-api),
os [termos do serviço](https://open-meteo.com/en/terms) e a
[licença dos dados](https://open-meteo.com/en/licence).

## Converter o horário local para UTC

`resolveBirthTime` recebe uma data gregoriana `YYYY-MM-DD`, horário `HH:mm`,
`HH:mm:ss` ou `HH:mm:ss.SSS` (uma a três casas decimais), e um local com
`latitude`, `longitude`, `timeZone` IANA e `label` opcional. Não infere o fuso
somente pelas coordenadas. Um objeto `City` pode ser usado sem adaptação.

O resultado inclui:

| Campo | Significado |
| --- | --- |
| `instant` | Instante UTC ISO 8601 com `Z` |
| `timestamp` | Milissegundos Unix, compatíveis com `new Date(timestamp)` |
| `utcOffsetSeconds` | Segundos a leste de UTC naquela data, inclusive ajustes históricos |
| `localDateTime` | Horário local informado, normalizado com segundos e milissegundos |
| `timeZone` e `location` | Fuso utilizado e cópia das coordenadas/rótulo |
| `tzdbVersion` | Versão IANA usada no cálculo |
| `resolution` | `unique`, `earlier` ou `later` |

O intervalo permitido é verificado pela **data local**: uma conversão válida pode
resultar em UTC no fim de 1929 ou início de 2041. UTC é representado como em
JavaScript/POSIX, sem segundos intercalares; este módulo não calcula UT1 nem TT.

Na volta do horário de verão, o mesmo horário pode ter ocorrido duas vezes.
Por padrão, a função lança `BirthTimeError` com `code: 'ambiguous_time'` e
`candidates`, contendo os instantes possíveis em ordem cronológica. Depois de
confirmar a ocorrência correta, use `disambiguation: 'earlier'` ou `'later'`:

```ts
const birth = resolveBirthTime({
  date: '2019-02-16',
  time: '23:30',
  location: { latitude: -23.55, longitude: -46.63, timeZone: 'America/Sao_Paulo' },
  disambiguation: 'later',
});
// instant: '2019-02-17T02:30:00.000Z'; earlier seria '2019-02-17T01:30:00.000Z'
```

Quando o relógio avança e elimina um horário, a função lança `nonexistent_time`,
inclusive com `earlier` ou `later`. O horário de nascimento nunca é deslocado
automaticamente. Transições de meia hora, mudanças de data e offsets históricos
com segundos também são tratados.

O resultado é compatível com a entrada de `calculator.natal(birth)` em
`celestial-wasm/charts`: os cálculos usam o instante UTC já resolvido. Para
exibir a informação histórica originalmente digitada, use `birth.localDateTime`;
formatadores baseados no `Intl` do ambiente podem ter outro histórico de fusos.

## Base histórica e atualização

A distribuição inclui **IANA tzdb 2026e**, com 599 identificadores e os registros
suplementares de `backzone`. A conversão não depende de `Intl`, da configuração
`TZ` ou da versão da base de fusos instalada no computador. Os offsets preservam
segundos, e as regras recorrentes são expandidas até 2041 para cobrir todo 2040.

A IANA tem limitações de cobertura e precisão histórica, especialmente antes de
1970. O fuso atual de uma cidade também pode não representar todas as práticas
locais antigas. Para situações históricas documentadas, o consumidor pode fornecer
explicitamente outro identificador em `location.timeZone`. Datas futuras usam as
regras conhecidas pela versão incluída, sujeitas a mudanças por decisão dos países.
Veja a [descrição da base IANA](https://www.iana.org/time-zones) e suas
[limitações históricas](https://data.iana.org/time-zones/theory.html).

As fontes oficiais compactadas, hashes e licença estão em `locations/data/`.
Para reproduzir a geração offline, são necessários Python 3, `make` e compilador C:

```sh
npm run timezones:check
python3 scripts/generate-time-zones.py
# Ao adotar uma nova versão, substitua VERSION pelo identificador oficial:
python3 scripts/generate-time-zones.py --update VERSION --download
```

Depois de atualizar os dados, execute os testes, revise mudanças nas regras e
atualize a versão mencionada nesta documentação. O consumidor do pacote precisa
somente dos arquivos JavaScript gerados, sem compilador C ou Python.

## Erros e verificação

`CitySearchError.code` distingue `invalid_input`, `network`, `aborted`, `http`,
`api`, `invalid_response` e `not_found`; `status` contém o status HTTP quando
disponível. Cidade não encontrada por ID é um erro; busca sem correspondências
retorna `[]`.

`BirthTimeError.code` distingue `invalid_input`, `invalid_date`, `invalid_time`,
`out_of_range`, `invalid_location`, `unknown_time_zone`, `ambiguous_time`,
`nonexistent_time` e `invalid_disambiguation`. `candidates` é vazio, exceto no caso
de horário ambíguo. Fusos desconhecidos não usam UTC como fallback.

```sh
npm run build:locations
npm run test:locations
```

Os testes não dependem de chamadas ao Open-Meteo. Cobrem contratos HTTP, escolha
por ID, cancelamento, erros, horários de verão brasileiros desde 1931, histórico
de Amsterdam em 1930, transições de meia hora, datas inexistentes, anos bissextos,
limites do intervalo e importação do pacote compilado.
