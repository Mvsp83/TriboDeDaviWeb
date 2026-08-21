import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthContext";
import { carregarPresencas } from "@/features/relatorios/fontes";
import type { Presenca } from "@/types";

// Um aluno "em risco" é quem vem faltando nas últimas aulas em que foi chamado.
// Olhamos só o histórico recente para não acusar quem já voltou a frequentar.
const FALTAS_SEGUIDAS_ALERTA = 3;
const AULAS_ANALISADAS = 6;

export interface AlunoEmRisco {
  alunoId: number;
  nome: string;
  poloId: number;
  faltasSeguidas: number;
  ultimaPresenca: string | null; // ISO da última vez que esteve presente
  totalAnalisado: number;
}

// Agrupa as presenças por aluno, da mais recente para a mais antiga, e conta
// quantas faltas seguidas existem a partir da última aula registrada.
function apurarRisco(presencas: Presenca[]): AlunoEmRisco[] {
  const porAluno = new Map<number, Presenca[]>();
  for (const p of presencas) {
    const lista = porAluno.get(p.alunoId);
    if (lista) lista.push(p);
    else porAluno.set(p.alunoId, [p]);
  }

  const risco: AlunoEmRisco[] = [];
  for (const [alunoId, lista] of porAluno) {
    const recentes = [...lista]
      .sort((a, b) => +new Date(b.data) - +new Date(a.data))
      .slice(0, AULAS_ANALISADAS);

    let faltasSeguidas = 0;
    for (const p of recentes) {
      if (p.estaPresente) break;
      faltasSeguidas += 1;
    }

    if (faltasSeguidas >= FALTAS_SEGUIDAS_ALERTA) {
      const ultima = recentes.find((p) => p.estaPresente);
      risco.push({
        alunoId,
        nome: recentes[0]?.nomeAluno ?? `Aluno #${alunoId}`,
        poloId: recentes[0]?.poloId ?? 0,
        faltasSeguidas,
        ultimaPresenca: ultima?.data ?? null,
        totalAnalisado: recentes.length,
      });
    }
  }

  // Quem mais faltou primeiro; empate resolve por nome.
  return risco.sort(
    (a, b) => b.faltasSeguidas - a.faltasSeguidas || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

export function useAlunosEmRisco() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;

  return useQuery({
    queryKey: ["evasao", admin],
    queryFn: async () => apurarRisco(await carregarPresencas(admin)),
    staleTime: 5 * 60 * 1000,
  });
}

export const REGRA_EVASAO = { FALTAS_SEGUIDAS_ALERTA, AULAS_ANALISADAS };
