import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Aula } from "@/types";

export function useAulas(admin: boolean) {
  return useQuery({
    queryKey: ["aulas", admin],
    queryFn: () =>
      apiGet<Aula[]>(admin ? ApiRotas.aulasGetAll : ApiRotas.aulasPorPolo),
  });
}
