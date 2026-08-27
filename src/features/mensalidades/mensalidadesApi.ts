// Acesso a dados do módulo de Mensalidades. Mesma forma dos demais *Api do
// portal (react-query + camada fina sobre a API .NET), pronto para os endpoints
// /api/Mensalidades. Enquanto o backend não existir, os hooks funcionam mas as
// chamadas retornam erro — as telas tratam com toast, como no restante.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type {
  PlanoMensalidade,
  MatriculaFinanceira,
  Cobranca,
} from "./tipos";

const soData = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : iso ?? null);
const soCompetencia = (v: string | null | undefined) => (v ? v.slice(0, 7) : v ?? "");

// ---- Planos ---------------------------------------------------------------

export function usePlanos() {
  return useQuery({
    queryKey: ["mensalidades", "planos"],
    queryFn: () =>
      apiGet<PlanoMensalidade[] | null>(ApiRotas.mensPlanos).then((r) => r ?? []),
  });
}

export function useSalvarPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plano: Omit<PlanoMensalidade, "id"> & { id?: number }) =>
      apiPost<PlanoMensalidade>(ApiRotas.mensPlanoSalvar, { ...plano, id: plano.id ?? 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades", "planos"] }),
  });
}

export function useExcluirPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.mensPlanoExcluir(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades", "planos"] }),
  });
}

// ---- Matrículas financeiras ----------------------------------------------

function normalizarMatricula(m: MatriculaFinanceira): MatriculaFinanceira {
  return { ...m, inicio: soCompetencia(m.inicio), observacao: m.observacao || null };
}

export function useMatriculas() {
  return useQuery({
    queryKey: ["mensalidades", "matriculas"],
    queryFn: () =>
      apiGet<MatriculaFinanceira[] | null>(ApiRotas.mensMatriculas).then((r) =>
        (r ?? []).map(normalizarMatricula),
      ),
  });
}

export function useSalvarMatricula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: Omit<MatriculaFinanceira, "id"> & { id?: number }) =>
      apiPost<MatriculaFinanceira>(ApiRotas.mensMatriculaSalvar, { ...m, id: m.id ?? 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades", "matriculas"] }),
  });
}

export function useExcluirMatricula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.mensMatriculaExcluir(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades", "matriculas"] }),
  });
}

// ---- Cobranças ------------------------------------------------------------

function normalizarCobranca(c: Cobranca): Cobranca {
  return {
    ...c,
    competencia: soCompetencia(c.competencia),
    vencimento: soData(c.vencimento) ?? c.vencimento,
    pagamentoData: soData(c.pagamentoData),
    pagamentoForma: c.pagamentoForma || null,
    observacao: c.observacao || null,
  };
}

export function useCobrancas(competencia: string) {
  return useQuery({
    queryKey: ["mensalidades", "cobrancas", competencia],
    queryFn: () =>
      apiGet<Cobranca[] | null>(ApiRotas.mensCobrancas(competencia)).then((r) =>
        (r ?? []).map(normalizarCobranca),
      ),
  });
}

export interface ResultadoGeracao {
  geradas: number;
  ignoradas: number;
  mensagem: string;
}

// Gera as cobranças da competência a partir das matrículas ativas. O backend
// pula quem já tem cobrança na competência (idempotente).
export function useGerarCobrancas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (competencia: string) =>
      apiPost<ResultadoGeracao>(ApiRotas.mensCobrancaGerar, { competencia }),
    onSuccess: (_r, competencia) =>
      qc.invalidateQueries({ queryKey: ["mensalidades", "cobrancas", competencia] }),
  });
}

export interface DadosBaixa {
  id: number;
  pagamentoData: string; // "yyyy-MM-dd"
  pagamentoValor: number;
  pagamentoForma: string;
  contaId: number; // conta do livro-caixa que recebeu (integração)
}

// Dá baixa numa cobrança. O backend marca como paga e cria a movimentação de
// receita no livro-caixa (categoria "mensalidades"), devolvendo movimentacaoId.
export function useBaixarCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: DadosBaixa) => apiPost<Cobranca>(ApiRotas.mensCobrancaBaixar, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mensalidades", "cobrancas"] });
      // A baixa lança no livro-caixa: atualiza também as movimentações.
      qc.invalidateQueries({ queryKey: ["financeiro", "movimentacoes"] });
    },
  });
}

// Edita/cria uma cobrança avulsa (ajuste manual, isenção, etc.).
export function useSalvarCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Omit<Cobranca, "id"> & { id?: number }) =>
      apiPost<Cobranca>(ApiRotas.mensCobrancaSalvar, { ...c, id: c.id ?? 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades", "cobrancas"] }),
  });
}

export function useExcluirCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.mensCobrancaExcluir(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensalidades", "cobrancas"] }),
  });
}
