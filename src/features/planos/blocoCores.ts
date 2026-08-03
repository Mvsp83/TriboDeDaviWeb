import { TipoBloco } from "@/types";

// Cores por tipo de bloco (mesma paleta da timeline do portal Blazor).
export function blocoCor(tipo: number): string {
  switch (tipo) {
    case TipoBloco.Aquecimento:
      return "#fb8c00"; // laranja
    case TipoBloco.Posicoes:
      return "#1e88e5"; // azul
    case TipoBloco.Lutas:
      return "#e53935"; // vermelho
    case TipoBloco.Dinamicas:
      return "#43a047"; // verde
    case TipoBloco.MensagemFinal:
      return "#8e24aa"; // roxo
    default:
      return "#78909c"; // cinza-azulado
  }
}
