// Regras de graduação da IBJJF (Artigos 2 e 3): idades mínimas por faixa e o
// cálculo de idade "pelo ano". Fonte: documento oficial IBJJF de Graduação
// (Artigo 2 — Idades Mínimas; Artigo 2.2.1 — fórmula da idade).
//
// A idade que vale para mudança de faixa NÃO é a idade em anos completos, e sim
// a idade que o atleta completa (ou completará) no ANO corrente:
//   idade = ano corrente − ano de nascimento.
import { baseDaCor, faixaInfo } from "@/features/alunos/faixa";
import type { ParametrosFaixa } from "@/features/graduacao/tipos";

// Idade mínima padrão por cor de faixa (base 0..40), conforme o Artigo 2 da
// IBJJF. Editável por polo na tela de Parâmetros (ParametrosFaixa.idadeMinima).
//   Branca: qualquer idade · Cinza: 4 · Amarela: 7 · Laranja: 10 · Verde: 13
//   Azul: 16 · Roxa: 16 · Marrom: 18 · Preta: 18
export const IDADE_MINIMA_PADRAO: Record<number, number> = {
  0: 0, // Branca — qualquer idade
  5: 4, // Cinza
  10: 7, // Amarela
  15: 10, // Laranja
  20: 13, // Verde
  25: 16, // Azul
  30: 16, // Roxa
  35: 18, // Marrom
  40: 18, // Preta
};

// Idade do atleta pela regra do ano (ano corrente − ano de nascimento).
// null quando a data é inválida/ausente.
export function idadePorAno(
  iso: string | null | undefined,
  hoje: Date = new Date(),
): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return hoje.getFullYear() - d.getFullYear();
}

// Idade mínima exigida para uma faixa (usa a cor da faixa). Se houver parâmetro
// configurado para a cor, ele manda (inclusive 0); senão, cai no padrão IBJJF.
export function idadeMinimaDaFaixa(
  faixa: number,
  parametros: ParametrosFaixa[] | undefined,
): number {
  const base = baseDaCor(faixa);
  const cfg = parametros?.find((p) => p.faixaBase === base);
  if (cfg && cfg.idadeMinima != null) return cfg.idadeMinima;
  return IDADE_MINIMA_PADRAO[base] ?? 0;
}

export interface ChecagemIdade {
  ok: boolean;
  idadeMinima: number;
  idadeAluno: number | null;
  faixaNome: string;
}

// Verifica se um aluno pode ser graduado para uma faixa dada a idade mínima.
// Sem exigência (idadeMinima <= 0) sempre passa. Se a data de nascimento não
// permite calcular a idade e há exigência, reprova (não dá para comprovar).
export function checarIdadeGraduacao(
  faixaNova: number,
  dataNascimento: string | null | undefined,
  parametros: ParametrosFaixa[] | undefined,
  hoje: Date = new Date(),
): ChecagemIdade {
  const idadeMinima = idadeMinimaDaFaixa(faixaNova, parametros);
  const idadeAluno = idadePorAno(dataNascimento, hoje);
  const faixaNome = faixaInfo(faixaNova).nome;
  if (idadeMinima <= 0) {
    return { ok: true, idadeMinima, idadeAluno, faixaNome };
  }
  const ok = idadeAluno != null && idadeAluno >= idadeMinima;
  return { ok, idadeMinima, idadeAluno, faixaNome };
}
