# Regras para agentes

## Escolha de modelo para subagentes

- Ao criar um subagente, use **Sol 6.1** (`gpt-6.1-sol`) sempre que possível, como modelo padrão. Analise também a configuração do nível de esforço (raciocínio) necessário para executar a tarefa.
- Use **Astra** (`gpt-6-astra`) quando a complexidade da tarefa for maior e exigir raciocínio mais aprofundado.

## Produção de textos astrológicos

- Sempre use **Astra** (`gpt-6-astra`) para produzir textos astrológicos, independentemente da complexidade. Se o agente principal estiver usando outro modelo, delegue a redação a um subagente Astra. Esta regra tem prioridade sobre o modelo padrão de subagentes.
- Sempre aplique o skill **`humanizar-pt-br`** na criação e revisão desses textos.
