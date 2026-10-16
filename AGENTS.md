# Regras para agentes

## Escolha de modelo para subagentes

- Ao criar um subagente, use **Sol 6.1** (`gpt-6.1-sol`) sempre que possível, como modelo padrão. Analise também a configuração do nível de esforço (raciocínio) necessário para executar a tarefa.
- Use **Astra** (`gpt-6-astra`) quando a complexidade da tarefa for maior e exigir raciocínio mais aprofundado.

## Documentação

- Sempre atualize o **README** e a documentação pertinente ao implementar ou alterar funcionalidades, APIs, comportamentos ou comandos do projeto. Mantenha exemplos, contratos, limites e instruções de uso coerentes com a implementação; regenere a referência de API quando houver mudanças nos exports ou tipos públicos.

## Produção de textos astrológicos

- Sempre use **Astra** (`gpt-6-astra`) para produzir textos astrológicos, independentemente da complexidade. Se o agente principal estiver usando outro modelo, delegue a redação a um subagente Astra. Esta regra tem prioridade sobre o modelo padrão de subagentes.
- Sempre aplique o skill **`humanizar-pt-br`** na geração e revisão de textos astrológicos do sistema. Use esse skill exclusivamente para esses textos, não nas respostas da conversa, explicações técnicas ou outros textos do projeto.
- Adote uma lente psicológica da astrologia: apresente tendências, conflitos internos, recursos e possibilidades de desenvolvimento, sem deduzir acontecimentos biográficos nem tratar o mapa como destino fixo.

## Privacidade nos arquivos do projeto

- Use identificações fictícias nos exemplos, testes e documentação. Não inclua o nome pessoal do usuário nesses arquivos nem em artefatos gerados.
- Registre caminhos relativos nas saídas de auditoria; não grave caminhos absolutos que revelem o nome do usuário local.
