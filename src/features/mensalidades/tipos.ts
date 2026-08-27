// Modelo do módulo de Mensalidades (gestão de cobrança dos alunos). Hoje o
// instituto não cobra, mas o cadastro fica pronto para quando cobrar.
//
// Persistência: API .NET (/api/Mensalidades) — ver mensalidadesApi.ts. Os DTOs
// esperados do backend estão descritos ao lado de cada tipo. Datas seguem o
// padrão do portal: "yyyy-MM-dd" para dia; "yyyy-MM" para competência (mês).
//
// const objects em vez de enum por causa do erasableSyntaxOnly do tsconfig.

// ---- Plano de mensalidade -------------------------------------------------

// Um plano cobrável, com valor próprio (o instituto pode ter vários: integral,
// social, meia, etc.). DTO do backend: mesmo shape (id=0 ao criar).
export interface PlanoMensalidade {
  id: number;
  nome: string; // ex.: "Integral", "Social", "Meia-bolsa"
  valor: number; // valor cheio mensal (R$), sempre positivo
  // Dias de vencimento OFERECIDOS pelo plano (1..28). O vencimento é definido
  // por aluno: na matrícula ele escolhe um destes dias. Lista vazia = livre.
  opcoesVencimento: number[];
  ativo: boolean; // planos inativos não geram novas cobranças
  descricao?: string | null;
}

// Sugestões de dia para o seletor de opções de vencimento do plano.
export const DIAS_VENCIMENTO_SUGERIDOS = [5, 10, 15, 20, 25] as const;

// Normaliza uma lista de dias: só 1..28, únicos e ordenados.
export function normalizarDias(dias: number[]): number[] {
  return [...new Set(dias.filter((d) => d >= 1 && d <= 28))].sort((a, b) => a - b);
}

// ---- Vínculo aluno ↔ plano (matrícula financeira) -------------------------

export const StatusMatricula = {
  Ativo: "ativo", // gera cobrança todo mês
  Suspenso: "suspenso", // pausado (ex.: afastamento) — não gera cobrança
  Encerrado: "encerrado", // saiu — não gera mais
} as const;
export type StatusMatricula =
  (typeof StatusMatricula)[keyof typeof StatusMatricula];

export const STATUS_MATRICULA_LABEL: Record<StatusMatricula, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
};

// Tipo de desconto/bolsa aplicado sobre o valor do plano.
export const TipoDesconto = {
  Nenhum: "nenhum",
  Percentual: "percentual", // desconto de X% (descontoValor = X)
  Valor: "valor", // desconto de R$ X (descontoValor = X)
  Isencao: "isencao", // 100% — aluno bolsista integral (não paga)
} as const;
export type TipoDesconto = (typeof TipoDesconto)[keyof typeof TipoDesconto];

export const TIPO_DESCONTO_LABEL: Record<TipoDesconto, string> = {
  nenhum: "Sem desconto",
  percentual: "Percentual (%)",
  valor: "Valor fixo (R$)",
  isencao: "Isenção total (bolsa)",
};

// A matrícula financeira liga um aluno a um plano, com eventual bolsa. DTO do
// backend: mesmo shape (id=0 ao criar); a API valida aluno/plano existentes.
export interface MatriculaFinanceira {
  id: number;
  alunoId: number;
  planoId: number;
  // Dia de vencimento ESCOLHIDO pelo aluno (dentre as opções do plano).
  diaVencimento: number;
  inicio: string; // competência inicial "yyyy-MM"
  status: StatusMatricula;
  descontoTipo: TipoDesconto;
  descontoValor: number; // % ou R$ conforme descontoTipo; 0 nos demais
  observacao?: string | null;
}

// ---- Cobrança (mensalidade de uma competência) ----------------------------

export const StatusCobranca = {
  Pendente: "pendente", // aguardando pagamento
  Pago: "pago",
  Cancelado: "cancelado",
  Isento: "isento", // bolsista — registrada mas sem valor a receber
} as const;
export type StatusCobranca =
  (typeof StatusCobranca)[keyof typeof StatusCobranca];

export const STATUS_COBRANCA_LABEL: Record<StatusCobranca, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
  isento: "Isento",
};

// Uma cobrança de um aluno numa competência. O valor é congelado na geração
// (já com o desconto aplicado), para não mudar se o plano for reajustado depois.
// DTO do backend: mesmo shape. Ao dar baixa, o backend cria a movimentação de
// receita no livro-caixa (categoria "mensalidades") e devolve movimentacaoId.
export interface Cobranca {
  id: number;
  alunoId: number;
  planoId: number | null;
  competencia: string; // "yyyy-MM"
  vencimento: string; // "yyyy-MM-dd"
  valor: number; // valor a receber (já com desconto); 0 quando isento
  status: StatusCobranca;
  pagamentoData?: string | null; // "yyyy-MM-dd"
  pagamentoValor?: number | null;
  pagamentoForma?: string | null; // ver FORMAS_PAGAMENTO
  contaId?: number | null; // conta do livro-caixa que recebeu (integração)
  movimentacaoId?: number | null; // lançamento gerado no livro-caixa
  observacao?: string | null;
}

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Pix",
  "Cartão",
  "Transferência",
  "Boleto",
] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

// ---- Cálculos -------------------------------------------------------------

// Valor a cobrar de um plano aplicando o desconto da matrícula. Nunca negativo.
export function valorComDesconto(
  valorPlano: number,
  descontoTipo: TipoDesconto,
  descontoValor: number,
): number {
  switch (descontoTipo) {
    case "isencao":
      return 0;
    case "percentual": {
      const pct = Math.min(100, Math.max(0, descontoValor));
      return Math.max(0, +(valorPlano * (1 - pct / 100)).toFixed(2));
    }
    case "valor":
      return Math.max(0, +(valorPlano - Math.max(0, descontoValor)).toFixed(2));
    default:
      return Math.max(0, valorPlano);
  }
}

// Cobrança pendente e vencida (para hoje). "atrasado" é derivado — não é um
// status persistido, só uma leitura da cobrança pendente cujo vencimento passou.
export function estaAtrasada(c: Cobranca, hoje: Date = new Date()): boolean {
  if (c.status !== "pendente") return false;
  const venc = new Date(`${c.vencimento}T23:59:59`);
  return !Number.isNaN(venc.getTime()) && venc.getTime() < hoje.getTime();
}

// Status para exibição, incluindo o derivado "atrasado".
export type StatusExibicao = StatusCobranca | "atrasado";

export function statusExibicao(
  c: Cobranca,
  hoje: Date = new Date(),
): StatusExibicao {
  return estaAtrasada(c, hoje) ? "atrasado" : c.status;
}

export const STATUS_EXIBICAO_LABEL: Record<StatusExibicao, string> = {
  ...STATUS_COBRANCA_LABEL,
  atrasado: "Atrasado",
};

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// "2026-08" -> "Agosto/2026".
export function competenciaLabel(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const nome = MESES_PT[(mes ?? 1) - 1] ?? "";
  return `${nome}/${ano ?? ""}`;
}

// Competência do mês atual ("yyyy-MM").
export function competenciaAtual(hoje: Date = new Date()): string {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

// Vencimento (yyyy-MM-dd) de uma competência num dia do mês, respeitando o
// último dia de meses curtos (ex.: dia 31 em fevereiro vira o último dia).
export function vencimentoDe(competencia: string, dia: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate(); // dia 0 do mês seguinte
  const d = Math.min(Math.max(1, dia), ultimoDia);
  return `${competencia}-${String(d).padStart(2, "0")}`;
}
