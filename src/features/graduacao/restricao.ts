// Helpers para o vínculo posição ↔ golpe restrito: acha o golpe e resume em
// que divisões de idade/faixa a técnica é proibida.
import { faixaInfo } from "@/features/alunos/faixa";
import {
  type ConfigGraduacao,
  type GolpeRestrito,
  type Posicao,
  type FaixaEtaria,
  DIVISOES,
  SEVERIDADE_LABEL,
} from "./tipos";

export function acharGolpe(
  cfg: ConfigGraduacao | undefined,
  id: string | null | undefined,
): GolpeRestrito | undefined {
  if (!cfg || !id) return undefined;
  return cfg.golpesRestritos.find((g) => g.id === id);
}

export interface CelulaRestricao {
  curto: string;
  label: string;
  severidade: string;
}

// Divisões em que o golpe é restrito (severidade diferente de "normal"),
// na ordem oficial.
export function divisoesRestritas(golpe: GolpeRestrito): CelulaRestricao[] {
  return DIVISOES.filter(
    (d) => (golpe.severidadePorDivisao[d.id] ?? "normal") !== "normal",
  ).map((d) => ({
    curto: d.curto,
    label: d.label,
    severidade: golpe.severidadePorDivisao[d.id],
  }));
}

// Texto curto do tipo "Proibido: 4–12, 13–15 — Falta gravíssima". Vazio quando
// não há restrição.
export function textoRestricao(golpe: GolpeRestrito): string {
  const cels = divisoesRestritas(golpe);
  if (cels.length === 0) return "";
  const severidades = new Set(cels.map((c) => c.severidade));
  if (severidades.size === 1) {
    const sev = SEVERIDADE_LABEL[cels[0].severidade];
    return `Proibido: ${cels.map((c) => c.curto).join(", ")} — ${sev}`;
  }
  return `Proibido: ${cels
    .map((c) => `${c.curto} (${SEVERIDADE_LABEL[c.severidade]})`)
    .join(", ")}`;
}

// Divisão IBJJF correspondente a uma faixa etária (pela idade). Para adulto
// (18+) devolve d4, já que a coluna exata depende de gi/no-gi.
export function divisaoDaFaixaEtaria(
  fe: FaixaEtaria | null | undefined,
): string | null {
  if (!fe) return null;
  const idade = fe.idadeMax ?? fe.idadeMin;
  if (idade == null) return null;
  if (idade <= 12) return "d1";
  if (idade <= 15) return "d2";
  if (idade <= 17) return "d3";
  return "d4";
}

// Avisos (não bloqueantes) para o uso de uma posição num requisito de uma
// faixa: adequação de faixa (recomendada) e proibição IBJJF pela idade.
export function avisosPosicao(
  posicao: Posicao | null | undefined,
  faixaBase: number,
  faixaEtaria: FaixaEtaria | null | undefined,
  golpe: GolpeRestrito | undefined,
): string[] {
  const avisos: string[] = [];
  if (!posicao) return avisos;

  if (posicao.faixaRecomendada != null && posicao.faixaRecomendada > faixaBase) {
    avisos.push(
      `Recomendada a partir da faixa ${faixaInfo(posicao.faixaRecomendada).nome}`,
    );
  }

  if (golpe) {
    const div = divisaoDaFaixaEtaria(faixaEtaria);
    if (div) {
      const sev = golpe.severidadePorDivisao[div];
      if (sev && sev !== "normal") {
        avisos.push(`Proibido para ${faixaEtaria!.label} (${SEVERIDADE_LABEL[sev]})`);
      }
    }
  }

  return avisos;
}
