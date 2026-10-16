# Celestial: correções identificadas no port e orientação para backport

Relatório técnico — 16 de outubro de 2026.

Este documento reúne as correções realizadas durante o port da Celestial para Rust/WebAssembly e TypeScript. O objetivo é permitir que o mantenedor avalie e incorpore as mudanças úteis ao projeto original, sem precisar adotar a aplicação de exemplo ou a camada de interpretações.

A implementação original, de **geraldo-netto**, permanece a base deste trabalho. As referências do port abaixo são relativas ao repositório que acompanha este relatório. As referências do upstream apontam para uma revisão fixa, para que a comparação continue reproduzível.

## 1. Revisões comparadas e natureza da evidência

| Papel | Revisão |
| --- | --- |
| Celestial original | [`0e2bb383bc7b1b20112bd9ef6b01e7548bf09eb2`](https://github.com/geraldo-netto/celestial/tree/0e2bb383bc7b1b20112bd9ef6b01e7548bf09eb2) |
| Primeiro import do port, com adaptações WASM | `b9604d406d63ac7e55a2a9069f1daeb95b576c48` |
| Commit que reúne as correções astronômicas e a auditoria | `b7b9fcd732e30d102f65e3c8a196c25edd87ca3a` |
| Revisão do port examinada para este relatório | `5e583d213194a22ca5e9301cd31c30f221b36edc` |

A consulta ao `HEAD` remoto do upstream em 16/10/2026 retornou a mesma revisão `0e2bb383`. A comparação foi feita também contra uma cópia desse código, e não apenas contra mensagens de commit.

Nos arquivos `engine.rs`, `planetary.rs`, `vsop87.rs`, `pluto.rs`, `delta_t.rs`, `nodes.rs`, `chiron.rs` e nos dois módulos de casas, o código de produção do primeiro import preservava o original. As diferenças iniciais nesses arquivos se limitavam à execução/isolamento dos testes e à portabilidade numérica. Portanto, os defeitos de cálculo descritos a seguir são atribuíveis à revisão original indicada.

O arquivo `swiss-1930-2040-before.json` mede **o primeiro port em WASM**, não uma execução nativa direta do upstream. Essa distinção importa para reproduzir os números. Seus 104 hashes de fontes coincidem com o import `b9604d4`. Na auditoria final, os 115 hashes de fontes/dados coincidem com `b7b9fcd` e continuam iguais na revisão examinada; incluindo o JavaScript gerado e o WASM, os 117 hashes registrados correspondem aos arquivos locais conferidos.

A auditoria extensa existente não foi executada novamente para escrever este documento. Foram examinados código, diffs, manifestos, resultados e hashes. Duas regressões nativas históricas foram executadas pontualmente; os resultados estão na seção 8.

Em `0e4c309`, os metadados do diagnóstico de Plutão passaram a usar caminho relativo e os hashes dependentes foram atualizados. Os resultados numéricos permaneceram iguais.

**Granularidade do histórico:** `b7b9fcd` também contém funcionalidades de relatórios. Ele não constitui um commit pequeno para cherry-pick no upstream. Recomenda-se transportar os grupos de alterações descritos aqui, com seus testes e dependências.

## 2. Resultado quantitativo

A auditoria planetária utiliza Swiss Ephemeris **2.10.03**, via pyswisseph **2.10.3.2**, com `SWIEPH | SPEED = 258`: posições aparentes, tropicais e geocêntricas. O backend SWIEPH foi confirmado em todas as chamadas desse comparador, sem aceitar silenciosamente o fallback Moshier.

Foram usados **172.174 instantes**, com grade de seis horas de 1930 a 2040, 10.000 instantes pseudoaleatórios com semente fixa, o último segundo de 2040 e uma amostra adicional explícita. São **13 corpos**, totalizando **2.238.262 avaliações corpo/instante em cada comparação**, UT e TT. A comparação em UT permite modelos de ΔT diferentes; a comparação em TT fornece o mesmo TT aos dois motores.

| Resultado em UT | Primeiro port | Etapa intermediária | Atual |
| --- | ---: | ---: | ---: |
| Diferenças de signo | 17.568 | 8 | **0** |
| Diferenças brutas de retrogradação | 85.907 | 26 | **6** |
| Maior erro de longitude | 12.121,759″ | 18,249″ | **1,398″** |
| Maior diferença de ΔT | 13,458163 s | 13,458163 s | **0,000750 s** |

Em TT, as contagens de signo foram 17.566 → 6 → 0; as de retrogradação, 85.906 → 25 → 6. Nenhuma das seis ocorrências finais foi removida dos contadores. Sua investigação está na seção 6.

### Erro máximo observado de longitude em UT

Todos os valores abaixo estão em **segundos de arco**, na mesma amostragem. A coluna inicial vem de `before.json`, não de `before-deflection.json`.

| Corpo | Primeiro port | Atual |
| --- | ---: | ---: |
| Sol | 33,318434 | 0,221865 |
| Lua | 18,248673 | 0,006292 |
| Mercúrio | 197,183531 | 0,016428 |
| Vênus | 57,985008 | 0,222936 |
| Marte | 1.210,813644 | 0,226969 |
| Júpiter | 4.326,533016 | 0,389268 |
| Saturno | 5.013,519795 | 0,366514 |
| Urano | 689,332491 | 1,397657 |
| Netuno | 367,713876 | 0,015492 |
| Plutão | 3.456,107143 | 0,014800 |
| Nodo médio | 18,948686 | 0,131742 |
| Nodo verdadeiro | 12.121,759162 | 0,135543 |
| Quíron | 6.867,915412 | 0,214818 |

Esses máximos são **observações amostrais**, não limites demonstrados para todo instante. O ganho final reúne correções de implementação e adoção de dados mais precisos; não deve ser atribuído integralmente a uma única fórmula.

Fontes: [baseline](validation/swiss-1930-2040-before.json), [etapa intermediária](validation/swiss-1930-2040-before-deflection.json), [auditoria final](validation/swiss-1930-2040.json) e [síntese da auditoria](validation/precision-1930-2040.txt).

## 3. Correções no motor astronômico

### C01 — Coeficientes e avaliação VSOP87D

**Problema:** havia coeficientes incorretos e omissões relevantes nas séries transcritas. Em Júpiter, por exemplo, faltava o termo dominante com frequência `7.1135470008`; o termo de frequência `1059.3819301892` tinha amplitude e fase incorretas. O diagnóstico anual contra os coeficientes IMCCE encontrou erros heliocêntricos de até aproximadamente 0,999° em Júpiter e 1,279° em Saturno.

**Alteração:** geração das tabelas a partir dos decimais originais, com verificação das contagens de termos e hashes de entrada. O avaliador usa amplitudes em unidades nativas. No caminho reduzido, a soma das amplitudes omitidas tem limite de `1e-7` rad/AU por coordenada para `|tau| ≤ 0,1`; fora desse domínio usa-se a série completa.

**Backport:** transportar [avaliador](../core/src/astronomy/vsop87.rs), [dados gerados](../core/src/astronomy/vsop87_data.rs) e [gerador](../scripts/generate-vsop87.py) juntos. O fator `×10` do código antigo compensava sua codificação de amplitudes em `10⁻⁹`; removê-lo isoladamente, mantendo os coeficientes antigos, introduziria outro erro. O limite de truncamento não é um limite de erro contra Swiss nem uma garantia para velocidades.

**Regressões:** `earth_1992_oct_13`, `venus_1992_dec_20`, `selected_terms_have_bounded_error`, `heliocentric_radii_at_j2000`.

### C02 — FK5 e aberração

**Problema:** a correção FK5 trocava combinações trigonométricas, omitia `tan(latitude)` na longitude e introduzia um fator indevido na latitude. A aberração anual também utilizava uma expressão incompleta; o tratamento do Sol passava pela expressão genérica inadequada.

**Alteração:** em `fk5_correction`, as correções, em segundos de arco, passaram a seguir:

```text
Δλ = −0,09033 + 0,03916 × (cos λ′ + sin λ′) × tan β
Δβ =  0,03916 × (cos λ′ − sin λ′)
```

A aberração planetária passou a usar a velocidade cartesiana da Terra e transformação de Lorentz. Para o Sol, a correção longitudinal é `−20,4898″ / R`. A nutação é aplicada depois.

**Backport:** [planetary.rs](../core/src/astronomy/planetary.rs), principalmente `fk5_correction`, `aberration_from_earth`, `apparent_planet` e `apparent_sun`, em conjunto com a avaliação VSOP coerente. O upstream **já implementava tempo de luz iterativo para os planetas**; a redução de três avaliações para duas nessa rotina não é a introdução dessa correção.

**Regressões:** `sun_1992_oct_13`, `apparent_positions_against_swiss_1930_2040`, `aberration_poles_are_finite`.

### C03 — Plutão: tabela, referencial e posição aparente

**Problema:** a tabela declarada como Meeus tinha 29 linhas, coeficientes/argumentos incorretos e preenchimentos nulos, em vez das 43 linhas da tabela 37.A. Além disso, a conversão geocêntrica misturava Plutão no referencial J2000 com a Terra VSOP87D no equinócio da data. O diagnóstico de 01/01/1930 isolou aproximadamente 1,001° de erro somente pelo referencial. Corrigir apenas os coeficientes seria insuficiente.

**Alteração:** tabela de 43 termos e termos seculares corrigidos; precessão para um referencial comum antes da subtração da Terra; tempo de luz e correções aparentes. No intervalo tabulado atual, o caminho de alta precisão descrito em C08 prevalece. A série Meeus continua relevante para a API geométrica heliocêntrica e como fallback.

**Backport:** [pluto.rs](../core/src/astronomy/pluto.rs), funções `pluto_pos`, `precess_ecliptic` e `pluto_geocentric`, mais as dependências de correções aparentes. Manter separados os testes da série analítica e os testes do caminho tabulado.

**Regressões:** `meeus_published_1992_example`, `ecliptic_precession_round_trip`, `apparent_pluto_matches_swiss_reference`.

### C04 — Quíron e tratamento de flags dos corpos externos

**Problema:** o upstream já subtraía a Terra para obter Quíron geocêntrico, mas misturava referenciais J2000/da data e não aplicava a cadeia completa de correções aparentes. O modelo de dois corpos também não representava as perturbações incluídas na referência Swiss. São duas causas distintas.

**Alteração:** `chiron_geocentric` passou a aplicar precessão, tempo de luz e correções aparentes. A substituição do modelo por estados perturbados dentro da cobertura é descrita em C08. Em `engine.rs`, o novo `calc_outer_body` também trata seleção heliocêntrica, conversão equatorial e ayanamsa de Plutão/Quíron, que eram ignoradas pelos retornos antecipados anteriores.

**Backport:** [chiron.rs](../core/src/astronomy/chiron.rs) e [engine.rs](../core/src/astronomy/engine.rs), incluindo `calc_outer_body`. A auditoria ampla não valida todas as combinações de flags; esses ajustes não devem ser anunciados como compatibilidade completa com a Swiss API.

**Regressões:** `independent_swiss_positions_and_speeds`, `engine_dispatch_and_flags_match_regression_vectors`.

Os testes citados cobrem o pipeline geocêntrico. Para Plutão/Quíron, o teste de dispatch citado usa flags `258` e `2`; ele não comprova as combinações `HELCTR`, `EQUATORIAL` ou `SIDEREAL`. Essas combinações precisam de regressões específicas no backport.

### C05 — Deflexão gravitacional solar e derivadas de velocidade

**Problema:** a deflexão solar estava ausente. Sua contribuição angular é pequena em grande parte do céu, mas a variação rápida próxima ao disco solar afeta velocidades e classificações junto às estações. A diferença central antiga, com meio intervalo de **0,5 dia**, suavizava excessivamente essas variações.

**Alteração:** [deflection.rs](../core/src/astronomy/deflection.rs) implementa distância finita da fonte, massa solar efetiva para raios dentro do disco e denominadores estáveis. A deflexão precede aberração e nutação. Em [engine.rs](../core/src/astronomy/engine.rs), as velocidades aparentes passam a usar meio intervalo de **0,0001 dia** e o intervalo realmente representável entre os dois valores de dia juliano, evitando erro adicional de arredondamento do denominador.

**Backport:** transportar a deflexão, seus pontos de integração em `planetary.rs`, `pluto.rs` e `chiron.rs`, e a diferenciação de velocidades como um grupo. Preservar o aviso de origem/licença no início de `deflection.rs`. A regra especial dos nodos tabulados é diferente: sua velocidade é interpolada como observável próprio.

**Regressões:** `independent_swiss_finite_distance_disk_fixtures`, `solar_limb_is_continuous_and_conjunction_is_finite`, `original_eight_sign_boundary_witnesses_match_swiss` e testes de estações em `engine.rs`. Há um resíduo mensurado de Urano próximo a um nó da tabela de massa solar, descrito na seção 6.

### C06 — ΔT e conversão entre UT e TT

**Problema:** a diferença entre o modelo ΔT anterior e o modelo Swiss fixado chegava a 13,458163 segundos na amostra. Além disso, `tt_to_ut`, descrito como iterativo, fazia somente uma subtração com ΔT avaliado no argumento TT.

**Alteração:** segunda avaliação de ΔT no primeiro UT estimado para a conversão inversa. Dentro da cobertura, `delta_t` passou a usar uma tabela diária versionada, com interpolação linear. A configuração manual do usuário continua prioritária; `delta_t_for_year` e o cálculo analítico fora da tabela permanecem disponíveis.

**Backport:** distinguir a correção da iteração da decisão de adotar dados tabulados. Arquivos: [delta_t.rs](../core/src/astronomy/delta_t.rs), [delta-t.bin e manifesto](../core/data/delta-t.json), [gerador](../scripts/generate-delta-t.py).

**Regressão:** `pinned_delta_t_reference_and_fallback`, além dos testes de conversão. A diferença máxima auditada de 0,000750 s e a validação da interpolação não demonstram conhecimento exato da rotação terrestre futura; medem concordância com o modelo fixado.

### C07 — Nodos lunares

**Problema:** o nodo médio não incluía nutação na longitude aparente; sua velocidade omitia parte da derivada polinomial e a variação da nutação. O nodo verdadeiro usava uma soma periódica insuficiente para representar o nodo osculante. O dispatcher também devolvia distância de `1 AU` para os nodos.

**Alteração:** longitude/velocidade do nodo médio corrigidas; distância média lunar no dispatcher. O fallback do nodo verdadeiro passa a calcular a direção do momento angular `r × v`, com posições vizinhas no mesmo referencial e distância baseada na geometria orbital. Na faixa auditada, prevalece a tabela descrita em C08.

**Backport:** [nodes.rs](../core/src/astronomy/nodes.rs), funções `moon_mean_node`, `moon_mean_node_speed`, `osculating_true_node`, `moon_true_node_state`, e `calc_node` em [engine.rs](../core/src/astronomy/engine.rs).

**Regressões:** `lunar_nodes_match_swiss_fractional_holdouts`, `true_node_reported_velocity_resolves_stations`, `true_node_speed_normalizes_longitude_wrap`. Os testes contra a tabela Swiss não provam, por si sós, a precisão do fallback analítico fora da cobertura.

### C08 — Dados de alta precisão: alteração de modelo, além de correções de código

Parte importante do ganho exige incorporar novos dados. Isso merece uma decisão separada do mantenedor, especialmente se o tamanho do binário e o uso exclusivo de aproximações analíticas forem objetivos do upstream.

| Dados | Implementação | Características e arquivos indispensáveis |
| --- | --- | --- |
| Lua, Mercúrio, Netuno e Plutão | Chebyshev grau 18, estados cartesianos geocêntricos | Segmentos de 4, 8, 32 e 32 dias; binário de **8.099.928 bytes**; [avaliador](../core/src/astronomy/precision_ephemeris.rs), [manifesto](../core/src/astronomy/precision-ephemeris.manifest.json), `precision-ephemeris.bin` e [gerador](../scripts/generate-precision-ephemeris.py). |
| Quíron | Hermite cúbica, posição/velocidade heliocêntrica J2000 | **2.543 estados**, passo de 16 dias; `chiron_ephemeris.rs`, [manifesto](../core/data/chiron-ephemeris.json) e [gerador](../scripts/validation/generate-chiron-ephemeris.py). |
| Nodo verdadeiro | Lagrange de quatro pontos | **162.197 registros**, passo de seis horas; posição, velocidade, distância e velocidade radial interpoladas separadamente; binário de **5.190.304 bytes**, [manifesto](../core/src/astronomy/lunar-node.manifest.json) e [gerador](../scripts/generate-lunar-node.py). |
| ΔT | Interpolação linear diária | **41.274 registros**, cobertura 1929–2042; binário de **330.192 bytes** e [manifesto](../core/data/delta-t.json). |

**Convenções que precisam acompanhar os dados:**

- Nos estados cartesianos planetários, o tempo de luz já está incorporado; deflexão, aberração e nutação são aplicadas depois pelo motor. Não aplicar tempo de luz ou FK5 novamente sobre esses estados.
- A Lua tabulada já incorpora as convenções aparentes da fonte, exceto a nutação aplicada na saída.
- A velocidade tabulada do nodo não é a derivada exata do polinômio de sua posição. O gerador reconstrói velocidades de amostras coincidentes com junções do arquivo lunar a partir de vizinhos seguros. A regra é baseada na geometria das junções, não em uma lista de datas da auditoria a forçar para um sentido de movimento.
- Transportar avaliador, binários/dados gerados, manifestos, geradores e testes juntos. `precision_ephemeris` também precisa da declaração em `astronomy/mod.rs` e do dispatch correspondente.

O WASM resultante mede **15.590.861 bytes sem compressão**. O runtime não depende da instalação da Swiss nem de rede; a Swiss é utilizada na geração e validação. As tabelas derivadas da própria referência permitem verificar fidelidade de representação e processamento, não uma teoria física independente.

## 4. Casas: obliquidade, ascendente polar e domínio de Placidus

As alterações se concentram em [astronomy/houses.rs](../core/src/astronomy/houses.rs) e [functions/houses.rs](../core/src/functions/houses.rs).

| Problema original | Correção |
| --- | --- |
| Casas em UT usavam obliquidade média aproximada | Avaliar obliquidade verdadeira em TT. |
| Nutação/obliquidade da equação dos equinócios eram avaliadas em UT | Avaliá-las em `UT + ΔT/86400` em `sidereal_time_deg`. O tempo sideral já era aparente; foi corrigida a escala de avaliação. |
| ASC podia escolher a interseção oposta do horizonte nas regiões polares | Corrigir o semicírculo quando `norm_deg(asc − mc) > 180`, eliminando inversões observadas de 180°. |
| Placidus polar era forçado a produzir resultado por um clamp | Tratar explicitamente `abs(latitude) ≥ 90 − abs(obliquidade)`. |
| Iteração Placidus com 30 passos e tolerância de `1e-9` rad | Até 300 passos, tolerância de `1e-12` rad e retirada do clamp dentro do domínio de cálculo. |

**Contrato público:** as funções **falíveis** (`houses`, `house_cusp`, `houses_ex2`, `houses_armc`, `house_pos` e delegadas) retornam a variante já existente `HouseSystemFailed` para Placidus polar. Não houve nova assinatura nem nova variante de erro. A camada infalível retorna Porphyry; isso inclui a função pública `houses_from_armc`. Portanto, não seria correto dizer que todas as APIs públicas rejeitam o caso.

**Evidência:** 7.920 configurações — 48 datas, 11 latitudes, cinco longitudes e sistemas P/E/W. O máximo não polar de cúspides/ASC em UT caiu de **47,250427″ para 0,855188″**. As inversões polares próximas de 180° em E/W desapareceram; em casas iguais polares, o máximo final foi **0,969221″**. As mesmas **960 configurações polares de Placidus** rejeitadas pela Swiss foram rejeitadas pelos wrappers auditados. Com os mesmos ARMC e obliquidade nos dois motores, o máximo Placidus final foi aproximadamente **0,000373″**.

**Regressões para transportar:** `swiss_placidus_ut_reference`, `swiss_polar_ascendant_and_explicit_fallback`, `sidereal_time_and_obliquity_match_regression_vectors`. As referências estão nos JSON de casas [anterior](validation/houses-swiss-1930-2040-before.json) e [atual](validation/houses-swiss-1930-2040.json).

**Limite da conclusão:** a grade não cobre todos os sistemas, todas as variantes `ex/ex2`, velocidades de casas, `house_pos` ou uma varredura fina do limite polar. A comparação externa abrange P/E/W. O fallback Porphyry foi verificado estruturalmente no próprio motor. Não se deve generalizar o resultado para Koch ou demais sistemas sem auditoria específica.

## 5. Portabilidade WASM e contratos do binding JavaScript

Estas mudanças são anteriores ao pacote astronômico e já aparecem no import `b9604d4`. São úteis para uma versão WebAssembly ou para revisar os contratos do binding nativo. **O novo binding WASM não é uma modificação já aplicada ao binding N-API do upstream.**

### P01 — Relógio e execução de lotes

`std::time::SystemTime` e threads nativas não forneciam a execução necessária em `wasm32-unknown-unknown`.

- [functions/time.rs](../core/src/functions/time.rs) usa `web_time` somente no target WASM; o caminho nativo conserva `std::time`.
- [functions/calc.rs](../core/src/functions/calc.rs) executa lotes sequencialmente no worker WASM, conservando ordem, duplicatas e erros por item. O caminho nativo com threads permanece.
- [core/Cargo.toml](../core/Cargo.toml) adiciona as dependências específicas de target. O teste `wasm_batch_stays_in_worker_and_preserves_duplicates_and_errors` verifica o contrato.

Isso é adaptação de plataforma; não implica que o paralelismo nativo estivesse incorreto.

### P02 — Testes realmente executados e estado isolado

- Testes em WASM usam `wasm_bindgen_test`; fixtures antes lidas por filesystem são incorporadas por `include_str!`.
- `TestConfigGuard` em [functions/config.rs](../core/src/functions/config.rs) restaura configuração mutável, evitando que testes que compartilham um worker contaminem os seguintes.
- [run-wasm-doctest.mjs](../tests/run-wasm-doctest.mjs) executa o `main` real dos exemplos Rustdoc, verifica imports e código de saída. O runner padrão, isoladamente, não fornecia essa execução dos exemplos.
- Seis regressões originalmente baseadas em igualdade de bits receberam comparação finita com tolerância absoluta de `1e-12`. A etapa posterior também trocou alguns hashes/snapshots por vetores e invariantes apropriados às fórmulas corrigidas.

A preservação do inventário original, as limitações e os resultados da etapa inicial estão em [portability.md](portability.md). Não se deve aplicar uma tolerância global a todos os testes nem ampliar indiscriminadamente limites astronômicos.

### B01 — Dados descartados pelos adaptadores nativos

O [binding JS original](https://github.com/geraldo-netto/celestial/blob/0e2bb383bc7b1b20112bd9ef6b01e7548bf09eb2/bindings/js/src/lib.rs) resumia certos resultados do core. O novo binding preserva as estruturas completas:

| API | Resumo no adaptador original | Contrato no port WASM |
| --- | --- | --- |
| `antiscion` | Somente vetor de antíscio | Antíscio e contra-antíscio. |
| `secondaryProgressions` | Corpo + longitude/latitude/distância/velocidade longitudinal e cúspides | `PlanetPos` completo por corpo e casas com `cusps`/`ascmc`. |
| `nextAspectCusp` / `nextAspectCusp2` | Somente JD | JD, posição, cúspides e ângulos. |
| `midpointTable` | Corpos e longitude do ponto médio | Também os corpos encontrados sobre o ponto médio e seus orbes. |
| `calcMany` / `calcUtMany` | Um erro faz o adaptador devolver erro para o lote inteiro | Resultado discriminado por item, sem perder os demais. |

**Backport:** consultar [wasm/src/native.rs](../wasm/src/native.rs), [binding.rs](../wasm/src/binding.rs) e os testes `complete house, antiscion, progressed chart and cusp records retain every field`, `midpoints, named festivals, pillars and auxiliary metadata remain complete` e `batch calculations retain order, duplicate bodies and per-item structured errors`, em [binding.test.ts](../wasm/tests/binding.test.ts).

Essas formas de retorno mudam o contrato JavaScript. Para o N-API existente, o mantenedor pode preferir métodos adicionais ou uma versão com migração explícita, em vez de substituir silenciosamente os retornos atuais.

### B02 — Conversões truncadas e entradas incompletas

O original convertia códigos de casas `u32 → u8` com `as`, permitindo que valores fora do alcance virassem outro sistema — por exemplo, `336` torna-se `80`, código de `P`. Vetores compactados usavam `chunks_exact` sem verificar o resto, descartando caudas incompletas; IDs `f64` eram convertidos com `as i32`.

No port, os argumentos inteiros são desserializados com validação de alcance/tipo. `packed_chunks` exige comprimento múltiplo de dois ou três, conforme a API; `packed_body` rejeita NaN, infinitos, frações e valores fora de `i32`. Ver [exports.rs](../wasm/src/exports.rs), [native.rs](../wasm/src/native.rs), [methods.rs](../wasm/src/methods.rs) e [methods.test.ts](../wasm/tests/methods.test.ts).

### B03 — Erros, precisão e cobertura de API

- Erros preservam `kind`, `details` e `message`, incluindo campos numéricos que a mensagem formatada arredonda.
- `i64` é exposto como `bigint`; `Option::None` como `null`; NaN e infinitos não são perdidos em uma passagem intermediária por JSON.
- Foram incluídos métodos/builders e funções públicas ausentes da cobertura anterior, como `try_panchanga`; os manifestos permitem conferir a cobertura gerada.

Arquivos: [lib.rs](../wasm/src/lib.rs), [binding.rs](../wasm/src/binding.rs), [gerador](../wasm/generate.py), [api-manifest.json](../wasm/api-manifest.json), [methods-manifest.json](../wasm/methods-manifest.json). A cobertura adicional é uma extensão do binding; não significa que a função correspondente estivesse ausente no core original.

## 6. Divergências residuais e problemas não corrigidos por este trabalho

A auditoria final conserva **seis diferenças brutas de retrogradação**:

| Casos | Diagnóstico | Evidência |
| --- | --- | --- |
| Plutão: 12/12/1961, 09/06/1972, 01/02/1983, 06/02/1985 e 13/08/1997 | O diagnóstico local isola a ausência do termo temporal da obliquidade na rotação da velocidade Swiss para a eclíptica. Perto da estação, esse termo pode mudar o sinal. O port acompanha o sinal de diferenças centrais das próprias posições Swiss nos cinco casos. | [swiss-pluto-speed-diagnostic.json](validation/swiss-pluto-speed-diagnostic.json) |
| Nodo verdadeiro: 21/06/2029, 00:00 UT | Uma diferença curta atravessa uma junção de segmentos do arquivo lunar, aproximadamente dois segundos à frente. Swiss registra `+0,128254820°/dia`; a representação suavizada retorna `−0,005515245°/dia`. Diferenças dentro do segmento e em intervalos maiores sustentam o sinal negativo. | [true-node-segment-join.json](validation/true-node-segment-join.json) |

Essas são conclusões dos diagnósticos locais, não uma declaração de que o mantenedor da Swiss tenha confirmado os problemas. A [classificação dos resíduos](validation/residual-classification.json) registra cinco casos de convenção de referencial e um de junção de segmentos; não remove amostras nem redefine o contador para zero.

O maior resíduo bruto de velocidade é o pico do nodo, **481,572237″/dia**. Urano mantém aproximadamente **2,898718″/dia** perto do disco solar: a diferença angular entre VSOP e Swiss coloca os raios em lados distintos de um nó da tabela de massa solar efetiva. Ver [diagnóstico de Urano](validation/uranus-speed-knot-diagnostic.json) e [resíduos de velocidade](validation/velocity-residuals.json).

Outros limites relevantes para o mantenedor:

- Não foi demonstrada equivalência integral com Swiss `SPEED`, nem precisão contínua junto a todas as estações e fronteiras de signo.
- A auditoria não cobre todas as flags siderais, topocêntricas, equatoriais e heliocêntricas. Ainda há caminhos que não propagam todas as conversões de flags aos nodos ou às velocidades. Não anunciar “todas as flags corrigidas”.
- Os fallbacks analíticos e suas junções com as tabelas não herdam a precisão medida em 1930–2040.
- A seleção de estrela em `rise_trans` e a altura de horizonte em `rise_trans_true_hor` continuam limitações herdadas registradas no [TODO](../TODO.md).
- O modelo lunar de rise/set mantém aproximações de horizonte/paralaxe/semidiâmetro. O novo teste de referência admite 90 s para Lua, 15 s para Sol e 5 s para Saturno nos casos específicos; não representa uma auditoria geral de rise/set.

## 7. Dependências, origem dos dados e sequência sugerida de backport

As correções podem ser avaliadas em grupos:

1. **Infraestrutura de regressão e reprodução:** preservar fixtures, convenções, hashes e casos anteriores, antes de substituir os valores esperados.
2. **VSOP coerente:** avaliador, coeficientes e gerador juntos.
3. **Referenciais e correções aparentes:** FK5/aberração/Sol; tabela e precessão de Plutão; pipeline de Quíron; nodo médio e fallback osculante.
4. **Tempo e casas:** separar a iteração TT→UT da opção de tabela ΔT; portar as correções de casas e o contrato polar com seus testes.
5. **Deflexão e derivadas curtas:** transportar juntas, verificando estações e proximidade do disco solar.
6. **Pacote de dados de alta precisão:** incorporar somente com os estados, avaliadores, flags de geração, manifestos e testes correspondentes. O resultado quantitativo final pressupõe esse conjunto.
7. **Bindings:** adaptar validações e DTOs ao N-API com uma decisão explícita de compatibilidade.
8. **Otimizações opcionais:** o cache da Terra em VSOP pode ser avaliado por último. Os testes verificam igualdade de bits em acertos/evicções e independência dos caminhos com e sem derivada.

A implementação atual não oferece uma feature Cargo para desligar todas as tabelas novas. Fazer esse pacote opcional seria uma **proposta de integração no upstream**, não uma funcionalidade já implementada e testada aqui.

**Origem e distribuição:** os coeficientes VSOP87D são atribuídos a Bretagnon/Francou e aos arquivos IMCCE; hashes e URLs estão no gerador e nos dados. A deflexão adaptada e os dados derivados Swiss conservam avisos AGPL-3.0-or-later, com a revisão Swiss fixada em `c113653fe37fe5cdbfcc030a6e341de03ef018d2`. Preservar [NOTICE](../NOTICE), [core/data/NOTICE](../core/data/NOTICE), [LICENSE](../LICENSE), os avisos de `deflection.rs` e os manifestos. Não atribuir automaticamente uma licença permissiva aos arquivos numéricos de outras fontes.

**Fora do pacote de correções:** gráficos SVG, textos interpretativos, relatórios coletivos/natais, geocodificação, fusos IANA e aplicação de exemplo são funcionalidades novas. Não é necessário portá-las para corrigir o motor Rust. As alterações do exemplo que preservam a hora civil histórica na apresentação pertencem à integração TypeScript, não a uma correção do núcleo astronômico original.

### Como inspecionar os diffs sem misturar funcionalidades

Na cópia do repositório do port:

```sh
# Núcleo, dados e regressões modificados pelo pacote astronômico.
git diff --stat b9604d4 b7b9fcd -- core/
git diff b9604d4 b7b9fcd -- core/src/astronomy/planetary.rs core/src/astronomy/houses.rs core/src/functions/houses.rs

# Inclua --binary se for produzir um patch que transporte tabelas embutidas.
git diff --binary b9604d4 b7b9fcd -- core/ scripts/generate-vsop87.py scripts/generate-delta-t.py scripts/generate-lunar-node.py scripts/generate-precision-ephemeris.py scripts/validation/ > celestial-core-review.patch
```

O último comando produz material para revisão, **não um patch certificado para aplicação direta no upstream**. O import inicial já contém infraestrutura WASM que não existe na árvore original; alguns hunks de teste exigem adaptação. Para relógio, lotes e bindings, comparar o original com o import inicial, conforme a seção 5. Não copiar integralmente o novo workspace por cima do workspace original de CLI/bindings.

## 8. Reprodução e verificação

A auditoria registrada usa Rust **1.96.0**, wasm-bindgen **0.2.129**, Node **24** e Python com pyswisseph **2.10.3.2**. Os arquivos Swiss devem corresponder ao manifesto fixado no [JSON da auditoria](validation/swiss-1930-2040.json); usar arquivos atuais sem conferir os hashes produz outra referência.

```sh
npm ci
npm run build
npm test

# Configure um Python com a versão fixada de pyswisseph e o diretório
# contendo as efemérides e manifest.json com seus hashes.
PYTHON_AUDIT=/caminho/do/ambiente/bin/python
EPHE_DIR=/caminho/das/efemerides-fixadas

node scripts/validation/export-core.mjs /tmp/celestial-core-audit.bin
SE_EPHE_PATH="$EPHE_DIR" "$PYTHON_AUDIT" scripts/validation/compare-swiss.py \
  --ephe "$EPHE_DIR" --input /tmp/celestial-core-audit.bin \
  --output /tmp/celestial-swiss-review.json

SE_EPHE_PATH="$EPHE_DIR" "$PYTHON_AUDIT" scripts/validation/houses-swiss.py \
  --output /tmp/celestial-house-reference.json
node scripts/validation/houses-core.mjs \
  --reference /tmp/celestial-house-reference.json \
  --output /tmp/celestial-house-review.json

SE_EPHE_PATH="$EPHE_DIR" "$PYTHON_AUDIT" scripts/validation/swiss-pluto-speed-diagnostic.py \
  --ephe-dir "$EPHE_DIR" --audit /tmp/celestial-swiss-review.json \
  --output /tmp/celestial-pluto-review.json
```

`houses-swiss.py` aceita `--output`, mas não `--ephe`. Fixar `SE_EPHE_PATH` evita que um caminho herdado do ambiente altere a referência; a Swiss dá precedência a essa variável. Diferentemente do comparador planetário, o gerador da referência de casas não grava um manifesto completo das efemérides nem verifica o backend retornado.

Os scripts [node-diagnostic.py](../scripts/validation/node-diagnostic.py), [velocity-diagnostic.py](../scripts/validation/velocity-diagnostic.py), [uranus-speed-diagnostic.py](../scripts/validation/uranus-speed-diagnostic.py) e [classify-residuals.py](../scripts/validation/classify-residuals.py) reproduzem as investigações específicas; consultar seus argumentos antes de substituir os artefatos versionados.

Na revisão atual, a suíte completa anteriormente executada aprovou **2.125 testes**: 1.506 Rust/doc, 331 bindings, 80 gráficos, 90 relatórios, 106 locais/UTC e 12 do exemplo, além das verificações de mutação dirigidas, documentação e licenças. Esse total inclui componentes novos e não deve ser apresentado como o número de testes do upstream original.

**Nota sobre documentação histórica:** `portability.md` e o item `NATIVE-ROUNDING` do TODO descrevem falhas da etapa inicial. Na revisão examinada, `close_elongation_uses_horizon_brightness` passou em uma execução nativa direcionada. A antiga regressão `all_body_models_match_regression_fingerprint` foi substituída por `all_body_models_match_regression_vectors`, que também passou na execução nativa direcionada. Essas duas verificações não equivalem à reexecução da suíte nativa completa.

```sh
cargo test --locked -p celestial-core --all-features --lib close_elongation_uses_horizon_brightness
cargo test --locked -p celestial-core --all-features --lib all_body_models_match_regression_vectors
```

**Mudanças de snapshots:** em vários arquivos de funções, eclipses, buscas, fenômenos, heliacal e rise/set, o diff posterior a `b9604d4` atualiza testes afetados pelas novas posições/tempos, sem alterar o algoritmo de produção daquele módulo. Esses arquivos não devem ser apresentados como bugs independentes corrigidos. Uma referência externa ou um invariante deve justificar cada atualização de valor esperado.

WASM conferido contra a auditoria final:

```text
SHA-256: 76e94ee97cff2ff3da281224f69e29173e05c3f7e277e12c7b700e3223fd894c
Tamanho: 15.590.861 bytes
```

O relatório permite selecionar grupos de backport e seus critérios de aceitação. A reprodução no workspace original continua necessária antes de integrar cada grupo, sobretudo para contratos N-API, sistemas de casas fora de P/E/W e modos de cálculo não cobertos pela auditoria.
