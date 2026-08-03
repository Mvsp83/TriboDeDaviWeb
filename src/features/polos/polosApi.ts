import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Polo } from "@/types";

export function usePolos() {
  return useQuery({
    queryKey: ["polos"],
    queryFn: () => apiGet<Polo[]>(ApiRotas.polos),
  });
}

// A API rejeita campos nulos: normaliza para string vazia antes de enviar.
function montarBody(polo: Partial<Polo>, incluirId: boolean) {
  const base = {
    nome: polo.nome ?? "",
    informacoes: polo.informacoes ?? "",
    endereco: polo.endereco ?? "",
    bairro: polo.bairro ?? "",
    cidade: polo.cidade ?? "",
  };
  return incluirId ? { id: polo.id, ...base } : base;
}

export function useSalvarPolo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (polo: Partial<Polo>) =>
      polo.id
        ? apiPut(ApiRotas.poloUpdate, montarBody(polo, true))
        : apiPost(ApiRotas.poloCreate, montarBody(polo, false)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["polos"] }),
  });
}

export function useExcluirPolo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.poloDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["polos"] }),
  });
}
