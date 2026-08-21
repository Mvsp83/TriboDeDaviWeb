import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { BemPatrimonial } from "@/types";

export function useBens() {
  return useQuery({
    queryKey: ["patrimonio"],
    queryFn: async (): Promise<BemPatrimonial[]> => {
      const lista = await apiGet<BemPatrimonial[] | null>(ApiRotas.patrimonioGetAll);
      return lista ?? [];
    },
  });
}

// A API rejeita campos nulos de string; normaliza antes de enviar.
function montarBody(bem: Partial<BemPatrimonial>) {
  return {
    id: bem.id ?? 0,
    categoria: bem.categoria ?? 8,
    descricao: bem.descricao ?? "",
    quantidade: bem.quantidade ?? 0,
    valorUnitario: bem.valorUnitario ?? 0,
    dataAquisicao: bem.dataAquisicao || null,
    estado: bem.estado ?? 1,
    poloId: bem.poloId ?? null,
    numeroPatrimonio: bem.numeroPatrimonio ?? "",
    observacoes: bem.observacoes ?? "",
  };
}

export function useSalvarBem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bem: Partial<BemPatrimonial>) =>
      bem.id
        ? apiPut(ApiRotas.patrimonioUpdate, montarBody(bem))
        : apiPost(ApiRotas.patrimonioCreate, montarBody(bem)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrimonio"] }),
  });
}

export function useExcluirBem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.patrimonioDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patrimonio"] }),
  });
}
