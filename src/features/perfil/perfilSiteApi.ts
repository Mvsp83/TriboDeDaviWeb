import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { useAuth } from "@/features/auth/AuthContext";

// Perfil público do professor (foto de rosto + faixa na seção do polo). Foto
// em data URI; faixa no mesmo sistema dos alunos (0=Branca .. 40=Preta).
export interface PerfilSite {
  nome: string | null;
  faixa: number | null;
  fotoSite: string | null;
  mostrarNoSite: boolean;
}

export function useMeuPerfilSite() {
  const { autenticado } = useAuth();
  return useQuery({
    queryKey: ["meu-perfil-site"],
    enabled: autenticado,
    queryFn: async (): Promise<PerfilSite> => {
      const r = await apiGet<PerfilSite | null>(ApiRotas.meuPerfilSite);
      return (
        r ?? { nome: null, faixa: null, fotoSite: null, mostrarNoSite: false }
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalvarMeuPerfilSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (perfil: PerfilSite) => apiPut(ApiRotas.meuPerfilSite, perfil),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meu-perfil-site"] }),
  });
}
