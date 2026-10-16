# Arquitetura da biblioteca Celestial WASM

- **Data:** 2026-10-16

## Contexto

O cálculo de efemérides será usado futuramente em um worker da aplicação. Celestial
oferece um motor Rust, mas seu binding JavaScript existente depende de N-API e os
relógios, threads e parte dos testes assumem um ambiente nativo.

## Decisão

Manter o core de Celestial e seus testes na árvore desta biblioteca, com proveniência,
licença original e workspace Cargo independente. Compilar para
`wasm32-unknown-unknown` usando wasm-bindgen, com interface ES module e declarações
TypeScript. Preservar todos os recursos padrão do core, incluindo fusos e calendários.

Usar relógios compatíveis com JavaScript e execução sequencial para o cálculo em
lote no WASM. Cada instância mantém seu próprio estado de configuração; a futura
aplicação será responsável pela criação e comunicação com seus workers.

Validar os testes da biblioteca no runtime WASM do Node, inclusive os exemplos
executáveis da documentação, sem navegador e sem substituir os cálculos por
implementação TypeScript. Fixar toolchain/dependências e manter builds gerados fora
do Git. Todos os scripts, lockfiles e configurações ficam nesta árvore, sem caminhos
para uma aplicação ou um repositório pai.

Incluir no mesmo pacote o subpath `celestial-wasm/charts`, uma camada
TypeScript independente de DOM que recebe a API WASM inicializada, calcula os dados
e renderiza mapas/tabelas em SVG. As posições, casas e aspectos continuam sendo
calculados pelo core Rust. O mapa natal exige localização e inclui casas; o mapa
planetário usa o zodíaco tropical geocêntrico e não calcula casas.

Separar cálculo de renderização para permitir execução em worker e reutilizar os
mesmos dados entre temas. Aceitar instantes com offset explícito ou data/hora com
fuso IANA; rejeitar horários locais ambíguos ou inexistentes. O calculador assume
propriedade da instância WASM recebida e restaura o delta-T automático a cada cálculo.
Oferecer seis composições, cada uma com paletas light/dark e seleção de cores
personalizada. O fundo SVG é transparente; a cor `background` apenas recomenda o
fundo da página hospedeira. Glifos são vetoriais próprios e os textos têm localização
pt-BR/en, com galeria de exemplos reais reproduzíveis. Validar TypeScript, SVG, integração WASM,
execução em worker e regressões de geometria no escopo isolado da biblioteca.

## Consequências

- Rust é ferramenta de build deste componente; Node e TypeScript permanecem os
  runtimes e contratos de consumo da biblioteca.
- A integração futura deve carregar o WASM explicitamente e respeitar a licença
  preservada da dependência.
- Atualizações do upstream exigem verificar o inventário de testes e a cobertura
  dos exports, além de revisar os pequenos ajustes de portabilidade.
- A validação fica limitada à biblioteca nesta etapa, conforme o escopo solicitado.
- SVGs e dados da galeria são exemplos versionáveis; builds de distribuição e
  prévias PNG de inspeção permanecem ignorados. A publicação npm e integração na
  aplicação são etapas posteriores.
