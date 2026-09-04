// Conteúdo da página pública de Transparência e Impacto (/transparencia).
// É a "prova de impacto voltada pra fora" — o que doadores, parceiros e editais
// veem sobre o projeto. Tudo aqui é CURADO (revisado antes de publicar), em vez
// de puxado ao vivo dos dados internos: os números passam pela conferência da
// coordenação e nenhum dado de criança aparece.
//
// >>> OS CAMPOS MARCADOS COM "PREENCHER"/"AJUSTE" SÃO EDITÁVEIS. <<<
// Onde a informação fica vazia (0 ou lista vazia), a seção simplesmente não
// aparece — nada é inventado.
//
// DICA: os números de impacto podem ser copiados prontos da tela interna
// "Relatório de Impacto" (botão "Números para a página pública"), evitando
// digitar e recalcular à mão.

export interface LinhaValor {
  categoria: string;
  valor: number;
}

export interface ItemDistribuicao {
  nome: string;
  quantidade: number;
}

export interface DocumentoPublico {
  nome: string;
  url: string; // link do documento (PDF, Drive, etc.)
  // Ano de referência — agrupa o histórico. Ausente/0 = vai em "Outros documentos".
  ano?: number;
  // Rótulo curto do tipo (ex.: "Financeiro", "Atividades", "Legal"). Opcional.
  tipo?: string;
}

// Uma pessoa da diretoria ou do conselho fiscal.
export interface MembroGovernanca {
  nome: string;
  cargo: string;
}

export const TRANSPARENCIA = {
  // Texto de abertura da página. Ajuste à vontade.
  intro:
    "Acreditamos que confiança se constrói com transparência. Aqui você encontra o alcance do nosso trabalho e para onde vão os recursos que mantêm as aulas gratuitas.",

  // Identificação legal do instituto. Valores oficiais (do estatuto/termos) já
  // preenchidos — AJUSTE se algo mudar. Campo vazio não aparece.
  identificacao: {
    razaoSocial: "Instituto Tribo de Davi",
    cnpj: "11.407.173/0001-45",
    endereco:
      "Rua Benjamin Constant, 2323, Apto 133 — Vila Nova, Blumenau/SC, 89035-100",
    // PREENCHER: nome de quem responde legalmente pelo instituto.
    presidente: "Valdeci da Silva",
    // PREENCHER: ano de fundação (0 esconde).
    fundacao: 2013,
  },

  // Números de impacto de um ano. Copie da tela "Relatório de Impacto".
  // atendidos/polos/aulas em 0 escondem o indicador; listas vazias escondem
  // a distribuição correspondente.
  impacto: {
    ano: new Date().getFullYear(),
    atendidos: 253,
    polos: 5,
    aulas: 0,
    frequenciaMedia: 0, // 0 esconde; senão é a % média de presença
    escolas: 0, // nº de escolas de origem dos alunos (alcance)
    bairros: 0, // nº de bairros alcançados
    faixasEtarias: [] as ItemDistribuicao[],
    graduacoes: [] as ItemDistribuicao[], // por faixa (cor)
  },

  // Transparência financeira — RESUMO curado do ano (não o extrato completo).
  // Some quando receitas e despesas estão vazias.
  financeiro: {
    ano: new Date().getFullYear(),
    receitas: [] as LinhaValor[], // ex.: { categoria: "Doações Pix", valor: 12000 }
    despesas: [] as LinhaValor[], // ex.: { categoria: "Materiais de treino", valor: 8000 }
    observacao:
      "Valores consolidados do exercício. Os documentos contábeis completos estão disponíveis abaixo.",
  },

  // Governança: quem dirige e fiscaliza o instituto. Mostra que há controle
  // interno (não uma pessoa só). Listas vazias escondem a seção.
  governanca: {
    // PREENCHER: diretoria (ex.: { nome: "Fulano de Tal", cargo: "Presidente" }).
    diretoria: [] as MembroGovernanca[],
    // PREENCHER: conselho fiscal, se houver.
    conselhoFiscal: [] as MembroGovernanca[],
    // Texto opcional sobre como as contas são conferidas (contador, auditoria,
    // aprovação em assembleia). Vazio esconde a linha.
    observacao: "",
  },

  // Documentos públicos: estatuto, atas, prestação de contas, editais, certidões.
  // Agrupados por ano na exibição (mais recente primeiro). Lista vazia esconde
  // a seção. Ex.: { nome: "Prestação de contas 2025", url: "...", ano: 2025, tipo: "Financeiro" }.
  documentos: [] as DocumentoPublico[],

  // Políticas institucionais (links de PDF ou página). Fortalecem a confiança e
  // atendem à LGPD (política de privacidade publicada). Vazio esconde o item.
  politicas: {
    // PREENCHER: link da Política de Privacidade.
    politicaPrivacidade: "",
    // PREENCHER: link do Código de Ética/Conduta.
    codigoEtica: "",
  },
};

export const temIdentificacao = () => {
  const i = TRANSPARENCIA.identificacao;
  return Boolean(
    i.razaoSocial || i.cnpj || i.endereco || i.presidente || i.fundacao
  );
};

export const temImpacto = () => {
  const i = TRANSPARENCIA.impacto;
  return Boolean(i.atendidos || i.polos || i.aulas || i.frequenciaMedia);
};

export const temFinanceiro = () =>
  TRANSPARENCIA.financeiro.receitas.length > 0 ||
  TRANSPARENCIA.financeiro.despesas.length > 0;

export const temGovernanca = () =>
  TRANSPARENCIA.governanca.diretoria.length > 0 ||
  TRANSPARENCIA.governanca.conselhoFiscal.length > 0;

export const temPoliticas = () =>
  Boolean(
    TRANSPARENCIA.politicas.politicaPrivacidade ||
      TRANSPARENCIA.politicas.codigoEtica
  );
