import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { ModeloDeAula } from "@/types";

export function useModelos() {
  return useQuery({
    queryKey: ["modelos"],
    queryFn: () => apiGet<ModeloDeAula[]>(ApiRotas.modelosGetAll),
  });
}

export function useModelo(id: number | undefined) {
  return useQuery({
    queryKey: ["modelo", id],
    enabled: id != null,
    queryFn: () => apiGet<ModeloDeAula>(ApiRotas.modeloGet(id!)),
  });
}

export function useSalvarModelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: ModeloDeAula) =>
      m.id
        ? apiPut(ApiRotas.modeloUpdate, m)
        : apiPost(ApiRotas.modeloCreate, { ...m, id: 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modelos"] }),
  });
}

export function useExcluirModelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.modeloDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modelos"] }),
  });
}
