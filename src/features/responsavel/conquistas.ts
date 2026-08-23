// Gamificação da frequência: transforma as presenças do aluno em "selos" que
// motivam a criança a não faltar. Lógica pura (sem React, sem rede) para ser
// testável e reaproveitável. Casa com o alerta de evasão (B2): em vez de só
// cobrar quem falta, reconhece quem comparece.

export interface PresencaLite {
  data: string; // ISO
  presente: boolean;
}

export interface ResumoFrequencia {
  presencas: number; // total de presenças no histórico (todas as aulas)
  percentual: number; // % de presença (0..100)
  totalAulas: number;
}

export interface Selo {
  id: string;
  nome: string;
  descricao: string;
  // Ícone lucide (resolvido no componente para não acoplar a UI aqui).
  icone: "medal" | "flame" | "star" | "trophy" | "award" | "zap";
  meta: number; // valor-alvo (presenças, sequência ou %)
  atual: number; // progresso atual rumo à meta
  conquistado: boolean;
}

// Maior sequência de presenças consecutivas terminando na aula mais recente.
// A lista vem mais recente primeiro (como no painel do responsável); paramos na
// primeira falta. É a "sequência atual" — o que o aluno tem a perder faltando.
export function sequenciaAtual(presencas: PresencaLite[]): number {
  const ordenada = [...presencas].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
  let seq = 0;
  for (const p of ordenada) {
    if (!p.presente) break;
    seq += 1;
  }
  return seq;
}

// Metas dos selos. Ficam num lugar só para ajustar sem caçar no código.
const METAS_TOTAL = [
  { id: "total-10", nome: "Primeiros passos", meta: 10, icone: "medal" as const },
  { id: "total-25", nome: "Faixa firme", meta: 25, icone: "star" as const },
  { id: "total-50", nome: "Guerreiro do tatame", meta: 50, icone: "award" as const },
  { id: "total-100", nome: "Lenda do dojo", meta: 100, icone: "trophy" as const },
];

const METAS_SEQUENCIA = [
  { id: "seq-5", nome: "Constância", meta: 5, icone: "flame" as const },
  { id: "seq-10", nome: "Imbatível", meta: 10, icone: "zap" as const },
];

// Assiduidade só vale a partir de um mínimo de aulas, senão "100% de 1 aula"
// premiaria quem mal começou.
const ASSIDUIDADE_MIN_AULAS = 10;
const ASSIDUIDADE_META = 90;

export function calcularSelos(
  resumo: ResumoFrequencia,
  presencas: PresencaLite[],
): Selo[] {
  const seq = sequenciaAtual(presencas);

  const selosTotal: Selo[] = METAS_TOTAL.map((m) => ({
    id: m.id,
    nome: m.nome,
    descricao: `${m.meta} presenças no total`,
    icone: m.icone,
    meta: m.meta,
    atual: Math.min(resumo.presencas, m.meta),
    conquistado: resumo.presencas >= m.meta,
  }));

  const selosSeq: Selo[] = METAS_SEQUENCIA.map((m) => ({
    id: m.id,
    nome: m.nome,
    descricao: `${m.meta} aulas seguidas sem faltar`,
    icone: m.icone,
    meta: m.meta,
    atual: Math.min(seq, m.meta),
    conquistado: seq >= m.meta,
  }));

  const seloAssiduidade: Selo = {
    id: "assiduidade-90",
    nome: "Sempre presente",
    descricao: `${ASSIDUIDADE_META}% de presença ou mais`,
    icone: "star",
    meta: ASSIDUIDADE_META,
    atual: resumo.percentual,
    // Só conquistável com histórico suficiente; senão fica como meta a atingir.
    conquistado:
      resumo.totalAulas >= ASSIDUIDADE_MIN_AULAS &&
      resumo.percentual >= ASSIDUIDADE_META,
  };

  return [...selosTotal, ...selosSeq, seloAssiduidade];
}

// Próximo selo a conquistar (o de menor progresso restante), para mostrar uma
// meta clara à criança. Null quando já conquistou todos.
export function proximoSelo(selos: Selo[]): Selo | null {
  const pendentes = selos.filter((s) => !s.conquistado);
  if (pendentes.length === 0) return null;
  return pendentes.reduce((melhor, s) =>
    s.meta - s.atual < melhor.meta - melhor.atual ? s : melhor,
  );
}
