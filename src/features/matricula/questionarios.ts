// Questionários da ficha de inscrição.
//
// Separação proposital em dois blocos:
//
// 1. APTIDÃO (PAR-Q) — é o Anexo I da Lei 16.331/2014 (SC), reproduzido ao pé
//    da letra. É ele que dispensa o exame médico para a prática amadora, e
//    precisa ser renovado a cada ano (por isso acompanha a matrícula anual).
//    Qualquer resposta "sim" exige o Termo de Responsabilidade do Anexo II.
//
// 2. FICHA DE SAÚDE — perguntas que o instituto usa no dia a dia (alergia,
//    medicamento, acompanhamento). NÃO fazem parte da exigência legal; estão
//    aqui porque ajudam o professor na aula.
//
// As perguntas de gravidez, tabagismo e álcool do formulário antigo foram
// retiradas: não constam da lei e não fazem sentido numa ficha de criança.

export const VERSAO_TERMOS = "2026.1";

// ── 1. Anexo I da Lei 16.331/2014 — texto literal ────────────────────────
export interface PerguntaParq {
  id: string;
  texto: string;
}

export const PARQ: PerguntaParq[] = [
  {
    id: "p1",
    texto:
      "Seu médico já mencionou alguma vez que você tem uma condição cardíaca e que você só deve realizar atividade física recomendada por um médico?",
  },
  {
    id: "p2",
    texto: "Você sente dor no tórax quando realiza atividade física?",
  },
  {
    id: "p3",
    texto:
      "No mês passado, você teve dor torácica quando não estava realizando atividade física?",
  },
  {
    id: "p4",
    texto:
      "Você perdeu o equilíbrio por causa de tontura ou alguma vez perdeu a consciência?",
  },
  {
    id: "p5",
    texto:
      "Você tem algum problema ósseo ou de articulação que poderia piorar em consequência de uma alteração em sua atividade física?",
  },
  {
    id: "p6",
    texto:
      "Seu médico está prescrevendo medicamentos para sua pressão ou condição cardíaca?",
  },
  {
    id: "p7",
    texto:
      "Sabe de qualquer outra razão pela qual você não deve praticar atividade física?",
  },
];

// Texto do Anexo II, exigido quando há qualquer "sim" no questionário acima.
export const TERMO_RESPONSABILIDADE =
  "Ciente de que é recomendável conversar com um médico antes de aumentar meu " +
  "nível atual de atividade física e, em razão de ter respondido “sim” a uma ou " +
  "mais das perguntas constantes do Questionário de Aptidão para Prática de " +
  "Atividade Física, declaro que assumo inteira e irrestrita responsabilidade " +
  "por qualquer atividade física praticada sem o atendimento a esta recomendação.";

// ── 2. Ficha de saúde (uso interno, não exigida por lei) ─────────────────
export const CONDICOES = [
  "Doença ou problemas cardíacos",
  "Epilepsia",
  "Hipertensão",
  "Doença pulmonar",
  "Diabetes",
  "Asma / bronquite",
  "Alergia",
];

export const SINTOMAS = [
  "Dor nas costas",
  "Dor nas articulações, tendões ou músculo",
];

export const ACOMPANHAMENTOS = [
  "Psicólogo",
  "Fonoaudiólogo",
  "Neurologista",
  "Psiquiatra",
  "Ortopedista",
];

// ── 3. Pesquisa familiar ─────────────────────────────────────────────────
export const SITUACOES_CONJUGAIS = ["Casados", "Separados/Divorciados", "Outro"];

export const MOTIVOS_MATRICULA = [
  "Lugar com regras e disciplina",
  "Interesse da criança ou adolescente",
  "Inclusão",
  "Ocupar o tempo",
  "Indicação médica",
  "Socialização",
];

export const OBJETIVOS = [
  "Competição",
  "Autoconfiança",
  "Recomendação médica",
  "Melhorar a condição física",
  "Defesa pessoal",
  "Disciplina, concentração",
  "Hábitos saudáveis",
];

// ── Estruturas guardadas em JSON na inscrição ────────────────────────────
export interface RespostasSaude {
  // Anexo I: id da pergunta -> true (sim) / false (não).
  parq: Record<string, boolean>;
  // Aceite do Anexo II, quando houve algum "sim".
  aceitouTermoResponsabilidade: boolean;
  condicoes: string[];
  condicaoOutra: string;
  sintomas: string[];
  medicamentos: string;
  acompanhamentos: string[];
  acompanhamentoOutro: string;
  objetivos: string[];
}

export interface RespostasFamiliar {
  situacaoConjugal: string;
  situacaoConjugalOutro: string;
  pessoasNaCasa: string;
  motivos: string[];
}

export const respostasSaudeVazias = (): RespostasSaude => ({
  parq: {},
  aceitouTermoResponsabilidade: false,
  condicoes: [],
  condicaoOutra: "",
  sintomas: [],
  medicamentos: "",
  acompanhamentos: [],
  acompanhamentoOutro: "",
  objetivos: [],
});

export const respostasFamiliarVazias = (): RespostasFamiliar => ({
  situacaoConjugal: "",
  situacaoConjugalOutro: "",
  pessoasNaCasa: "",
  motivos: [],
});

// Houve algum "sim" no Anexo I? É o que exige o Termo de Responsabilidade.
export function temSimNoParq(r: RespostasSaude): boolean {
  return PARQ.some((p) => r.parq[p.id] === true);
}

// Todas as 7 perguntas precisam de resposta — não existe "em branco" no Anexo I.
export function parqCompleto(r: RespostasSaude): boolean {
  return PARQ.every((p) => typeof r.parq[p.id] === "boolean");
}
