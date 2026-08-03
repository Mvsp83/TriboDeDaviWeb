import { jwtDecode } from "jwt-decode";
import type { Sessao } from "@/types";

// Nomes curtos ("unique_name", "email", "role") são a forma serializada
// dos ClaimTypes que a API emite no JWT.
interface JwtClaims {
  unique_name?: string;
  email?: string;
  role?: string;
  PoloId?: string;
  PoloNome?: string;
  exp?: number;
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

    return {
      login: claims.unique_name ?? "",
      email: claims.email ?? "",
      role,
      poloId: Number.isNaN(poloId) ? null : poloId,
      poloNome: claims.PoloNome ?? "",
      isAdministrador: role === "Administrador",
      isProfessor: role === "Professor",
    };
  } catch {
    return null;
  }
}
