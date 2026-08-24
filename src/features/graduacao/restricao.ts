// Helpers para o vínculo posição ↔ golpe restrito: acha o golpe e resume em
// que divisões de idade/faixa a técnica é proibida.
import {
  type ConfigGraduacao,
  type GolpeRestrito,
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
