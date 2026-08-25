// Aptidão ao exame de graduação: cruza os números crus do backend
// (/api/Graduacao/aptidao) com os parâmetros por faixa configurados na tela de
// Parâmetros. O resultado sinaliza, no cadastro e na chamada, quem já cumpriu
// TODOS os critérios ativos da sua faixa.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { useConfigGraduacao } from "@/features/graduacao/graduacaoApi";
import type { ParametrosFaixa } from "@/features/graduacao/tipos";
import { baseDaCor, faixaInfo } from "@/features/alunos/faixa";

// Espelha AptidaoGraduacaoDTO da API.
export interface AptidaoAluno {
  alunoId: number;
  faixa: number;
  poloId: number;
  dataUltimaGraduacao: string | null;
  dataReferencia: string | null;
  presencasDesdeUltima: number;
  advertenciasDesdeUltima: number;
}

export interface ResultadoAptidao {
  apto: boolean;
  faltam: string[]; // o que ainda falta (vazio quando apto)
  exame: string; // rótulo do exame indicado (próxima faixa/grau)
}

// Meses completos entre uma data ISO e hoje.
function mesesDesde(iso: string, hoje: Date): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  let meses =
    (hoje.getFullYear() - d.getFullYear()) * 12 +
    (hoje.getMonth() - d.getMonth());
  if (hoje.getDate() < d.getDate()) meses -= 1;
  return Math.max(0, meses);
}

// Exame indicado = alcançar a próxima faixa/grau (base 0..40). Preta é o teto.
function exameIndicado(faixa: number): string {
  if (faixa >= 40) return "Faixa máxima";
  return `Exame p/ ${faixaInfo(faixa + 1).nome}`;
}

// Avalia um aluno contra os parâmetros da sua faixa. Retorna null quando não há
// parâmetros/critérios definidos para aquela faixa (nada a sinalizar).
export function avaliarAptidao(
  stats: AptidaoAluno,
  params: ParametrosFaixa | undefined,
  hoje: Date = new Date(),
): ResultadoAptidao | null {
  if (!params) return null;
  const temCriterio =
    params.aulasMinimas > 0 || params.mesesMinimos > 0 || params.semAdvertencias;
  if (!temCriterio) return null;

  const faltam: string[] = [];

  if (params.aulasMinimas > 0 && stats.presencasDesdeUltima < params.aulasMinimas) {
    faltam.push(`${params.aulasMinimas - stats.presencasDesdeUltima} aula(s)`);
  }

  if (params.mesesMinimos > 0) {
    const meses = stats.dataReferencia ? mesesDesde(stats.dataReferencia, hoje) : 0;
    if (meses < params.mesesMinimos) {
      faltam.push(`${params.mesesMinimos - meses} mês(es)`);
    }
  }

  if (params.semAdvertencias && stats.advertenciasDesdeUltima > 0) {
    faltam.push(`${stats.advertenciasDesdeUltima} advertência(s)`);
  }

  return { apto: faltam.length === 0, faltam, exame: exameIndicado(stats.faixa) };
}

export function useAptidaoGraduacao() {
  return useQuery({
    queryKey: ["graduacao-aptidao"],
    queryFn: () =>
      apiGet<AptidaoAluno[] | null>(ApiRotas.graduacaoAptidao).then((r) => r ?? []),
    staleTime: 5 * 60 * 1000,
  });
}

// Mapa alunoId -> resultado, contendo APENAS os alunos aptos (é o que a lista e
// a chamada sinalizam). Vazio enquanto não há parâmetros configurados.
export function useMapaAptidao(): {
  mapa: Map<number, ResultadoAptidao>;
  isLoading: boolean;
} {
  const { data: cfg } = useConfigGraduacao();
  const { data: stats, isLoading } = useAptidaoGraduacao();

  const mapa = useMemo(() => {
    const m = new Map<number, ResultadoAptidao>();
    if (!stats) return m;
    const porBase = new Map(
      (cfg?.parametros ?? []).map((p) => [p.faixaBase, p]),
    );
    for (const s of stats) {
      const r = avaliarAptidao(s, porBase.get(baseDaCor(s.faixa)));
      if (r?.apto) m.set(s.alunoId, r);
    }
    return m;
  }, [stats, cfg]);

  return { mapa, isLoading };
}
