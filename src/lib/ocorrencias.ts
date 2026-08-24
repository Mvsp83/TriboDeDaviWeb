// Advertências e recados do professor sobre um aluno (aparecem no portal do
// responsável). Rótulos compartilhados entre a ficha do aluno (equipe) e o portal.

export const TIPO_OCORRENCIA = { Advertencia: 0, Recado: 1 } as const;

// Status do recado — o índice é o valor guardado (int) na API.
export const STATUS_RECADO = [
  "Evoluindo bem",
  "Precisa de atenção",
  "Faltando material",
  "Ótima participação",
] as const;

export function statusRecadoLabel(i: number): string {
  return STATUS_RECADO[i] ?? "Recado";
}

// Tom do status para colorir o selo (positivo/neutro/atenção).
export function statusRecadoTom(i: number): "positivo" | "atencao" | "neutro" {
  if (i === 1 || i === 2) return "atencao"; // precisa de atenção / faltando material
  if (i === 0 || i === 3) return "positivo"; // evoluindo bem / ótima participação
  return "neutro";
}

// Emoji do status — dá um toque visual amigável no portal da família.
export function statusRecadoEmoji(i: number): string {
  return ["🌱", "👀", "🎒", "🌟"][i] ?? "💬";
}
