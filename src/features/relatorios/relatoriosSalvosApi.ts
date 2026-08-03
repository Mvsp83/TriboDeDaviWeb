import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { RelatorioSalvo } from "@/types";

export function useMeusRelatorios() {
  return useQuery({
    queryKey: ["relatorios-salvos"],
    queryFn: () => apiGet<RelatorioSalvo[]>(ApiRotas.relatoriosMeus),
  });
}

export function useCriarRelatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: RelatorioSalvo) => apiPost(ApiRotas.relatorioCreate, r),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["relatorios-salvos"] }),
  });
}

export function useExcluirRelatorio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.relatorioDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["relatorios-salvos"] }),
  });
}
