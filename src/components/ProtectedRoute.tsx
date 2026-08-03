import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";

// Guarda de rotas: sem sessão, manda para o login guardando a origem.
// adminOnly restringe a área às contas Administrador.
export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { sessao, autenticado } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !sessao?.isAdministrador) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
