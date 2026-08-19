import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as store from "./financeiroStore";
import type { ContaFinanceira } from "./tipos";

const CHAVE_CONTAS = ["financeiro", "contas"] as const;
const CHAVE_MOVS = ["financeiro", "movimentacoes"] as const;

export function useContas() {
  return useQuery({
    queryKey: CHAVE_CONTAS,
    queryFn: () => store.listarContas(),
  });
}

export function useSalvarConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conta: Omit<ContaFinanceira, "id"> & { id?: number }) =>
      store.salvarConta(conta),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE_CONTAS }),
  });
}

export function useExcluirConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => store.excluirConta(id),
    onSuccess: () => {
      // Excluir uma conta também remove seus lançamentos.
      qc.invalidateQueries({ queryKey: CHAVE_CONTAS });
      qc.invalidateQueries({ queryKey: CHAVE_MOVS });
    },
  });
}
