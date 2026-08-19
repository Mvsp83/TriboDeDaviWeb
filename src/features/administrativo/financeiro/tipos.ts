// Modelo financeiro do instituto. Hoje persistido no navegador (ver
// financeiroStore.ts), mas os hooks têm a mesma forma dos demais *Api do
// portal, então trocar por endpoints .NET depois é só mudar a camada de dados.

// Usamos const objects em vez de enum por causa do erasableSyntaxOnly do
// tsconfig (mesmo padrão de TipoBloco/StatusPlano em types/index.ts).
export const TipoConta = {
  Corrente: "Corrente",
  Poupanca: "Poupanca",
  Aplicacao: "Aplicacao",
} as const;

export type TipoConta = (typeof TipoConta)[keyof typeof TipoConta];

export const TIPO_CONTA_LABEL: Record<TipoConta, string> = {
  Corrente: "Conta corrente",
  Poupanca: "Poupança",
  Aplicacao: "Aplicação",
};

// Contas que aparecem em Extratos (movimento do dia a dia) vs. Aplicações.
export const TIPOS_CONTA_EXTRATO: TipoConta[] = ["Corrente", "Poupanca"];

export interface ContaFinanceira {
  id: number;
  nome: string; // ex.: "Banco do Brasil C/C 12345-6"
  tipo: TipoConta;
  banco?: string | null;
  agencia?: string | null;
  numero?: string | null;
  saldoInicial: number; // saldo de abertura da conta no portal
  ativa: boolean;
  observacoes?: string | null;
}

export const TipoMovimentacao = {
  Credito: "Credito", // entrada (+)
  Debito: "Debito", // saída (-)
} as const;

export type TipoMovimentacao =
  (typeof TipoMovimentacao)[keyof typeof TipoMovimentacao];

// Natureza da categoria — define como entra na Planilha Financeira.
// Transferência (aporte/resgate entre contas) é neutra no resultado.
export type Natureza = "Receita" | "Despesa" | "Transferencia";

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  natureza: Natureza;
  tipoPadrao: TipoMovimentacao; // sugestão de crédito/débito no formulário
}

// Catálogo fixo de categorias, pensado para um instituto sem fins lucrativos
// (jiu-jitsu). A Planilha agrupa por natureza e soma por mês.
export const CATEGORIAS: CategoriaFinanceira[] = [
  // Receitas
  { id: "mensalidades", nome: "Mensalidades", natureza: "Receita", tipoPadrao: "Credito" },
  { id: "doacoes", nome: "Doações", natureza: "Receita", tipoPadrao: "Credito" },
  { id: "patrocinios", nome: "Patrocínios", natureza: "Receita", tipoPadrao: "Credito" },
  { id: "eventos", nome: "Eventos", natureza: "Receita", tipoPadrao: "Credito" },
  { id: "rendimentos", nome: "Rendimentos de Aplicações", natureza: "Receita", tipoPadrao: "Credito" },
  { id: "outras-receitas", nome: "Outras Receitas", natureza: "Receita", tipoPadrao: "Credito" },
  // Despesas
  { id: "salarios", nome: "Salários e Encargos", natureza: "Despesa", tipoPadrao: "Debito" },
  { id: "aluguel", nome: "Aluguel", natureza: "Despesa", tipoPadrao: "Debito" },
  { id: "utilidades", nome: "Água / Luz / Internet", natureza: "Despesa", tipoPadrao: "Debito" },
  { id: "material", nome: "Material Esportivo", natureza: "Despesa", tipoPadrao: "Debito" },
  { id: "manutencao", nome: "Manutenção", natureza: "Despesa", tipoPadrao: "Debito" },
  { id: "tarifas", nome: "Tarifas Bancárias", natureza: "Despesa", tipoPadrao: "Debito" },
  { id: "impostos", nome: "Impostos e Taxas", natureza: "Despesa", tipoPadrao: "Debito" },
  { id: "outras-despesas", nome: "Outras Despesas", natureza: "Despesa", tipoPadrao: "Debito" },
  // Transferências (não entram no resultado da Planilha)
  { id: "aporte", nome: "Aporte em Aplicação", natureza: "Transferencia", tipoPadrao: "Debito" },
  { id: "resgate", nome: "Resgate de Aplicação", natureza: "Transferencia", tipoPadrao: "Credito" },
  { id: "transferencia", nome: "Transferência entre Contas", natureza: "Transferencia", tipoPadrao: "Debito" },
];

export const CATEGORIA_POR_ID = new Map(CATEGORIAS.map((c) => [c.id, c]));

export function categoriaNome(id: string): string {
  return CATEGORIA_POR_ID.get(id)?.nome ?? id;
}

// Categorias usadas em Aplicações (aportes, resgates e rendimentos).
export const CATEGORIAS_APLICACAO: CategoriaFinanceira[] = CATEGORIAS.filter(
  (c) => c.id === "aporte" || c.id === "resgate" || c.id === "rendimentos",
);

export interface MovimentacaoFinanceira {
  id: number;
  contaId: number;
  data: string; // "yyyy-MM-dd"
  descricao: string;
  categoriaId: string;
  tipo: TipoMovimentacao;
  valor: number; // sempre positivo; o sinal vem de `tipo`
  conciliado: boolean; // conciliação bancária
  documento?: string | null; // nº do documento / comprovante
  observacoes?: string | null;
}

// Valor com sinal aplicado (crédito +, débito −).
export function valorComSinal(m: MovimentacaoFinanceira): number {
  return m.tipo === "Credito" ? m.valor : -m.valor;
}
