import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

// Inscrição recusada e antiga, candidata ao expurgo de dados pessoais (LGPD).
export interface InscricaoExpurgo {
  id: number;
  nome: string;
  ano: number;
  dataEnvio: string;
}

export function useRetencaoInscricoes() {
  return useQuery({
    queryKey: ["retencao-lgpd"],
    queryFn: () =>
      apiGet<InscricaoExpurgo[] | null>(ApiRotas.inscricaoRetencao).then((r) => r ?? []),
  });
}

export function useAnonimizarInscricao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiPut(ApiRotas.inscricaoRetencaoAnonimizar(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retencao-lgpd"] }),
  });
}
