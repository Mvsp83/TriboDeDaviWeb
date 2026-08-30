import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Usuario } from "@/types";

// `habilitado` permite adiar a busca (o endpoint é admin-only; telas que só
// listam usuários para o admin passam a permissão para não disparar 401).
export function useUsuarios(habilitado = true) {
  return useQuery({
    queryKey: ["usuarios"],
    enabled: habilitado,
    queryFn: () => apiGet<Usuario[]>(ApiRotas.usuariosGetAll),
  });
}

export function useSalvarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (u: Usuario) => {
      if (u.id) {
        return apiPut(ApiRotas.usuarioUpdate, {
          id: u.id,
          login: u.login,
          // Senha vazia vira null: a API mantém a senha atual (string vazia
          // é rejeitada pela validação de tamanho mínimo).
          password: u.password?.trim() ? u.password : null,
          email: u.email,
          role: u.role,
          poloId: u.poloId ?? 0,
          poloNome: u.poloNome ?? "",
          permiteGraduacao: u.permiteGraduacao ?? false,
        });
      }
      return apiPost(ApiRotas.usuarioCreate, {
        id: 0,
        login: u.login,
        password: u.password ?? "",
        email: u.email,
        role: u.role,
        poloId: u.poloId ?? 0,
        poloNome: u.poloNome ?? "",
        permiteGraduacao: u.permiteGraduacao ?? false,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

export function useExcluirUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.usuarioDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}
