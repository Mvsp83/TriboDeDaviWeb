import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { ContaFinanceira, MovimentacaoFinanceira } from "./tipos";

// Persistência do módulo financeiro na API .NET. Antes os dados ficavam só no
// localStorage do navegador (sem backup e sem compartilhamento entre pessoas);
// as assinaturas foram mantidas para que as telas e hooks não mudassem.
// A carga antiga do navegador é migrada uma única vez — ver migracaoFinanceiro.ts.

// A API devolve a data como ISO completo; as telas trabalham com "yyyy-MM-dd".
const soData = (iso: string) => (iso ?? "").slice(0, 10);

interface MovimentacaoApi extends Omit<MovimentacaoFinanceira, "data"> {
  data: string;
}

function normalizarMov(m: MovimentacaoApi): MovimentacaoFinanceira {
  return {
    ...m,
    data: soData(m.data),
    // A API guarda strings vazias; as telas esperam null quando não há valor.
    documento: m.documento || null,
    observacoes: m.observacoes || null,
    transferenciaId: m.transferenciaId || null,
  };
}

function normalizarConta(c: ContaFinanceira): ContaFinanceira {
  return {
    ...c,
    banco: c.banco || null,
    agencia: c.agencia || null,
    numero: c.numero || null,
    observacoes: c.observacoes || null,
  };
}

export async function listarContas(): Promise<ContaFinanceira[]> {
  const contas = await apiGet<ContaFinanceira[] | null>(ApiRotas.finContas);
  return (contas ?? []).map(normalizarConta);
}

export async function salvarConta(
  conta: Omit<ContaFinanceira, "id"> & { id?: number },
): Promise<ContaFinanceira> {
  const salva = await apiPost<ContaFinanceira>(ApiRotas.finContaSalvar, {
    ...conta,
    id: conta.id ?? 0,
  });
  return normalizarConta(salva);
}

export async function excluirConta(id: number): Promise<void> {
  await apiDelete(ApiRotas.finContaExcluir(id));
}

export async function listarMovimentacoes(): Promise<MovimentacaoFinanceira[]> {
  const movs = await apiGet<MovimentacaoApi[] | null>(ApiRotas.finMovimentacoes);
  return (movs ?? []).map(normalizarMov);
}

export async function salvarMovimentacao(
  mov: Omit<MovimentacaoFinanceira, "id"> & { id?: number },
): Promise<MovimentacaoFinanceira> {
  const salva = await apiPost<MovimentacaoApi>(ApiRotas.finMovSalvar, {
    ...mov,
    id: mov.id ?? 0,
  });
  return normalizarMov(salva);
}

export async function excluirMovimentacao(id: number): Promise<void> {
  await apiDelete(ApiRotas.finMovExcluir(id));
}

// Dados de uma transferência entre contas (aporte, resgate ou simples
// transferência). A API grava os dois lançamentos ligados numa só transação.
export interface DadosTransferencia {
  contaOrigemId: number;
  contaDestinoId: number;
  data: string;
  valor: number;
  categoriaId: string;
  descricao: string;
  documento?: string | null;
  observacoes?: string | null;
}

export async function registrarTransferencia(
  d: DadosTransferencia,
): Promise<void> {
  await apiPost(ApiRotas.finTransferencia, d);
}

export async function definirConciliacao(
  id: number,
  conciliado: boolean,
): Promise<void> {
  await apiPut(ApiRotas.finMovConciliacao(id, conciliado));
}
