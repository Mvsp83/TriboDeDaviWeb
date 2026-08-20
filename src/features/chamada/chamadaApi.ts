import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { enfileirarChamada } from "@/lib/offlineQueue";
import type { Presenca } from "@/types";

// Presenças já registradas de UMA aula. A API devolve Data: null quando não há
// nenhuma (aula pendente), então normalizamos para lista vazia.
export function usePresencasDaAula(aulaId: number, habilitado = true) {
  return useQuery({
    queryKey: ["presencas", "aula", aulaId],
    enabled: habilitado && aulaId > 0,
    queryFn: async (): Promise<Presenca[]> => {
      const lista = await apiGet<Presenca[] | null>(
        ApiRotas.presencaPorAula(aulaId),
      );
      return lista ?? [];
    },
  });
}

// Uma linha da chamada em edição (aula ainda pendente).
export interface MarcaChamada {
  alunoId: number;
  nomeAluno: string;
  estaPresente: boolean;
}

export interface SalvarChamadaInput {
  aulaId: number;
  poloId: number;
  data: string;
  marcas: MarcaChamada[];
}

// Monta o corpo do batch a partir das marcas — reaproveitado pelo envio online
// e pela sincronização da fila offline.
export function corpoDaChamada({ aulaId, poloId, data, marcas }: SalvarChamadaInput) {
  return marcas.map((m) => ({
    id: 0,
    alunoId: m.alunoId,
    nomeAluno: m.nomeAluno,
    poloId,
    data,
    estaPresente: m.estaPresente,
    observacoes: "",
    aulaId,
  }));
}

// Erro de conexão (sem resposta HTTP): a API devolve status em erros reais
// (400 domínio, 403, 500); só falhas de rede chegam sem status.
export function ehErroDeConexao(e: unknown): boolean {
  return e instanceof ApiError && e.status === undefined;
}

// Envia a chamada. Se estiver offline (ou a rede cair no meio), enfileira
// localmente e devolve { enfileirada: true } — a sincronização acontece
// quando a conexão voltar. Erros de negócio (aula já salva, validação) são
// propagados normalmente.
export async function enviarChamada(
  input: SalvarChamadaInput,
): Promise<{ enfileirada: boolean }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enfileirarChamada(input);
    return { enfileirada: true };
  }
  try {
    await apiPost(ApiRotas.presencaBatchCreate, corpoDaChamada(input));
    return { enfileirada: false };
  } catch (e) {
    if (ehErroDeConexao(e)) {
      enfileirarChamada(input);
      return { enfileirada: true };
    }
    throw e;
  }
}

// Mutation da chamada — usa enviarChamada (online com fallback offline) e, em
// caso de envio online bem-sucedido, invalida aulas/presenças.
export function useSalvarChamada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SalvarChamadaInput) => enviarChamada(input),
    onSuccess: ({ enfileirada }) => {
      if (!enfileirada) {
        qc.invalidateQueries({ queryKey: ["aulas"] });
        qc.invalidateQueries({ queryKey: ["presencas"] });
      }
    },
  });
}

// Ajuste pontual de uma presença já salva (a aula fica travada para batch,
// então correções passam pelo update registro a registro).
export function useAtualizarPresenca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (presenca: Presenca) =>
      apiPut(ApiRotas.presencaUpdate, {
        id: presenca.id,
        alunoId: presenca.alunoId,
        nomeAluno: presenca.nomeAluno,
        poloId: presenca.poloId,
        data: presenca.data,
        estaPresente: presenca.estaPresente,
        observacoes: presenca.observacoes ?? "",
        aulaId: presenca.aulaId,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["presencas"] }),
  });
}
