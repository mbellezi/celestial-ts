# Acompanhamento do port

| id | status | esforço | descrição | notas |
| --- | --- | --- | --- | --- |
| NATIVE-ROUNDING | aberto, fora do aceite WASM | pequeno | Duas regressões originais dependem de bits da biblioteca matemática nativa. | `heliacal::close_elongation_uses_horizon_brightness` e `phenomena::all_body_models_match_regression_fingerprint` falham no macOS ARM64 e passam em WASM. Preservadas; baseline e comandos no README. |
| UPSTREAM-RISE | herdado, fora do port | médio | O core original ignora seleção de estrela em `rise_trans` e altura de horizonte em `rise_trans_true_hor`. | Os bindings e builders delegam ao core e preservam esse comportamento; não implementam um modelo astronômico diferente. |

Achados resolvidos neste port: relógios e threads nativos indisponíveis no target,
leitura de fixtures em runtime, isolamento do estado entre testes, execução efetiva
dos exemplos Rustdoc e seis comparações transcendentais com igualdade de bits.
Também foram resolvidas omissões do binding nativo: campos descartados, índices
truncados, erros sem detalhes, a função pública modular `try_panchanga` e os métodos
dos tipos/builders. Os resultados completos da API WASM e as verificações estão
descritos no README.
