import { jwtDecode } from "jwt-decode";
import type { Sessao } from "@/types";
import { type ModuloId, parseModulos } from "@/config/modulos";

// Nomes curtos ("unique_name", "email", "role") são a forma serializada
// dos ClaimTypes que a API emite no JWT.
interface JwtClaims {
  unique_name?: string;
  email?: string;
  role?: string;
  PoloId?: string;
  PoloNome?: string;
  PermiteGraduacao?: string;
  // Lista de módulos contratados, separada por vírgula (ex.: "core,graduacao").
  // Enquanto a API não emitir esta claim, caímos no fallback de compatibilidade.
  Modulos?: string;
  exp?: number;
}

// Módulos disponíveis quando o token ainda NÃO traz a claim "Modulos": mantém
// o comportamento anterior (tudo visível, exceto graduação, que segue a regra
// admin OU permissão de professor). Some assim que o backend passar a emitir.
function modulosDeCompatibilidade(
  role: string,
  permiteGraduacao: boolean,
): ModuloId[] {
  const base: ModuloId[] = ["core", "captacao", "financeiro", "relacionamento"];
  if (role === "Administrador" || permiteGraduacao) base.push("graduacao");
  return base;
}

// Constrói a sessão a partir do token, ou null se ausente/expirado/inválido.
export function sessaoDoToken(token: string | null): Sessao | null {
  if (!token) return null;

  try {
    const claims = jwtDecode<JwtClaims>(token);

    if (claims.exp && claims.exp * 1000 < Date.now()) {
      return null;
    }

    const role = claims.role ?? "";
    const poloId = claims.PoloId ? Number(claims.PoloId) : null;
    const permiteGraduacao = claims.PermiteGraduacao === "true";

    // Se a claim "Modulos" veio, ela manda; senão, fallback compatível.
    const modulos =
      claims.Modulos !== undefined
        ? parseModulos(claims.Modulos)
        : modulosDeCompatibilidade(role, permiteGraduacao);

    return {
      login: claims.unique_name ?? "",
      email: claims.email ?? "",
      role,
      poloId: Number.isNaN(poloId) ? null : poloId,
      poloNome: claims.PoloNome ?? "",
      isAdministrador: role === "Administrador",
      isProfessor: role === "Professor",
      permiteGraduacao,
      modulos,
    };
  } catch {
    return null;
  }
}
