# Portabilidade e validação do core

## Verificação numérica e execução dos testes

Os 1.485 testes originais compreendem 575 testes unitários, 866 testes de integração
e 44 exemplos Rustdoc. Dos exemplos, 22 eram originalmente `no_run` (compilação) e
22 são executáveis. O runner `tests/run-wasm-doctest.mjs` executa o `main` real de
cada exemplo em WASM e rejeita falhas, imports inesperados e ausência de entrypoint.
O runner padrão de wasm-bindgen-test sozinho não executa esse `main`.

Seis regressões originais comparavam resultados transcendentais com igualdade de
bits. O port preserva seus valores de referência, usando uma tolerância absoluta
de `1e-12` somente nas comparações afetadas. NaN e infinitos são rejeitados.
Fórmulas, dados, hashes de regressão, limites e as tolerâncias astronômicas existentes
permanecem iguais. Testes adicionais verificam os limites desse comparador e a
execução de lotes no mesmo worker, com ordem, duplicatas e erros preservados.

O baseline original no macOS ARM64 falha em oito testes numéricos. Após essas seis
adaptações, dois continuam falhando somente no build nativo local:
`astronomy::heliacal::tests::close_elongation_uses_horizon_brightness` e
`astronomy::phenomena::tests::all_body_models_match_regression_fingerprint`.
Ambos passam no WASM sem alteração de suas asserções. O comando `node scripts/wasm.mjs native` permite
reproduzir esse diagnóstico; o critério de aceite deste port é a suíte WASM.

As regressões de interface carregam o `.wasm` real, comparam os fixtures originais,
testam os contratos TypeScript e criam workers Node independentes. Não são testes
das aplicações nem validação em navegador.

### Resultado verificado em 2026-10-16

Com Rust 1.96.0, wasm-bindgen 0.2.129 e Node.js 24.18.0, o comando `npm test`
terminou com código zero:

| Verificação | Resultado |
| --- | --- |
| Core: testes unitários em WASM | 577 aprovados |
| Core: testes de integração em WASM | 866 aprovados |
| Rustdoc: 22 execuções WASM e 22 compilações `no_run` | 44 aprovados |
| TypeScript: 303 chamadas de funções/aliases e inventário | 304 aprovados |
| TypeScript: regressões de resultados, erros e workers | 15 aprovados |
| TypeScript: 69 métodos/builders e entradas inválidas | 12 aprovados |
| TypeScript `strict`, sem `skipLibCheck` | aprovado |
| Build mínimo do core, sem recursos padrão, em WASM | aprovado |
| Geração da interface e `cargo fmt --all -- --check` | aprovados |

Total: **1.487 testes do core e 331 testes TypeScript, sem falhas ou ignorados**.
O inventário foi comparado por nome com o original: todos os 1.441 testes
unitários/de integração estão presentes, além dos 44 exemplos e duas novas
regressões de portabilidade.

`npm run test:bindings` também executa 20 mutações dirigidas da interface gerada, todas detectadas.
Validações adicionais em cópias descartáveis detectaram cinco mutações de
lotes/relógio, duas de tolerância/referência numérica, uma de exemplo Rustdoc,
duas de métodos e sete de execução/contrato TypeScript. Isso valida os pontos
alterados; não é uma campanha de mutação de todo o motor astronômico.

Atualizações do upstream precisam preservar o inventário de testes, a cobertura
da API e a proveniência das fontes usadas no teste de paridade. A CLI e os
bindings nativos das outras linguagens não fazem parte deste workspace.
