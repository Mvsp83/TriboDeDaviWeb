import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Aula } from "@/types";

export function useAulas(admin: boolean) {
  return useQuery({
    queryKey: ["aulas", admin],
    queryFn: () =>
      apiGet<Aula[]>(admin ? ApiRotas.aulasGetAll : ApiRotas.aulasPorPolo),
  });
}

// Dados do formulário de nova aula. Hora no formato "HH:mm" (input time);
// a API espera TimeSpan "HH:mm:ss" e DateTime, então normalizamos no envio.
export interface NovaAula {
  poloId: number;
  data: string; // yyyy-MM-dd
  turma: number;
  horaInicio: string; // "HH:mm"
  horaFim: string; // "HH:mm"
}

const comSegundos = (hhmm: string) => (hhmm.length === 5 ? `${hhmm}:00` : hhmm);
// DateTime do System.Text.Json espera ISO completo; anexa a meia-noite local.
const comHora = (yyyyMMdd: string) =>
  yyyyMMdd.length === 10 ? `${yyyyMMdd}T00:00:00` : yyyyMMdd;

export function useCriarAula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nova: NovaAula) =>
      apiPost<Aula>(ApiRotas.aulaCreate, {
        id: 0,
        poloId: nova.poloId,
        data: comHora(nova.data),
        turma: nova.turma,
        horaInicio: comSegundos(nova.horaInicio),
        horaFim: comSegundos(nova.horaFim),
        presencaSalva: false,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aulas"] }),
  });
}
