import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, http, toApiError, ApiError } from "@/lib/api";
import type { ResultViewModel } from "@/lib/api";
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
    // Normaliza o erro para ApiError, expondo a mensagem real da API (ex.: 413
    // arquivo grande, categoria inválida) em vez de um erro genérico.
    mutationFn: async (arquivo: File) => {
      const form = new FormData();
      form.append("arquivo", arquivo);
      try {
        const { data } = await http.post<ResultViewModel<unknown>>(
          ApiRotas.documentoContabilUpload(categoria),
          form,
        );
        if (data && data.success === false) {
          throw new ApiError(data.message ?? "Falha ao enviar o documento.");
        }
      } catch (error) {
        throw toApiError(error);
      }
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
