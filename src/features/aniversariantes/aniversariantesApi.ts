import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Aniversariante } from "@/types";

// mes = 0 significa "todos os meses" → busca os 12 em paralelo e junta.
// A API devolve Data: null quando o mês está vazio, por isso o "?? []".
export function useAniversariantes(mes: number) {
  return useQuery({
    queryKey: ["aniversariantes", mes],
    queryFn: async (): Promise<Aniversariante[]> => {
      if (mes === 0) {
        const listas = await Promise.all(
          Array.from({ length: 12 }, (_, i) =>
            apiGet<Aniversariante[]>(ApiRotas.aniversariantes(i + 1))
              .then((r) => r ?? [])
              .catch(() => []),
          ),
        );
        return listas.flat();
      }
      const lista = await apiGet<Aniversariante[]>(ApiRotas.aniversariantes(mes));
      return lista ?? [];
    },
  });
}
