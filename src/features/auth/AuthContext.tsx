import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "@/lib/token";
import {
  login as loginRequest,
  logout as logoutRequest,
} from "@/features/auth/authApi";
import { sessaoDoToken } from "@/features/auth/session";
import { queryClient } from "@/lib/queryClient";
import type { Sessao } from "@/types";

// Mesma chave usada pelo persister em main.tsx: o snapshot offline do cache
// (alunos, presenças, fotos) mora aqui no localStorage.
const CHAVE_CACHE_PERSISTIDO = "tribo-query-cache";

interface AuthContextValue {
  sessao: Sessao | null;
  autenticado: boolean;
  // Retorna { requer2fa: true } quando falta o segundo fator — a tela de login
  // então pede o código e chama entrar de novo com codigo2fa.
  entrar: (
    login: string,
    senha: string,
    codigo2fa?: string,
  ) => Promise<{ requer2fa: boolean }>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(() =>
    sessaoDoToken(getToken()),
  );

  const entrar = useCallback(
    async (login: string, senha: string, codigo2fa?: string) => {
      const resposta = await loginRequest({ login, password: senha, codigo2fa });

      // 2FA ativo e código ainda não informado: sinaliza para a tela pedir.
      if ("requer2fa" in resposta) {
        return { requer2fa: true };
      }

      setToken(resposta.token);
      if (resposta.refreshToken) setRefreshToken(resposta.refreshToken);
      setSessao(sessaoDoToken(resposta.token));
      return { requer2fa: false };
    },
    [],
  );

  const sair = useCallback(() => {
    // Revoga a sessão no servidor (best-effort); a limpeza local não espera.
    const refresh = getRefreshToken();
    if (refresh) void logoutRequest(refresh).catch(() => {});
    clearToken();
    // Descarta os dados do usuário que sai — em dispositivo compartilhado
    // (tablet no tatame), o próximo a entrar não pode ver alunos/presenças da
    // sessão anterior. Limpa o cache em memória e o snapshot no localStorage.
    queryClient.clear();
    try {
      localStorage.removeItem(CHAVE_CACHE_PERSISTIDO);
    } catch {
      // localStorage indisponível (modo privado/quota): nada a fazer.
    }
    setSessao(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ sessao, autenticado: sessao !== null, entrar, sair }),
    [sessao, entrar, sair],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
