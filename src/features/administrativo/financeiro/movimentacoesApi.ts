import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as store from "./financeiroStore";
import type { MovimentacaoFinanceira } from "./tipos";

const CHAVE_MOVS = ["financeiro", "movimentacoes"] as const;

export function useMovimentacoes() {
  return useQuery({
    queryKey: CHAVE_MOVS,
    queryFn: () => store.listarMovimentacoes(),
  });
}

export function useSalvarMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      mov: Omit<MovimentacaoFinanceira, "id"> & { id?: number },
    ) => store.salvarMovimentacao(mov),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE_MOVS }),
  });
}

export function useExcluirMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => store.excluirMovimentacao(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE_MOVS }),
  });
}

export function useDefinirConciliacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, conciliado }: { id: number; conciliado: boolean }) =>
      store.definirConciliacao(id, conciliado),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE_MOVS }),
  });
}
