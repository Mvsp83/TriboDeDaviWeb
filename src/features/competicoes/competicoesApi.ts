import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export interface Participacao {
  id: number;
  competicaoEventoId: number;
  atletaId: number;
  categoriaPeso: string;
  colocacao: number;
  lutas: number;
  vitorias: number;
  finalizacoes: number;
  observacao: string;
  atletaNome: string;
  faixa: number;
}
export interface CompeticaoEvento {
  id: number;
  nome: string;
  data: string;
  dataFim?: string | null;
  local: string;
  organizador: string;
  prazoInscricao?: string | null;
  link: string;
  observacao: string;
  status: number;
  totalParticipantes: number;
  participacoes: Participacao[];
}

export const STATUS_COMPETICAO: Record<number, string> = {
  0: "Próxima",
  1: "Realizada",
  2: "Cancelada",
};

export function useCompeticoes() {
  return useQuery({
    queryKey: ["competicoes-evento"],
    queryFn: async (): Promise<CompeticaoEvento[]> => {
      const lista = await apiGet<CompeticaoEvento[] | null>(
        ApiRotas.competicoesEvento,
      );
      return lista ?? [];
    },
  });
}

export function useCompeticao(id: number | null) {
  return useQuery({
    queryKey: ["competicao-evento", id],
    enabled: id != null,
    queryFn: () =>
      apiGet<CompeticaoEvento>(ApiRotas.competicaoEvento(id as number)),
  });
}

function useCompMutation<T>(fn: (v: T) => Promise<unknown>, id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["competicoes-evento"] });
      if (id != null) qc.invalidateQueries({ queryKey: ["competicao-evento", id] });
    },
  });
}

export function useSalvarCompeticao() {
  return useCompMutation((dto: Partial<CompeticaoEvento>) =>
    dto.id
      ? apiPut(ApiRotas.competicoesEvento, dto)
      : apiPost(ApiRotas.competicoesEvento, dto),
  );
}
export function useRemoverCompeticao() {
  return useCompMutation((id: number) =>
    apiDelete(ApiRotas.competicaoEvento(id)),
  );
}
export function useAdicionarParticipacao(eventoId: number) {
  return useCompMutation(
    (dto: Partial<Participacao>) =>
      apiPost(ApiRotas.competicaoParticipacoes(eventoId), dto),
    eventoId,
  );
}
export function useAtualizarParticipacao(eventoId: number) {
  return useCompMutation(
    (dto: Participacao) =>
      apiPut(ApiRotas.competicaoParticipacaoAtualizar, dto),
    eventoId,
  );
}
export function useRemoverParticipacao(eventoId: number) {
  return useCompMutation(
    (id: number) => apiDelete(ApiRotas.competicaoParticipacaoExcluir(id)),
    eventoId,
  );
}
