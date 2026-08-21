import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Aviso } from "@/types";

// Avisos pendentes do usuário logado (mostrados no popup ao entrar).
export function useAvisosPendentes(habilitado: boolean) {
  return useQuery({
    queryKey: ["avisos", "pendentes"],
    enabled: habilitado,
    staleTime: 0,
    queryFn: async (): Promise<Aviso[]> => {
      const lista = await apiGet<Aviso[] | null>(ApiRotas.avisosPendentes);
      return lista ?? [];
    },
  });
}

export function useMarcarCiente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (avisoId: number) => apiPost(ApiRotas.avisoCiente(avisoId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["avisos", "pendentes"] }),
  });
}

// Gestão (admin).
export function useAvisos() {
  return useQuery({
    queryKey: ["avisos", "todos"],
    queryFn: async (): Promise<Aviso[]> => {
      const lista = await apiGet<Aviso[] | null>(ApiRotas.avisosGetAll);
      return lista ?? [];
    },
  });
}

export function useCriarAviso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (aviso: { titulo: string; mensagem: string; publicoAlvo: number }) =>
      apiPost(ApiRotas.avisoCreate, { ...aviso, ativo: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["avisos"] }),
  });
}

export function useExcluirAviso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.avisoDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["avisos"] }),
  });
}
