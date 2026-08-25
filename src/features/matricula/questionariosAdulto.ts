// Questionário da ficha de inscrição de ADULTOS.
//
// Reaproveita o PAR-Q (Anexo I da Lei 16.331/2014) e o Termo de
// Responsabilidade já definidos em questionarios.ts — a decisão do projeto é
// manter o texto legal do app para os dois públicos.
//
// Aqui ficam só os campos EXTRAS que a ficha de adulto tem além da infantil
// (e que foram retirados da ficha de criança por não fazerem sentido lá):
// gravidez, tabagismo, álcool, depressão, restrição médica, histórico
// familiar cardíaco, e "Câncer" na lista de doenças.

import type { RespostasSaude } from "@/features/matricula/questionarios";
import { CONDICOES, OBJETIVOS } from "@/features/matricula/questionarios";

// Doenças: a lista da criança + Câncer (presente na ficha de adulto).
export const CONDICOES_ADULTO = [...CONDICOES, "Câncer"];

// Objetivos: a ficha de adulto acrescenta "Perder peso".
export const OBJETIVOS_ADULTO = ["Perder peso", ...OBJETIVOS];

// Perguntas Sim/Não específicas do adulto (além do PAR-Q).
export interface PerguntaSimNao {
  id: keyof RespostasAdultoExtra;
  texto: string;
}

export const PERGUNTAS_ADULTO: PerguntaSimNao[] = [
  {
    id: "parenteCardiaco",
    texto:
      "Algum parente próximo (pai, mãe, irmão ou irmã) teve ataque cardíaco ou outro problema relacionado ao coração?",
  },
  {
    id: "restricaoMedica",
    texto:
      "Algum médico já disse que você tinha alguma restrição à prática de atividade física?",
  },
  { id: "gravida", texto: "Está grávida?" },
  { id: "fumante", texto: "Fumante?" },
  { id: "alcool", texto: "Ingere bebidas alcoólicas?" },
  { id: "depressao", texto: "Já teve algum episódio importante de depressão?" },
];

// Campos extras do adulto, guardados junto das respostas de saúde (no mesmo
// respostasSaudeJson enviado à API). null = ainda não respondido.
export interface RespostasAdultoExtra {
  parenteCardiaco: boolean | null;
  restricaoMedica: boolean | null;
  gravida: boolean | null;
  fumante: boolean | null;
  alcool: boolean | null;
  depressao: boolean | null;
}

// A ficha de saúde completa do adulto = a base (PAR-Q + doenças + etc.) mais os
// extras acima. Vai serializada em respostasSaudeJson.
export type RespostasSaudeAdulto = RespostasSaude & RespostasAdultoExtra;

export const respostasAdultoExtraVazias = (): RespostasAdultoExtra => ({
  parenteCardiaco: null,
  restricaoMedica: null,
  gravida: null,
  fumante: null,
  alcool: null,
  depressao: null,
});

// Todas as perguntas Sim/Não do adulto foram respondidas?
export function perguntasAdultoCompletas(r: RespostasAdultoExtra): boolean {
  return PERGUNTAS_ADULTO.every((p) => typeof r[p.id] === "boolean");
}
