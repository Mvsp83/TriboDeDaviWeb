import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { useAuth } from "@/features/auth/AuthContext";
import {
  carregarConfig,
  salvarConfig,
  normalizar,
  type DashboardConfig,
} from "@/features/dashboard/dashboardLayout";

// Espelho do ConfiguracaoDashboardDTO da API. `layout` é o JSON do DashboardConfig.
interface ConfigDashboardDTO {
  id: number;
  usuarioLogin?: string | null;
  layout: string;
}

function parseLayout(layout: string | null | undefined, todosIds: string[]): DashboardConfig | null {
  if (!layout) return null;
  try {
    return normalizar(JSON.parse(layout) as DashboardConfig, todosIds);
  } catch {
    return null;
  }
}

// Preferência de layout do Dashboard sincronizada com a API, usando o
// localStorage como cache (render instantâneo) e fallback offline. O layout
// trafega como JSON no campo `layout`, então o backend não precisa conhecer os
// widgets — adicionar widgets novos é só mexer no front.
export function useDashboardLayout(todosIds: string[]) {
  const { sessao } = useAuth();
  const login = sessao?.login ?? "anon";
  const queryClient = useQueryClient();
  const chave = ["dashboard-config", login];

  const query = useQuery({
    queryKey: chave,
    // localStorage garante primeiro paint imediato e funcionamento offline.
    initialData: () => carregarConfig(login, todosIds),
    queryFn: async (): Promise<DashboardConfig> => {
      try {
        const dto = await apiGet<ConfigDashboardDTO>(ApiRotas.dashboardConfigObter);
        // API vence quando já há preferência salva; senão mantém o local.
        const efetiva = parseLayout(dto?.layout, todosIds) ?? carregarConfig(login, todosIds);
        salvarConfig(login, efetiva); // espelha no cache local
        return efetiva;
      } catch {
        // Offline / erro de rede: segue com o que houver no localStorage.
        return carregarConfig(login, todosIds);
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (cfg: DashboardConfig) =>
      apiPut<ConfigDashboardDTO>(ApiRotas.dashboardConfigSalvar, {
        layout: JSON.stringify(cfg),
      }),
    // Falha (offline) não desfaz nada: o localStorage já guardou a preferência.
  });

  const salvar = useCallback(
    (next: DashboardConfig) => {
      const norm = normalizar(next, todosIds);
      // Aplica na hora (otimista) e persiste local; sincroniza com a API depois.
      queryClient.setQueryData(["dashboard-config", login], norm);
      salvarConfig(login, norm);
      mutation.mutate(norm);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [login, todosIds, queryClient],
  );

  return { config: query.data ?? carregarConfig(login, todosIds), salvar };
}
