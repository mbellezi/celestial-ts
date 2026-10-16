# Aplicação de exemplo

Aplicação estática em português brasileiro, sem framework nem dependências de
runtime. Combina os módulos públicos `celestial-wasm`, `/reports`, `/charts` e
`/locations`: calcula a leitura de um dia ou mês e um mapa natal com relatório e
gráficos SVG. Os textos vêm dos catálogos editoriais existentes do pacote.

## Executar

Na raiz do projeto, com Node.js 24 ou posterior e os requisitos de compilação
descritos no [README principal](../../README.md):

```sh
npm ci
npm run build
npm run example
```

Abra `http://127.0.0.1:4173/`. O servidor redireciona para `/examples/app/` e serve
apenas os assets públicos de `examples/app/` e `pkg/`. Ele escuta em
`127.0.0.1`; não expõe o restante do repositório. Não há listagem de diretórios.
Arquivos ocultos, testes, mapas de código-fonte, declarações TypeScript e links
simbólicos não são servidos. WASM usa `application/wasm`, módulos JavaScript e
imports JSON usam os tipos correspondentes.

Uma porta alternativa pode ser escolhida com
`node scripts/example.mjs start --port 4174`. Sem `pkg/` compilado, o comando
informa que é necessário executar `npm run build`.

## Usar o exemplo

- **Dia e mês:** selecione a data civil e o fuso IANA. O intervalo permitido vai
  de **2026-01-01 a 2035-12-31**, inclusive; os meses usam todos os dias locais,
  incluindo fevereiro bissexto. A conversão para UTC respeita o fuso escolhido.
- **Mapa natal:** informe uma data entre **1930-01-01 e 2040-12-31**, inclusive,
  horário local e uma cidade selecionada nos resultados. A cidade fornece
  coordenadas e fuso; o deslocamento UTC histórico vem dos dados IANA
  incorporados em `/locations`. Relatórios e gráficos preservam a hora civil
  confirmada, inclusive nos deslocamentos históricos com precisão de segundos;
  os cálculos e os metadados mantêm o instante UTC correspondente. Essa distinção
  evita depender da cobertura histórica do `Intl` do navegador para exibir a hora
  de nascimento.
- **Horários repetidos:** quando uma mudança de horário produz duas ocorrências
  do mesmo relógio local, escolha explicitamente a ocorrência anterior ou a
  posterior. **Horários inexistentes são rejeitados**; corrija a hora informada.
- **Exportações de resultados:** os relatórios oferecem HTML, texto, Markdown e
  JSON. O mapa natal também oferece os gráficos SVG do pacote.

A busca de cidades consulta o Open-Meteo/GeoNames e requer internet. Os cálculos
e a resolução do horário de nascimento ocorrem localmente, após carregar os
assets. O exemplo não envia data, horário ou nome de nascimento a um servidor
de cálculos nem utiliza uma chave de API. Consulte a
[documentação de localidades](../../locations/README.md) para cobertura, atribuição
e condições de uso do provedor. A API pública gratuita destina-se ao uso não
comercial; em outra distribuição, configure um serviço adequado sem expor
credenciais no navegador.

## Carregamento e worker

`app.js` mantém a interface e a busca de cidades. `worker.js`, um Web Worker de
módulo, importa o núcleo WASM, os catálogos de relatórios e os gráficos. O worker
baixa o WASM uma vez e inicializa uma instância reutilizada pelos cálculos.
O indicador acompanha os bytes efetivamente lidos; apresenta porcentagem quando
há `Content-Length` utilizável, e um estado indeterminado quando o tamanho total
não está disponível. A preparação do WASM e os cálculos têm estados próprios.

O protocolo usa `{ id, type, input }`, com `type` igual a `init`, `astro` ou
`natal`. As respostas conservam `id` e usam `progress`, `ready`, `result` ou
`error`. `astro` recebe `{ kind: 'day' | 'month', date, timeZone }`; `natal`
recebe `{ birth, name?, houseSystem? }`, onde `birth` é o resultado de
`resolveBirthTime`. O worker devolve os dados canônicos e suas representações
renderizadas. `calendar.js` concentra a validação dos limites e dos meses.

Use um navegador atual com WebAssembly, Web Workers de módulo, imports de JSON
com atributos e `Intl` com os fusos utilizados. Sirva os arquivos por HTTP(S);
abrir `index.html` por `file://` não fornece o ambiente necessário.

## Exportar uma versão estática

Depois de `npm run build`:

```sh
npm run example:build
# equivalente:
node scripts/example.mjs --build
```

O comando gera **`dist/example-app/`** usando o build atual, sem recompilar o
pacote. A exportação pode ser hospedada em uma raiz ou em um subdiretório de um
servidor estático. Seu `index.html` redireciona por um caminho relativo para
`examples/app/`; os imports `../../pkg/` continuam válidos. Preserve a estrutura:

```text
dist/example-app/
  index.html
  examples/app/        # interface, worker e calendário
  pkg/                # módulos JavaScript, catálogos JSON e WASM
  LICENSE
  NOTICE
  THIRD-PARTY-NOTICES.txt
  UPSTREAM-README.md
  source/             # fontes correspondentes e instruções de compilação
```

O diretório `source/` contém uma seleção explícita dos diretórios de código,
scripts, manifests e arquivos de licença do projeto, incluindo as fontes deste
exemplo. Não inclui `.git/`, dependências instaladas nem saídas de compilação.
Os avisos e fontes acompanham a distribuição AGPL-3.0-or-later. A exportação
substitui a versão anterior em `dist/example-app/` e rejeita links simbólicos
nos arquivos copiados. O servidor de hospedagem deve fornecer os tipos MIME de
JavaScript, JSON e WASM e aceitar o uso de workers na mesma origem.

## Verificar

```sh
npm run test:example
```

Os testes verificam rotas, tipos MIME, limites de acesso, exportação estática e
datas civis. Um adaptador Node executa o worker real com o WASM compilado para
verificar progresso, relatórios diário/mensal, JSON canônico e os sete SVGs
natais. As regressões cobrem um deslocamento histórico com segundos em 1930,
as duas ocorrências de uma hora repetida em São Paulo, horários inexistentes e
alternativas de sistemas de casas em latitudes polares. Os testes HTTP precisam
de permissão para escutar na interface local.

A interface foi verificada no navegador em tela ampla e em 390 px: os três
fluxos, consulta real de cidades, escolha de horário repetido, rejeição de
horário inexistente e recuperação após falha de download. Um proxy local
temporário simulou uma conexão lenta para conferir o spinner e a porcentagem
de transferência sem inventar progresso. O CSS respeita redução de movimento,
os campos têm rótulos e a busca de cidades também aceita teclado.
