import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Recado } from "@/types";

// Mural (vigentes) — visível a quem está logado, inclusive o portal.
export function useMural(habilitado = true) {
  return useQuery({
    queryKey: ["recados", "mural"],
    enabled: habilitado,
    queryFn: async (): Promise<Recado[]> => {
      const lista = await apiGet<Recado[] | null>(ApiRotas.recadosMural);
      return lista ?? [];
    },
  });
}

// Gestão da equipe — todos (inclui expirados/inativos).
export function useRecadosGerenciar(habilitado = true) {
  return useQuery({
    queryKey: ["recados", "gerenciar"],
    enabled: habilitado,
    queryFn: async (): Promise<Recado[]> => {
      const lista = await apiGet<Recado[] | null>(ApiRotas.recadosGerenciar);
      return lista ?? [];
    },
  });
}

export type RecadoForm = {
  id?: number;
  titulo: string;
  descricao: string;
  categoria: number;
  anunciante: string;
  contato: string;
  expiraEm?: string | null;
  ativo?: boolean;
};

export function useSalvarRecado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: RecadoForm) =>
      r.id
        ? apiPut(ApiRotas.recadoUpdate, { ...r, ativo: r.ativo ?? true })
        : apiPost(ApiRotas.recadoCreate, { ...r, ativo: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recados"] }),
  });
}

export function useExcluirRecado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.recadoDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recados"] }),
  });
}
