import {
  valorComSinal,
  type ContaFinanceira,
  type MovimentacaoFinanceira,
} from "./tipos";

// Saldo atual de uma conta = saldo inicial + soma dos lançamentos (com sinal).
export function saldoConta(
  conta: ContaFinanceira,
  movs: MovimentacaoFinanceira[],
): number {
  return movs
    .filter((m) => m.contaId === conta.id)
    .reduce((acc, m) => acc + valorComSinal(m), conta.saldoInicial);
}

// Saldo considerando apenas os lançamentos já conciliados (conciliação
// bancária). Comparar com o saldo do extrato do banco fecha a conciliação.
export function saldoConciliado(
  conta: ContaFinanceira,
  movs: MovimentacaoFinanceira[],
): number {
  return movs
    .filter((m) => m.contaId === conta.id && m.conciliado)
    .reduce((acc, m) => acc + valorComSinal(m), conta.saldoInicial);
}

// Ano de uma data "yyyy-MM-dd".
export function anoDe(data: string): number {
  return Number(data.slice(0, 4));
}

// Mês (0-11) de uma data "yyyy-MM-dd".
export function mesDe(data: string): number {
  return Number(data.slice(5, 7)) - 1;
}

// Anos distintos presentes nas movimentações, do mais recente ao mais antigo.
export function anosDisponiveis(movs: MovimentacaoFinanceira[]): number[] {
  const anos = new Set(movs.map((m) => anoDe(m.data)));
  anos.add(new Date().getFullYear());
  return [...anos].sort((a, b) => b - a);
}
