import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface IndicadorAvaliacao {
  id?: number;
  nome: string;
  valor: number;
  unidade: string;
}
export interface AvaliacaoFisica {
  id: number;
  atletaId: number;
  data: string;
  observacao: string;
  indicadores: IndicadorAvaliacao[];
}
export interface Competicao {
  id: number;
  atletaId: number;
  data: string;
  evento: string;
  categoriaPeso: string;
  colocacao: number;
  lutas: number;
  vitorias: number;
  finalizacoes: number;
  observacao: string;
}
export interface AnotacaoAtleta {
  id: number;
  atletaId: number;
  data: string;
  texto: string;
  autor: string;
}
export interface MetaAtleta {
  id: number;
  atletaId: number;
  descricao: string;
  prazo?: string | null;
  status: number;
  dataConclusao?: string | null;
}
export interface Lesao {
  id: number;
  atletaId: number;
  data: string;
  descricao: string;
  local: string;
  gravidade: number;
  dataRetorno?: string | null;
  recuperado: boolean;
  observacao: string;
}
export interface Atleta {
  id: number;
  alunoId: number;
  categoriaPeso: string;
  objetivo: string;
  status: number;
  dataInclusao: string;
  ativo: boolean;
  alunoNome: string;
  faixa: number;
  poloNome: string;
  avaliacoes: AvaliacaoFisica[];
  competicoes: Competicao[];
  anotacoes: AnotacaoAtleta[];
  metas: MetaAtleta[];
  lesoes: Lesao[];
  // Agregados (listagem + resumo).
  medalhasOuro: number;
  medalhasPrata: number;
  medalhasBronze: number;
  totalCompeticoes: number;
  lesoesAtivas: number;
  lesaoAtivaMaisAntiga?: string | null;
  metasAtencao: number;
  ultimosIndicadores: IndicadorAvaliacao[];
  // Frequência (só no detalhe).
  frequenciaTotal: number;
  frequenciaPresentes: number;
  frequenciaPercentual: number;
}

export const STATUS_ATLETA: Record<number, string> = {
  0: "Ativo",
  1: "Em observação",
  2: "Afastado",
};
export const STATUS_META: Record<number, string> = {
  0: "Aberta",
  1: "Concluída",
  2: "Cancelada",
};
export const GRAVIDADE_LESAO: Record<number, string> = {
  0: "Leve",
  1: "Moderada",
  2: "Grave",
};

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useAtletas() {
  return useQuery({
    queryKey: ["atletas"],
    queryFn: async (): Promise<Atleta[]> => {
      const lista = await apiGet<Atleta[] | null>(ApiRotas.atletas);
      return lista ?? [];
    },
  });
}

export function useAtleta(id: number | null) {
  return useQuery({
    queryKey: ["atleta", id],
    enabled: id != null,
    queryFn: () => apiGet<Atleta>(ApiRotas.atleta(id as number)),
  });
}

function useAtletaMutation<T>(fn: (v: T) => Promise<unknown>, atletaId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atletas"] });
      if (atletaId != null) qc.invalidateQueries({ queryKey: ["atleta", atletaId] });
    },
  });
}

export function useCriarAtleta() {
  return useAtletaMutation((alunoId: number) =>
    apiPost<Atleta>(ApiRotas.atletaCriar(alunoId)),
  );
}
export function useAtualizarPerfil(atletaId: number) {
  return useAtletaMutation(
    (dto: Partial<Atleta>) => apiPut(ApiRotas.atletas, dto),
    atletaId,
  );
}
export function useRemoverAtleta() {
  return useAtletaMutation((id: number) => apiDelete(ApiRotas.atleta(id)));
}

export function useAdicionarAvaliacao(atletaId: number) {
  return useAtletaMutation(
    (dto: Partial<AvaliacaoFisica>) =>
      apiPost(ApiRotas.atletaAvaliacoes(atletaId), dto),
    atletaId,
  );
}
export function useRemoverAvaliacao(atletaId: number) {
  return useAtletaMutation(
    (id: number) => apiDelete(ApiRotas.atletaAvaliacaoExcluir(id)),
    atletaId,
  );
}
export function useAdicionarCompeticao(atletaId: number) {
  return useAtletaMutation(
    (dto: Partial<Competicao>) =>
      apiPost(ApiRotas.atletaCompeticoes(atletaId), dto),
    atletaId,
  );
}
export function useRemoverCompeticao(atletaId: number) {
  return useAtletaMutation(
    (id: number) => apiDelete(ApiRotas.atletaCompeticaoExcluir(id)),
    atletaId,
  );
}
export function useAdicionarAnotacao(atletaId: number) {
  return useAtletaMutation(
    (texto: string) => apiPost(ApiRotas.atletaAnotacoes(atletaId), { texto }),
    atletaId,
  );
}
export function useRemoverAnotacao(atletaId: number) {
  return useAtletaMutation(
    (id: number) => apiDelete(ApiRotas.atletaAnotacaoExcluir(id)),
    atletaId,
  );
}
export function useAdicionarMeta(atletaId: number) {
  return useAtletaMutation(
    (dto: Partial<MetaAtleta>) => apiPost(ApiRotas.atletaMetas(atletaId), dto),
    atletaId,
  );
}
export function useAlterarStatusMeta(atletaId: number) {
  return useAtletaMutation(
    ({ id, status }: { id: number; status: number }) =>
      apiPost(ApiRotas.atletaMetaStatus(id, status)),
    atletaId,
  );
}
export function useRemoverMeta(atletaId: number) {
  return useAtletaMutation(
    (id: number) => apiDelete(ApiRotas.atletaMetaExcluir(id)),
    atletaId,
  );
}
export function useAdicionarLesao(atletaId: number) {
  return useAtletaMutation(
    (dto: Partial<Lesao>) => apiPost(ApiRotas.atletaLesoes(atletaId), dto),
    atletaId,
  );
}
export function useMarcarLesaoRecuperada(atletaId: number) {
  return useAtletaMutation(
    ({ id, recuperado }: { id: number; recuperado: boolean }) =>
      apiPost(ApiRotas.atletaLesaoRecuperada(id, recuperado)),
    atletaId,
  );
}
export function useRemoverLesao(atletaId: number) {
  return useAtletaMutation(
    (id: number) => apiDelete(ApiRotas.atletaLesaoExcluir(id)),
    atletaId,
  );
}
