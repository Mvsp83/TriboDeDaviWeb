import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { EventoCalendario } from "@/types";

// Eventos de um ano. A API devolve Data: null quando o ano não tem eventos.
export function useEventosCalendario(ano: number) {
  return useQuery({
    queryKey: ["calendario", ano],
    queryFn: async (): Promise<EventoCalendario[]> => {
      const lista = await apiGet<EventoCalendario[] | null>(
        ApiRotas.calendarioPorAno(ano),
      );
      return lista ?? [];
    },
  });
}

// Anos que já têm eventos (para o seletor de ano).
export function useAnosCalendario() {
  return useQuery({
    queryKey: ["calendario", "anos"],
    queryFn: async (): Promise<number[]> => {
      const anos = await apiGet<number[] | null>(ApiRotas.calendarioAnos);
      return anos ?? [];
    },
  });
}

function montarBody(evento: Partial<EventoCalendario>) {
  const data = evento.data ?? "";
  return {
    id: evento.id ?? 0,
    // O ano deriva da data do evento.
    ano: data ? Number(data.slice(0, 4)) : evento.ano ?? 0,
    data,
    dataFim: evento.dataFim || null,
    titulo: evento.titulo ?? "",
    tipo: evento.tipo ?? 8,
    descricao: evento.descricao ?? "",
    poloId: evento.poloId ?? null,
    notificar: evento.notificar ?? false,
    emailsNotificacao: evento.emailsNotificacao ?? "",
    diasAntecedencia: evento.diasAntecedencia ?? 0,
  };
}

export function useSalvarEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (evento: Partial<EventoCalendario>) =>
      evento.id
        ? apiPut(ApiRotas.calendarioUpdate, montarBody(evento))
        : apiPost(ApiRotas.calendarioCreate, montarBody(evento)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendario"] }),
  });
}

export function useExcluirEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.calendarioDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendario"] }),
  });
}

export function useCopiarAno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ origem, destino }: { origem: number; destino: number }) =>
      apiPost<number>(ApiRotas.calendarioCopiar(origem, destino)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendario"] }),
  });
}
