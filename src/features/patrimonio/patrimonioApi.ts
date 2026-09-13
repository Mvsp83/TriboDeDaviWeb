import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { BemPatrimonial } from "@/types";

export function useBens() {
  return useQuery({
    queryKey: ["patrimonio"],
    queryFn: async (): Promise<BemPatrimonial[]> => {
      const lista = await apiGet<BemPatrimonial[] | null>(ApiRotas.patrimonioGetAll);
      return lista ?? [];
    },
  });
}

// A API rejeita campos nulos de string; normaliza antes de enviar.
function montarBody(bem: Partial<BemPatrimonial>) {
  return {
    id: bem.id ?? 0,
    categoria: bem.categoria ?? 8,
    descricao: bem.descricao ?? "",
    quantidade: bem.quantidade ?? 0,
    valorUnitario: bem.valorUnitario ?? 0,
    dataAquisicao: bem.dataAquisicao || null,
    estado: bem.estado ?? 1,
    poloId: bem.poloId ?? null,
    numeroPatrimonio: bem.numeroPatrimonio ?? "",
    observacoes: bem.observacoes ?? "",
    tamanho: bem.tamanho ?? "",
    cor: bem.cor ?? "",
    alunoId: bem.alunoId ?? null,
  };
}

export function useSalvarBem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bem: Partial<BemPatrimonial>) =>
      bem.id
        ? apiPut(ApiRotas.patrimonioUpdate, montarBody(bem))
        : apiPost(ApiRotas.patrimonioCreate, montarBody(bem)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrimonio"] }),
  });
}

export function useExcluirBem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.patrimonioDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrimonio"] }),
  });
}

// ── Empréstimo / comodato (histórico por item) ──────────────────────────────
export interface EmprestimoBem {
  id: number;
  bemPatrimonialId: number;
  alunoId: number;
  dataEmprestimo: string;
  dataDevolucao?: string | null;
  observacao?: string | null;
  registradoPor?: string | null;
}

export function useEmprestarBem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: { bemPatrimonialId: number; alunoId: number; observacao: string }) =>
      apiPost(ApiRotas.patrimonioEmprestar, dados),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["patrimonio"] });
      qc.invalidateQueries({ queryKey: ["patrimonio-historico", v.bemPatrimonialId] });
    },
  });
}

export function useDevolverBem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bemId: number) => apiPost(ApiRotas.patrimonioDevolver(bemId), {}),
    onSuccess: (_r, bemId) => {
      qc.invalidateQueries({ queryKey: ["patrimonio"] });
      qc.invalidateQueries({ queryKey: ["patrimonio-historico", bemId] });
    },
  });
}

export function useHistoricoBem(bemId: number | null) {
  return useQuery({
    queryKey: ["patrimonio-historico", bemId],
    queryFn: async (): Promise<EmprestimoBem[]> => {
      const lista = await apiGet<EmprestimoBem[] | null>(ApiRotas.patrimonioHistorico(bemId!));
      return lista ?? [];
    },
    enabled: bemId != null,
  });
}
