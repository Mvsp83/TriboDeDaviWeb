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

export const TIPO_DOC_LABEL: Record<number, string> = {
  0: "Ofício",
  1: "Recibo",
};
