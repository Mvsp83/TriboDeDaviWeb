// Padrão dos documentos exportados (cabeçalho, rodapé, marca). É a "casca"
// aplicada a todos os PDFs — planos, relatórios, etc. O conteúdo muda, o padrão
// não. Configurável na tela "Padrão de Documentos".
//
// Persiste na API (compartilhado entre todos) com um cache síncrono em
// localStorage para a exportação de PDF funcionar sem await. Ver
// configuracaoDocumentoApi.ts. Os campos "novos" (contato estruturado, logo
// próprio, modelo de cabeçalho) viajam dentro do JSON de textos-padrão, então
// não exigem mudança de schema na API.

// Layout do cabeçalho (papel timbrado). Aplicado por CSS em impressaoDocumento.
export type ModeloCabecalho = "classico" | "centralizado" | "minimalista";

export const MODELOS_CABECALHO: { id: ModeloCabecalho; nome: string; descricao: string }[] = [
  { id: "classico", nome: "Clássico", descricao: "Logo à esquerda, textos ao lado, régua embaixo." },
  { id: "centralizado", nome: "Centralizado", descricao: "Logo em cima e tudo centralizado." },
  { id: "minimalista", nome: "Minimalista", descricao: "Enxuto, linha fina e cores suaves." },
];

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
  // Contato estruturado — cada campo vira uma linha (ou parte de uma) no
  // cabeçalho. Preferidos sobre `linhaExtra`, que fica para linhas livres.
  endereco: string;
  telefone: string;
  email: string;
  site: string;
  cnpj: string;
  // Linhas livres adicionais do cabeçalho (uma por linha). Mantido por
  // compatibilidade e para textos que não se encaixam nos campos acima.
  linhaExtra: string;
  // Texto à esquerda do rodapé.
  textoRodape: string;
  // Mostrar a marca/logo no cabeçalho.
  mostrarLogo: boolean;
  // Mostrar "Gerado em <data/hora>" no rodapé.
  mostrarDataGeracao: boolean;
  // Logo próprio (data URL base64). Vazio = usa o símbolo padrão do instituto.
  logoDataUrl: string;
  // Modelo/layout do cabeçalho.
  modelo: ModeloCabecalho;
  // Textos-padrão por tipo de documento (editáveis na tela Padrão de Documentos).
  oficio: PadraoOficio;
  recibo: PadraoRecibo;
  certificado: PadraoCertificado;
}

export const PADRAO_DEFAULT: DocumentoPadrao = {
  tituloCabecalho: "INSTITUTO TRIBO DE DAVI",
  endereco: "",
  telefone: "",
  email: "",
  site: "",
  cnpj: "",
  linhaExtra: "",
  textoRodape: "Instituto Tribo de Davi",
  mostrarLogo: true,
  mostrarDataGeracao: true,
  logoDataUrl: "",
  modelo: "classico",
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

// Monta as linhas do cabeçalho a partir do contato estruturado + linhas livres.
// Telefone/e-mail/site ficam juntos numa linha (separados por " · "); endereço
// e CNPJ ganham linha própria.
export function linhasCabecalho(cfg: DocumentoPadrao): string[] {
  const linhas: string[] = [];
  if (cfg.endereco.trim()) linhas.push(cfg.endereco.trim());
  const contato = [cfg.telefone, cfg.email, cfg.site]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · ");
  if (contato) linhas.push(contato);
  if (cfg.cnpj.trim()) {
    linhas.push(/cnpj/i.test(cfg.cnpj) ? cfg.cnpj.trim() : `CNPJ ${cfg.cnpj.trim()}`);
  }
  cfg.linhaExtra
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((l) => linhas.push(l));
  return linhas;
}

const KEY = "tribo-documento-padrao";

// Mescla defendendo os blocos aninhados: config antiga (sem oficio/recibo/
// certificado, ou sem os campos novos) ou parcial cai nos defaults campo a
// campo, sem virar undefined.
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
