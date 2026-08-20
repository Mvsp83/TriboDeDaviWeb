// Padrão dos documentos exportados (cabeçalho, rodapé, marca). É a "casca"
// aplicada a todos os PDFs — planos, relatórios, etc. O conteúdo muda, o padrão
// não. Configurável na tela "Padrão de Documentos".
//
// Guardado em localStorage (a API .NET não tem endpoint para isto, mesmo caso
// do módulo Financeiro). Limitação: fica no navegador de quem configura; para
// compartilhar entre dispositivos seria preciso um endpoint na API.

export interface DocumentoPadrao {
  // Nome no topo do documento (papel timbrado). Ex.: "INSTITUTO TRIBO DE DAVI".
  tituloCabecalho: string;
  // Linha extra opcional no cabeçalho (ex.: endereço, CNPJ, contato).
  linhaExtra: string;
  // Texto à esquerda do rodapé.
  textoRodape: string;
  // Mostrar o logo do instituto no cabeçalho.
  mostrarLogo: boolean;
  // Mostrar "Gerado em <data/hora>" no rodapé.
  mostrarDataGeracao: boolean;
}

export const PADRAO_DEFAULT: DocumentoPadrao = {
  tituloCabecalho: "INSTITUTO TRIBO DE DAVI",
  linhaExtra: "",
  textoRodape: "Instituto Tribo de Davi",
  mostrarLogo: true,
  mostrarDataGeracao: true,
};

const KEY = "tribo-documento-padrao";

export function carregarDocumentoPadrao(): DocumentoPadrao {
  try {
    const raw = localStorage.getItem(KEY);
    return raw
      ? { ...PADRAO_DEFAULT, ...(JSON.parse(raw) as Partial<DocumentoPadrao>) }
      : PADRAO_DEFAULT;
  } catch {
    return PADRAO_DEFAULT;
  }
}

export function salvarDocumentoPadrao(cfg: DocumentoPadrao): void {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}
