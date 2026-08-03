import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Presenca } from "@/types";

// Admin lê todas as presenças de uma vez; professor lê por aula (a API só
// expõe o get-all para Administrador). Espera a lista de aulas para o modo
// por-aula, disparando as chamadas em paralelo.
export function usePresencas(admin: boolean, aulaIds: number[]) {
  const idsKey = [...aulaIds].sort((a, b) => a - b).join(",");

  return useQuery({
    queryKey: ["presencas", admin, admin ? "all" : idsKey],
    enabled: admin || aulaIds.length > 0,
    queryFn: async (): Promise<Presenca[]> => {
      if (admin) {
        // A API devolve Data: null quando não há presenças — normaliza p/ [].
        const todas = await apiGet<Presenca[]>(ApiRotas.presencasGetAll);
        return todas ?? [];
      }
      // Cada aula sem presença retorna Data: null → apiGet resolve null.
      // Sem o "?? []" o null entrava no array e quebrava o agrupamento
      // (null.aulaId) — tela em branco na Presenças/Frequência.
      const listas = await Promise.all(
        aulaIds.map((id) =>
          apiGet<Presenca[]>(ApiRotas.presencaPorAula(id))
            .then((r) => r ?? [])
            .catch(() => []),
        ),
      );
      return listas.flat();
    },
  });
}
