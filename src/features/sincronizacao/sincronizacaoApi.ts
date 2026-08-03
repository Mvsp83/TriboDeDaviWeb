import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPostMensagem } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { SincronizacaoHistorico } from "@/types";

export function useHistoricoSincronizacao(poloId: number) {
  return useQuery({
    queryKey: ["sinc-historico", poloId],
    queryFn: () =>
      apiGet<SincronizacaoHistorico[]>(
        poloId > 0
          ? ApiRotas.sincronizacaoHistoricoPorPolo(poloId)
          : ApiRotas.sincronizacaoHistorico(),
      ),
  });
}

export function useUltimaSincronizacao() {
  return useQuery({
    queryKey: ["sinc-ultima"],
    queryFn: () =>
      apiGet<SincronizacaoHistorico | null>(ApiRotas.sincronizacaoUltima),
  });
}

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["sinc-historico"] });
  qc.invalidateQueries({ queryKey: ["sinc-ultima"] });
}

export function useSincronizarTudo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPostMensagem(ApiRotas.sincronizarTudo),
    onSuccess: () => invalidar(qc),
  });
}

export function useSincronizarPolo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poloId: number) =>
      apiPostMensagem(ApiRotas.sincronizarPolo(poloId)),
    onSuccess: () => invalidar(qc),
  });
}
