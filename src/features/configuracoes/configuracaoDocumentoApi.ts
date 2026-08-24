import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import {
  carregarDocumentoPadrao,
  salvarDocumentoPadrao,
  mesclarPadrao,
  type DocumentoPadrao,
} from "@/lib/documentoPadrao";

// O padrão de documentos agora vive na API (compartilhado entre todos). O
// localStorage vira um cache SÍNCRONO: a exportação de PDF (impressaoDocumento)
// lê dele sem await. Toda leitura/gravação na API espelha para o cache.

// A API guarda os campos do cabeçalho/rodapé tipados + os textos-padrão por tipo
// (ofício/recibo/certificado) num único JSON (textosPadraoJson). Aqui traduzimos
// esse formato de/para o DocumentoPadrao (que usa objetos) na fronteira.
interface DocumentoPadraoApi {
  tituloCabecalho: string;
  linhaExtra: string;
  textoRodape: string;
  mostrarLogo: boolean;
  mostrarDataGeracao: boolean;
  textosPadraoJson?: string | null;
}

function daApi(api: Partial<DocumentoPadraoApi>): DocumentoPadrao {
  let textos: Partial<Pick<DocumentoPadrao, "oficio" | "recibo" | "certificado">> = {};
  try {
    if (api.textosPadraoJson) textos = JSON.parse(api.textosPadraoJson);
  } catch {
    textos = {};
  }
  return mesclarPadrao({
    tituloCabecalho: api.tituloCabecalho,
    linhaExtra: api.linhaExtra,
    textoRodape: api.textoRodape,
    mostrarLogo: api.mostrarLogo,
    mostrarDataGeracao: api.mostrarDataGeracao,
    ...textos,
  });
}

function paraApi(cfg: DocumentoPadrao): DocumentoPadraoApi {
  return {
    tituloCabecalho: cfg.tituloCabecalho,
    linhaExtra: cfg.linhaExtra,
    textoRodape: cfg.textoRodape,
    mostrarLogo: cfg.mostrarLogo,
    mostrarDataGeracao: cfg.mostrarDataGeracao,
    textosPadraoJson: JSON.stringify({
      oficio: cfg.oficio,
      recibo: cfg.recibo,
      certificado: cfg.certificado,
    }),
  };
}

// GET /obter — fonte da verdade. Ao carregar, atualiza o cache local para que
// as exportações usem o valor compartilhado mais recente.
export function useDocumentoPadraoRemoto() {
  return useQuery({
    queryKey: ["documento-padrao"],
    queryFn: async (): Promise<DocumentoPadrao> => {
      const bruto = await apiGet<Partial<DocumentoPadraoApi>>(ApiRotas.configDocumentoObter);
      const cfg = daApi(bruto);
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
      apiPut(ApiRotas.configDocumentoSalvar, paraApi(cfg)),
    onSuccess: (_r, cfg) => {
      salvarDocumentoPadrao(cfg);
      qc.invalidateQueries({ queryKey: ["documento-padrao"] });
    },
  });
}
