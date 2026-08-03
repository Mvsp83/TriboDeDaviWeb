import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { useAuth } from "@/features/auth/AuthContext";

interface MeuAvatarResposta {
  avatar: string | null;
}

// Avatar do usuário autenticado. Só busca quando há sessão; se a API estiver
// fora, o erro é silencioso e a UI cai nas iniciais.
export function useMeuAvatar() {
  const { autenticado } = useAuth();
  return useQuery({
    queryKey: ["meu-avatar"],
    queryFn: async () => {
      const r = await apiGet<MeuAvatarResposta>(ApiRotas.meuAvatar);
      return r?.avatar ?? null;
    },
    enabled: autenticado,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalvarAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (avatar: string | null) =>
      apiPut(ApiRotas.meuAvatar, { avatar }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meu-avatar"] }),
  });
}
