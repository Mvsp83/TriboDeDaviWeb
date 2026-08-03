import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { PlanoDeAula } from "@/types";

export function usePlanos(admin: boolean) {
  return useQuery({
    queryKey: ["planos", admin],
    queryFn: () =>
      apiGet<PlanoDeAula[]>(admin ? ApiRotas.planosGetAll : ApiRotas.planosPorPolo),
  });
}

export function usePlano(id: number | undefined) {
  return useQuery({
    queryKey: ["plano", id],
    enabled: id != null,
    queryFn: () => apiGet<PlanoDeAula>(ApiRotas.planoGet(id!)),
  });
}

export function useCriarPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: PlanoDeAula) =>
      apiPost<PlanoDeAula>(ApiRotas.planoCreate, { ...p, id: 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["planos"] }),
  });
}

export function useAtualizarPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: PlanoDeAula) => apiPut(ApiRotas.planoUpdate, p),
    onSuccess: (_data, p) => {
      qc.invalidateQueries({ queryKey: ["planos"] });
      qc.invalidateQueries({ queryKey: ["plano", p.id] });
    },
  });
}

export function useExcluirPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.planoDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["planos"] }),
  });
}

export function useClonarPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, novaDataPrevista }: { id: number; novaDataPrevista: string }) =>
      apiPost<PlanoDeAula>(ApiRotas.planoClonar(id), { novaDataPrevista }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["planos"] }),
  });
}

export interface DadosBasePlano {
  poloId: number;
  turma: number;
  dataPrevista: string;
}

export function useCriarDeModelo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      modeloId,
      dadosBase,
    }: {
      modeloId: number;
      dadosBase: DadosBasePlano;
    }) => apiPost<PlanoDeAula>(ApiRotas.planoCriarDeModelo(modeloId), dadosBase),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["planos"] }),
  });
}
