import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  http,
  ApiError,
  type ResultViewModel,
} from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Recado } from "@/types";

// Envia a foto do recado (multipart) e devolve o id do storage.
export async function uploadRecadoFoto(file: File): Promise<string> {
  const form = new FormData();
  form.append("arquivo", file);
  const { data } = await http.post<ResultViewModel<{ fotoArquivoId: string }>>(
    ApiRotas.recadoFotoUpload,
    form,
  );
  if (data && data.success === false)
    throw new ApiError(data.message ?? "Falha ao enviar a foto.");
  return data?.data?.fotoArquivoId ?? "";
}

// Miniatura (data URI) da foto de um recado. String vazia = sem foto.
export async function obterRecadoFoto(id: number): Promise<string> {
  try {
    const d = await apiGet<{ dataUri: string } | null>(ApiRotas.recadoFoto(id));
    return d?.dataUri ?? "";
  } catch {
    return "";
  }
}

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
  fotoArquivoId?: string;
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
