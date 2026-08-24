// Padrão dos documentos exportados (cabeçalho, rodapé, marca). É a "casca"
// aplicada a todos os PDFs — planos, relatórios, etc. O conteúdo muda, o padrão
// não. Configurável na tela "Padrão de Documentos".
//
// Guardado em localStorage (a API .NET não tem endpoint para isto, mesmo caso
// do módulo Financeiro). Limitação: fica no navegador de quem configura; para
// compartilhar entre dispositivos seria preciso um endpoint na API.

// Textos-padrão do ofício (o que já vem preenchido ao criar um novo ofício).
export interface PadraoOficio {
  saudacao: string;
  fecho: string;
  assinante: string;
  cargo: string;
}

// Textos-padrão do recibo (quem emite/assina).
export interface PadraoRecibo {
  assinante: string;
}

// Textos fixos do certificado de graduação (o miolo é gerado da graduação).
export interface PadraoCertificado {
  titulo: string;
  subtitulo: string;
  assinaturaEsquerda: string;
  assinaturaDireita: string;
}

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
  // Textos-padrão por tipo de documento (editáveis na tela Padrão de Documentos).
  oficio: PadraoOficio;
  recibo: PadraoRecibo;
  certificado: PadraoCertificado;
}

export const PADRAO_DEFAULT: DocumentoPadrao = {
  tituloCabecalho: "INSTITUTO TRIBO DE DAVI",
  linhaExtra: "",
  textoRodape: "Instituto Tribo de Davi",
  mostrarLogo: true,
  mostrarDataGeracao: true,
  oficio: {
    saudacao: "Para você, nosso(a) amigo(a) e apoiador(a).",
    fecho:
      "Sendo o que tínhamos para o momento, agradecemos a atenção dispensada e nos colocamos à disposição para dirimir quaisquer dúvidas que surgirem.\n\nAtenciosamente,",
    assinante: "Valdeci da Silva",
    cargo: "Presidente",
  },
  recibo: {
    assinante: "Instituto Tribo de Davi",
  },
  certificado: {
    titulo: "Certificado de Graduação",
    subtitulo: "Projeto Jiu-Jitsu — Tribo de Davi",
    assinaturaEsquerda: "Professor responsável",
    assinaturaDireita: "Instituto Tribo de Davi",
  },
};

const KEY = "tribo-documento-padrao";

// Mescla defendendo os blocos aninhados: config antiga (sem oficio/recibo/
// certificado) ou parcial cai nos defaults campo a campo, sem virar undefined.
export function mesclarPadrao(parcial: Partial<DocumentoPadrao> | null | undefined): DocumentoPadrao {
  const p = parcial ?? {};
  return {
    ...PADRAO_DEFAULT,
    ...p,
    oficio: { ...PADRAO_DEFAULT.oficio, ...p.oficio },
    recibo: { ...PADRAO_DEFAULT.recibo, ...p.recibo },
    certificado: { ...PADRAO_DEFAULT.certificado, ...p.certificado },
  };
}

export function carregarDocumentoPadrao(): DocumentoPadrao {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? mesclarPadrao(JSON.parse(raw) as Partial<DocumentoPadrao>) : PADRAO_DEFAULT;
  } catch {
    return PADRAO_DEFAULT;
  }
}

export function salvarDocumentoPadrao(cfg: DocumentoPadrao): void {
  localStorage.setItem(KEY, JSON.stringify(cfg));
}
