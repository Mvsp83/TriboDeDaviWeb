// Sugestão do tamanho de quimono a partir do tamanho de calça/blusa da ficha.
// Tabela de referência EDITÁVEL — ajuste os pares aqui se o padrão do instituto
// for outro. Usa o MAIOR número entre calça e blusa (o quimono é peça única).
//
// Regra: tamanho <= "ate" → aquele quimono; acima da última faixa → adulto (A0).
const TABELA: { ate: number; quimono: string }[] = [
  { ate: 2, quimono: "M000" },
  { ate: 4, quimono: "M00" },
  { ate: 6, quimono: "M0" },
  { ate: 8, quimono: "M1" },
  { ate: 10, quimono: "M2" },
  { ate: 12, quimono: "M3" },
  { ate: 14, quimono: "M4" },
];
const QUIMONO_ADULTO = "A0";

function primeiroNumero(txt?: string | null): number | null {
  if (!txt) return null;
  const m = txt.match(/\d+/);
  return m ? Number(m[0]) : null;
}

// Retorna o quimono sugerido, ou null quando não há número em calça/blusa
// (ex.: tamanhos por letra P/M/G — aí a equipe decide manualmente).
export function sugerirQuimono(
  calca?: string | null,
  blusa?: string | null,
): string | null {
  const nums = [primeiroNumero(calca), primeiroNumero(blusa)].filter(
    (n): n is number => n != null,
  );
  if (nums.length === 0) return null;
  const tamanho = Math.max(...nums);
  for (const faixa of TABELA) if (tamanho <= faixa.ate) return faixa.quimono;
  return QUIMONO_ADULTO;
}
