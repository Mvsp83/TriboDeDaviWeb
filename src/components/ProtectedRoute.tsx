import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import type { ModuloId } from "@/config/modulos";

// Guarda de rotas: sem sessão, manda para o login guardando a origem.
// - adminOnly restringe a área às contas Administrador (papel do usuário).
// - modulo exige que a CONTA tenha contratado aquele módulo (ver modulos.ts).
// As duas checagens são independentes e podem ser combinadas.
//
// A prop `graduacao` é um atalho legado equivalente a modulo="graduacao";
// mantida para não quebrar rotas existentes.
//
// ATENÇÃO: isto é apenas UX. A API precisa validar módulo e papel no servidor.
export function ProtectedRoute({
  adminOnly = false,
  modulo,
  graduacao = false,
}: {
  adminOnly?: boolean;
  modulo?: ModuloId;
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

  const moduloExigido: ModuloId | undefined = modulo ?? (graduacao ? "graduacao" : undefined);
  if (moduloExigido && !sessao?.modulos.includes(moduloExigido)) {
    // Conta não contratou o módulo. Por ora volta ao painel; aqui é o ponto
    // natural para uma tela de "Contrate este módulo" (upsell).
    return <Navigate to="/painel" replace />;
  }

  return <Outlet />;
}
