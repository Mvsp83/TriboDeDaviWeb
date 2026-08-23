// Modelos de conteúdo de cada tipo de documento oficial. O conteúdo é
// serializado em JSON no campo `conteudo` do DocumentoOficial.

export interface OficioConteudo {
  local: string;
  destinatario: string; // "A/C ..."
  saudacao: string;
  corpo: string;
  fecho: string;
  assinante: string;
  cargo: string;
}

export interface ReciboConteudo {
  local: string;
  pagador: string;
  documentoPagador: string; // CPF/CNPJ de quem pagou (opcional)
  valor: number;
  valorExtenso: string;
  referente: string;
  assinante: string; // quem recebe / emite
  documentoAssinante: string; // CPF/CNPJ do emitente (opcional)
}

export const OFICIO_DEFAULT: OficioConteudo = {
  local: "Blumenau (SC)",
  destinatario: "",
  saudacao: "Para você, nosso(a) amigo(a) e apoiador(a).",
  corpo: "",
  fecho:
    "Sendo o que tínhamos para o momento, agradecemos a atenção dispensada e nos colocamos à disposição para dirimir quaisquer dúvidas que surgirem.\n\nAtenciosamente,",
  assinante: "Valdeci da Silva",
  cargo: "Presidente",
};

export const RECIBO_DEFAULT: ReciboConteudo = {
  local: "Blumenau (SC)",
  pagador: "",
  documentoPagador: "",
  valor: 0,
  valorExtenso: "",
  referente: "",
  assinante: "Instituto Tribo de Davi",
  documentoAssinante: "",
};

// Tipo do recibo emitido pelo fluxo de Doações (numeração própria). O conteúdo
// tem outro formato (dados do doador), tratado à parte no PDF; não é editável
// nesta tela (nasce aprovado a partir da doação).
export const TIPO_RECIBO_DOACAO = 2;

// Recibo comum (1) e recibo de doação (2) são ambos "recibos" para filtro e
// layout base. Este helper evita repetir a checagem (PDF, editor, filtro).
export const ehRecibo = (tipo: number) => tipo === 1 || tipo === TIPO_RECIBO_DOACAO;

// Conteúdo do recibo de doação (formato gravado pelo DoacaoService).
export interface ReciboDoacaoConteudo {
  doadorNome: string;
  doadorDocumento: string;
  doadorEndereco: string;
  doadorCidade: string;
  valor: number;
  data: string;
  forma: string;
  finalidade: string;
}

export const TIPO_DOC_LABEL: Record<number, string> = {
  0: "Ofício",
  1: "Recibo",
  // Tipo 2: recibo emitido a partir de uma doação (fluxo Doações), com
  // numeração própria. Aparece aqui junto dos demais documentos oficiais.
  2: "Recibo de doação",
};
