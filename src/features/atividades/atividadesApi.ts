import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Atividade } from "@/types";

export function useAtividades() {
  return useQuery({
    queryKey: ["atividades"],
    queryFn: () => apiGet<Atividade[]>(ApiRotas.atividadesGetAll),
  });
}

function montarBody(a: Partial<Atividade>, id: number) {
  return {
    id,
    nome: a.nome ?? "",
    tipo: a.tipo ?? 1,
    descricao: a.descricao ?? "",
    tags: a.tags ?? "",
    principio: a.principio ?? "",
    referenciaBiblica: a.referenciaBiblica ?? "",
    videoUrl: a.videoUrl ?? "",
  };
}

export function useSalvarAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: Partial<Atividade>) =>
      a.id
        ? apiPut(ApiRotas.atividadeUpdate, montarBody(a, a.id))
        : apiPost(ApiRotas.atividadeCreate, montarBody(a, 0)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atividades"] }),
  });
}

export function useExcluirAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.atividadeDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atividades"] }),
  });
}
