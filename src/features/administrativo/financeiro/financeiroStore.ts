import type { ContaFinanceira, MovimentacaoFinanceira } from "./tipos";

// Persistência local do módulo financeiro. Isolada de propósito: quando a API
// .NET ganhar endpoints de contas/movimentações, basta reescrever estas
// funções (ou os hooks que as chamam) mantendo a mesma assinatura.

const CHAVE = "tribo.financeiro.v1";

interface FinanceiroDB {
  contas: ContaFinanceira[];
  movimentacoes: MovimentacaoFinanceira[];
  seq: number; // gerador de ids incremental
}

const VAZIO: FinanceiroDB = { contas: [], movimentacoes: [], seq: 1 };

function carregar(): FinanceiroDB {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return { ...VAZIO };
    const db = JSON.parse(bruto) as Partial<FinanceiroDB>;
    return {
      contas: db.contas ?? [],
      movimentacoes: db.movimentacoes ?? [],
      seq: db.seq ?? 1,
    };
  } catch {
    return { ...VAZIO };
  }
}

function persistir(db: FinanceiroDB): void {
  localStorage.setItem(CHAVE, JSON.stringify(db));
}

function proximoId(db: FinanceiroDB): number {
  const id = db.seq;
  db.seq += 1;
  return id;
}

// As funções retornam Promise para espelhar chamadas de rede (react-query).

export async function listarContas(): Promise<ContaFinanceira[]> {
  return carregar().contas;
}

export async function salvarConta(
  conta: Omit<ContaFinanceira, "id"> & { id?: number },
): Promise<ContaFinanceira> {
  const db = carregar();
  if (conta.id) {
    const i = db.contas.findIndex((c) => c.id === conta.id);
    if (i < 0) throw new Error("Conta não encontrada.");
    const atualizada = { ...db.contas[i], ...conta, id: conta.id };
    db.contas[i] = atualizada;
    persistir(db);
    return atualizada;
  }
  const nova: ContaFinanceira = { ...conta, id: proximoId(db) };
  db.contas.push(nova);
  persistir(db);
  return nova;
}

export async function excluirConta(id: number): Promise<void> {
  const db = carregar();
  db.contas = db.contas.filter((c) => c.id !== id);
  // Remove também os lançamentos órfãos da conta excluída.
  db.movimentacoes = db.movimentacoes.filter((m) => m.contaId !== id);
  persistir(db);
}

export async function listarMovimentacoes(): Promise<MovimentacaoFinanceira[]> {
  return carregar().movimentacoes;
}

export async function salvarMovimentacao(
  mov: Omit<MovimentacaoFinanceira, "id"> & { id?: number },
): Promise<MovimentacaoFinanceira> {
  const db = carregar();
  if (mov.id) {
    const i = db.movimentacoes.findIndex((m) => m.id === mov.id);
    if (i < 0) throw new Error("Lançamento não encontrado.");
    const atualizada = { ...db.movimentacoes[i], ...mov, id: mov.id };
    db.movimentacoes[i] = atualizada;
    persistir(db);
    return atualizada;
  }
  const nova: MovimentacaoFinanceira = { ...mov, id: proximoId(db) };
  db.movimentacoes.push(nova);
  persistir(db);
  return nova;
}

export async function excluirMovimentacao(id: number): Promise<void> {
  const db = carregar();
  const alvo = db.movimentacoes.find((m) => m.id === id);
  const tid = alvo?.transferenciaId;
  db.movimentacoes = db.movimentacoes.filter((m) => {
    if (m.id === id) return false;
    // Excluir um lado de uma transferência remove o par junto.
    if (tid && m.transferenciaId === tid) return false;
    return true;
  });
  persistir(db);
}

// Dados de uma transferência entre contas (aporte, resgate ou simples
// transferência). Gera dois lançamentos ligados: débito na origem e crédito
// no destino, ambos com o mesmo `transferenciaId`.
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
  const db = carregar();
  const transferenciaId = crypto.randomUUID();
  const base = {
    data: d.data,
    descricao: d.descricao,
    categoriaId: d.categoriaId,
    valor: d.valor,
    conciliado: false,
    documento: d.documento ?? null,
    observacoes: d.observacoes ?? null,
    transferenciaId,
  };
  const debito: MovimentacaoFinanceira = {
    ...base,
    id: proximoId(db),
    contaId: d.contaOrigemId,
    tipo: "Debito",
  };
  const credito: MovimentacaoFinanceira = {
    ...base,
    id: proximoId(db),
    contaId: d.contaDestinoId,
    tipo: "Credito",
  };
  db.movimentacoes.push(debito, credito);
  persistir(db);
}

export async function definirConciliacao(
  id: number,
  conciliado: boolean,
): Promise<void> {
  const db = carregar();
  const m = db.movimentacoes.find((x) => x.id === id);
  if (m) {
    m.conciliado = conciliado;
    persistir(db);
  }
}
