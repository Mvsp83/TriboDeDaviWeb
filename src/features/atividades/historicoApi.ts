import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { HistoricoAtividade } from "@/types";

// Histórico de atividades já aplicadas no polo/turma — alimenta a dica
// "visto em dd/MM" ao lado de cada atividade no seletor do plano.
export function useHistoricoTurma(poloId: number | undefined, turma: number) {
  return useQuery({
    queryKey: ["historico-turma", poloId, turma],
    enabled: poloId != null && poloId > 0,
    queryFn: () =>
      apiGet<HistoricoAtividade[]>(
        ApiRotas.atividadeHistoricoTurma(poloId!, turma),
      ),
  });
}
