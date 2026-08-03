import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, http } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { CategoriaDocumento, DocumentoArquivo } from "@/types";

export function useDocumentos(categoria: CategoriaDocumento) {
  return useQuery({
    queryKey: ["documentos-contabeis", categoria],
    queryFn: () =>
      apiGet<DocumentoArquivo[]>(ApiRotas.documentoContabilListar(categoria)),
  });
}

export function useUploadDocumento(categoria: CategoriaDocumento) {
  const qc = useQueryClient();
  return useMutation({
    // Upload é multipart, então usa o axios http direto (não o apiPost JSON).
    mutationFn: async (arquivo: File) => {
      const form = new FormData();
      form.append("arquivo", arquivo);
      await http.post(ApiRotas.documentoContabilUpload(categoria), form);
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["documentos-contabeis", categoria] }),
  });
}

export function useExcluirDocumento(categoria: CategoriaDocumento) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) =>
      apiDelete(ApiRotas.documentoContabilExcluir(fileId)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["documentos-contabeis", categoria] }),
  });
}

// Download binário: baixa como blob e dispara o save no navegador.
export async function baixarDocumento(fileId: string, nome: string) {
  const { data } = await http.get<Blob>(
    ApiRotas.documentoContabilDownload(fileId),
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
