import { TipoBloco } from "@/types";

// Troca um item de posição no array (usado para reordenar blocos).
export function moverItem<T>(arr: T[], index: number, dir: number): T[] {
  const j = index + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[index], copy[j]] = [copy[j], copy[index]];
  return copy;
}

// Sugere o tipo do próximo bloco pela ordem típica de uma aula.
export function tipoSugerido(count: number): number {
  return (
    [
      TipoBloco.Aquecimento,
      TipoBloco.Posicoes,
      TipoBloco.Lutas,
      TipoBloco.Dinamicas,
    ][count] ?? TipoBloco.Outro
  );
}

export function labelDescricaoBloco(tipo: number): string {
  switch (tipo) {
    case TipoBloco.MensagemFinal:
      return "Mensagem (princípio, referência bíblica, reflexão)";
    case TipoBloco.Posicoes:
      return "Posições e técnicas trabalhadas";
    default:
      return "Descrição / observações";
  }
}

// Cor do chip de soma: vermelho se excede, verde se bate, âmbar se sobra.
export function corSoma(planejado: number, total: number): "destructive" | "success" | "warning" {
  if (planejado > total) return "destructive";
  if (planejado === total) return "success";
  return "warning";
}
