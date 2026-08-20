import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import {
  carregarDocumentoPadrao,
  salvarDocumentoPadrao,
  type DocumentoPadrao,
} from "@/lib/documentoPadrao";

// O padrão de documentos agora vive na API (compartilhado entre todos). O
// localStorage vira um cache SÍNCRONO: a exportação de PDF (impressaoDocumento)
// lê dele sem await. Toda leitura/gravação na API espelha para o cache.

// GET /obter — fonte da verdade. Ao carregar, atualiza o cache local para que
// as exportações usem o valor compartilhado mais recente.
export function useDocumentoPadraoRemoto() {
  return useQuery({
    queryKey: ["documento-padrao"],
    queryFn: async (): Promise<DocumentoPadrao> => {
      const cfg = await apiGet<DocumentoPadrao>(ApiRotas.configDocumentoObter);
      salvarDocumentoPadrao(cfg); // espelha no cache síncrono
      return cfg;
    },
    // Mostra o cache instantaneamente, mas busca o valor compartilhado ao montar
    // (initialData + staleTime 0 força o refetch em vez de considerar fresco).
    initialData: carregarDocumentoPadrao,
    staleTime: 0,
    // Se a API ainda não tem o endpoint (migration pendente), cai no cache.
    retry: false,
  });
}

// PUT /salvar (só Administrador). Atualiza o cache no sucesso.
export function useSalvarDocumentoPadrao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cfg: DocumentoPadrao) =>
      apiPut(ApiRotas.configDocumentoSalvar, cfg),
    onSuccess: (_r, cfg) => {
      salvarDocumentoPadrao(cfg);
      qc.invalidateQueries({ queryKey: ["documento-padrao"] });
    },
  });
}
