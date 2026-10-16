# Base editorial e adaptações

Pesquisa realizada em 7 de setembro de 2026. Foram pesquisados guias brasileiros de linguagem simples, materiais de redação oficial e documentação de skills. As fontes abaixo sustentam escolhas de clareza e organização; as orientações sobre construções formulaicas são decisões editoriais adaptadas ao pedido do usuário, não resultados de um estudo de identificação de IA.

## Fontes e aplicação

### Gov.br — Escrevendo o seu texto

Fonte: https://www.gov.br/pt-br/guia-de-edicao-de-servicos-do-gov.br/escrevendo-o-seu-texto

Adaptação: privilegiar verbos específicos, ordem direta, referências claras dos pronomes e consistência de terminologia. Reduzir floreios sem função. O guia é voltado à descrição de serviços: suas recomendações sobre tratamento direto, frases curtas e uso de tempos verbais não se tornam regras universais para literatura, ensaios ou rituais. A skill preserva a cronologia e a voz exigidas por cada texto.

### Gov.br — Planejando seu texto

Fonte: https://www.gov.br/pt-br/guia-de-edicao-de-servicos-do-gov.br/planejando-seu-texto

Adaptação: considerar o público e o objetivo antes de definir a organização. Neste projeto, a referência de graduação orienta a profundidade e o vocabulário, sem pressupor que o leitor conheça toda a terminologia de um tema.

### Agência Nacional de Águas e Saneamento Básico — 10 passos para usar Linguagem Simples

Fonte: https://www.gov.br/ana/pt-br/arquivos-externos/10-passos-linguagem-simples-anav3_b.pdf

Adaptação: planejar a mensagem, ordenar as informações, revisar e considerar a compreensão do leitor. A recomendação de evitar frases com mais de 20 palavras serve como alerta sobre frases carregadas; não será um limite mecânico. Testes com leitores reais podem ajudar, mas uma revisão do modelo não deve ser descrita como validação humana.

### Manual de Redação da Presidência da República

Fonte: https://www.gov.br/cidades/pt-br/midia/documentos/pdf/copy_of_manualderedacao.pdf

Trecho localizado pela pesquisa: orientações sobre clareza, precisão e concisão. Adaptação: retirar excessos sem eliminar conteúdo substancial. Não se transferem para todos os gêneros a impessoalidade e a formalidade próprias da comunicação oficial. A pesquisa utilizou o trecho indexado; não houve leitura integral deste manual.

### OpenAI — Customization

Fonte: https://learn.chatgpt.com/docs/customization/overview

Aplicação técnica: organizar a skill local em `.agents/skills`, com nome e descrição no `SKILL.md` e material complementar em `references`. Usar instruções curtas no `AGENTS.md` para registrar a preferência persistente do projeto. Essa documentação fundamenta a organização dos arquivos, não as escolhas de estilo em português.

## Critérios editoriais próprios desta skill

O usuário pediu português brasileiro humanizado, registro de pessoa com graduação, redução de construções características de modelos de IA e que se evite o uso de travessão. A adaptação combina revisão de conteúdo e ritmo com atenção a aberturas genéricas, contrastes repetitivos, elogios automáticos e conclusões redundantes. A preferência sobre travessões é do usuário; não é uma conclusão das fontes sobre autoria de textos.

Esses recursos também aparecem em textos humanos. O objetivo é melhorar a escrita conforme a preferência do usuário. Não há aqui uma medição de autoria ou promessa de tornar o texto indetectável. A skill orienta a geração e a revisão; não altera os parâmetros internos do modelo.

## Exemplos de calibração

Exemplos criados para esta skill, não extraídos das fontes. São demonstrações locais, não moldes para reproduzir em todo texto.

**Contraste automático e abstração**

Antes: “A revisão não é apenas uma etapa do processo, mas uma jornada essencial de aprimoramento e transformação da escrita.”

Depois: “A revisão ajuda a perceber onde o texto perde clareza e quais ideias precisam de desenvolvimento.”

**Formalidade desnecessária**

Antes: “Faz-se necessária a realização de uma análise das informações apresentadas.”

Depois: “É necessário analisar as informações apresentadas.”

**Preservação da incerteza**

Antes: “É importante destacar que os resultados sugerem uma possível relação entre os fatores analisados.”

Depois: “Os resultados sugerem uma possível relação entre os fatores analisados.”

Não substituir por “Os resultados comprovam a relação”. A cautela é parte do conteúdo.

**Cadência ritual**

Antes: “Neste momento profundamente especial, somos convidados a vivenciar uma conexão única com tudo aquilo que recebemos.”

Depois: “Façamos uma pausa para recordar o que recebemos e agradecer.”

Essa edição reduz a ornamentação; não autoriza apagar imagens ou repetições que tenham função poética no original.
