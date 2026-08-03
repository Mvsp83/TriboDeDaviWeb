import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearToken, getToken, setToken } from "@/lib/token";
import { login as loginRequest } from "@/features/auth/authApi";
import { sessaoDoToken } from "@/features/auth/session";
import type { Sessao } from "@/types";

interface AuthContextValue {
  sessao: Sessao | null;
  autenticado: boolean;
  entrar: (login: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(() =>
    sessaoDoToken(getToken()),
  );

  const entrar = useCallback(async (login: string, senha: string) => {
    const auth = await loginRequest({ login, password: senha });
    setToken(auth.token);
    const nova = sessaoDoToken(auth.token);
    setSessao(nova);
  }, []);

  const sair = useCallback(() => {
    clearToken();
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
