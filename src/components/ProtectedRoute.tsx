import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";

// Guarda de rotas: sem sessão, manda para o login guardando a origem.
// adminOnly restringe a área às contas Administrador; graduacao libera admin
// OU professor com permissão de Programa de Graduação.
export function ProtectedRoute({
  adminOnly = false,
  graduacao = false,
}: {
  adminOnly?: boolean;
  graduacao?: boolean;
}) {
  const { sessao, autenticado } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !sessao?.isAdministrador) {
    return <Navigate to="/painel" replace />;
  }

  const podeGraduacao = sessao?.isAdministrador || sessao?.permiteGraduacao;
  if (graduacao && !podeGraduacao) {
    return <Navigate to="/painel" replace />;
  }

  return <Outlet />;
}
