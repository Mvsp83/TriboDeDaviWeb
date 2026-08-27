# Mensalidades — contrato de API (para o backend .NET)

O front já está pronto e chama estes endpoints (ver `mensalidadesApi.ts` e
`apiRoutes.ts`). Os tipos/DTOs estão em `tipos.ts`. Datas: `yyyy-MM-dd`;
competência (mês): `yyyy-MM`. IDs `0` no salvar = criar.

## Planos
- `GET  /api/Mensalidades/planos` → `PlanoMensalidade[]`
- `POST /api/Mensalidades/planos/salvar` (body `PlanoMensalidade`, id=0 cria) → `PlanoMensalidade`
- `DELETE /api/Mensalidades/planos/{id}`

`PlanoMensalidade`: `{ id, nome, valor, opcoesVencimento: number[], ativo, descricao? }`
- `opcoesVencimento`: dias (1..28) que o plano oferece; o aluno escolhe um na matrícula.

## Matrículas financeiras (vínculo aluno ↔ plano)
- `GET  /api/Mensalidades/matriculas` → `MatriculaFinanceira[]`
- `POST /api/Mensalidades/matriculas/salvar` (id=0 cria) → `MatriculaFinanceira`
- `DELETE /api/Mensalidades/matriculas/{id}`

`MatriculaFinanceira`: `{ id, alunoId, planoId, diaVencimento, inicio(yyyy-MM), status, descontoTipo, descontoValor, observacao? }`
- `status`: `ativo | suspenso | encerrado`
- `descontoTipo`: `nenhum | percentual | valor | isencao` (isencao = 100%)

## Cobranças
- `GET  /api/Mensalidades/cobrancas?competencia=yyyy-MM` → `Cobranca[]`
- `POST /api/Mensalidades/cobrancas/gerar` (body `{ competencia }`) → `{ geradas, ignoradas, mensagem }`
  - Para cada matrícula **ativa**, cria a cobrança da competência se ainda não existir (idempotente).
  - `valor` = valor do plano com o desconto da matrícula, **congelado** na geração.
  - `vencimento` = dia da matrícula (`diaVencimento`) na competência (respeitar último dia do mês).
  - Matrícula com `descontoTipo = isencao` → cobrança com `status = isento` e `valor = 0`.
- `POST /api/Mensalidades/cobrancas/baixar` (body `{ id, pagamentoData, pagamentoValor, pagamentoForma, contaId }`) → `Cobranca`
  - Marca `status = pago`, grava dados de pagamento.
  - **Integração**: cria uma movimentação de **receita** no livro-caixa (categoria `mensalidades`) na conta `contaId`, e devolve `movimentacaoId` na cobrança.
- `POST /api/Mensalidades/cobrancas/salvar` (id=0 cria) → `Cobranca` (ajuste manual/cancelamento)
- `DELETE /api/Mensalidades/cobrancas/{id}`

`Cobranca`: `{ id, alunoId, planoId?, competencia(yyyy-MM), vencimento(yyyy-MM-dd), valor, status, pagamentoData?, pagamentoValor?, pagamentoForma?, contaId?, movimentacaoId?, observacao? }`
- `status`: `pendente | pago | cancelado | isento` — "atrasado" é derivado no front (pendente + vencido), não é persistido.
