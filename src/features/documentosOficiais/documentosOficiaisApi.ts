import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { DocumentoOficial } from "@/types";

export function useDocumentosOficiais(ano: number) {
  return useQuery({
    queryKey: ["documentos-oficiais", ano],
    queryFn: async (): Promise<DocumentoOficial[]> => {
      const lista = await apiGet<DocumentoOficial[] | null>(
        ApiRotas.docOficialPorAno(ano),
      );
      return lista ?? [];
    },
  });
}

export function useAnosDocumentos() {
  return useQuery({
    queryKey: ["documentos-oficiais", "anos"],
    queryFn: async (): Promise<number[]> => {
      const anos = await apiGet<number[] | null>(ApiRotas.docOficialAnos);
      return anos ?? [];
    },
  });
}

export function useDocumentoOficial(id: number | undefined) {
  return useQuery({
    queryKey: ["documento-oficial", id],
    enabled: id != null,
    queryFn: () => apiGet<DocumentoOficial>(ApiRotas.docOficialGet(id!)),
  });
}

export function useSalvarDocumentoOficial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (doc: Partial<DocumentoOficial>) =>
      doc.id
        ? apiPut<DocumentoOficial>(ApiRotas.docOficialUpdate, doc)
        : apiPost<DocumentoOficial>(ApiRotas.docOficialCreate, doc),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["documentos-oficiais"] }),
  });
}

export function useExcluirDocumentoOficial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.docOficialDelete(id)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["documentos-oficiais"] }),
  });
}

export function useAprovarDocumentoOficial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiPost<DocumentoOficial>(ApiRotas.docOficialAprovar(id)),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: ["documentos-oficiais"] });
      qc.invalidateQueries({ queryKey: ["documento-oficial", id] });
    },
  });
}
