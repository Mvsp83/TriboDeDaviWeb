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

// ── Alocação / comodato (quimono·faixa por aluno, tatame por polo) ───────────
export interface EmprestimoBem {
  id: number;
  bemPatrimonialId: number;
  alunoId?: number | null;
  poloId?: number | null;
  dataEmprestimo: string;
  dataDevolucao?: string | null;
  observacao?: string | null;
  registradoPor?: string | null;
}

// Invalida tudo que depende de alocações: a lista de bens (disponibilidade) e os
// históricos por bem/aluno/polo (sem precisar saber a chave exata de cada um).
function invalidarPatrimonio(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["patrimonio"] });
  qc.invalidateQueries({ queryKey: ["patrimonio-historico"] });
  qc.invalidateQueries({ queryKey: ["patrimonio-aluno"] });
  qc.invalidateQueries({ queryKey: ["patrimonio-polo"] });
}

export function useEmprestarBem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: {
      bemPatrimonialId: number;
      alunoId?: number;
      poloId?: number;
      observacao: string;
    }) => apiPost(ApiRotas.patrimonioEmprestar, dados),
    onSuccess: () => invalidarPatrimonio(qc),
  });
}

export function useDevolverEmprestimo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emprestimoId: number) =>
      apiPost(ApiRotas.patrimonioDevolver(emprestimoId), {}),
    onSuccess: () => invalidarPatrimonio(qc),
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

export function useHistoricoAluno(alunoId: number | null) {
  return useQuery({
    queryKey: ["patrimonio-aluno", alunoId],
    queryFn: async (): Promise<EmprestimoBem[]> => {
      const lista = await apiGet<EmprestimoBem[] | null>(
        ApiRotas.patrimonioHistoricoAluno(alunoId!),
      );
      return lista ?? [];
    },
    enabled: alunoId != null,
  });
}

export function useHistoricoPolo(poloId: number | null) {
  return useQuery({
    queryKey: ["patrimonio-polo", poloId],
    queryFn: async (): Promise<EmprestimoBem[]> => {
      const lista = await apiGet<EmprestimoBem[] | null>(
        ApiRotas.patrimonioHistoricoPolo(poloId!),
      );
      return lista ?? [];
    },
    enabled: poloId != null,
  });
}
