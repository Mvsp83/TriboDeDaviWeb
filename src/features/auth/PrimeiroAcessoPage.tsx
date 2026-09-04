import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { primeiroAcesso } from "@/features/auth/authApi";
import { ApiError } from "@/lib/api";
import { PaginaPublica } from "@/components/PaginaPublica";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Bootstrap do primeiro administrador. Só funciona enquanto o sistema não tem
// nenhum usuário; em produção a API exige o "token de setup" (Setup:Token).
export function PrimeiroAcessoPage() {
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [token, setToken] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [pronto, setPronto] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!login.trim() || !email.trim() || !senha.trim()) {
      setErro("Preencha usuário, e-mail e senha.");
      return;
    }

    setCarregando(true);
    try {
      await primeiroAcesso({
        login: login.trim(),
        email: email.trim(),
        password: senha,
        token: token.trim() || undefined,
      });
      setPronto(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setErro(
          "Não foi possível criar. Ou já existe um administrador (use a tela de login), ou o token de setup está incorreto.",
        );
      } else {
        setErro(
          err instanceof ApiError
            ? err.message
            : "Falha ao criar o administrador. Tente novamente.",
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <PaginaPublica>
      <div className="relative flex min-h-[75svh] items-center justify-center overflow-hidden p-4">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #f5c518, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">Primeiro acesso</p>
            <h1 className="text-xl font-semibold text-foreground">
              Criar administrador
            </h1>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
            {pronto ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="size-12 text-primary" />
                <p className="text-foreground">
                  Administrador criado com sucesso!
                </p>
                <p className="text-sm text-muted-foreground">
                  Use o usuário <strong>{login}</strong> e a senha que você
                  definiu para entrar.
                </p>
                <Button
                  size="lg"
                  className="mt-2 w-full"
                  onClick={() => navigate("/login")}
                >
                  Ir para o login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="login">Usuário</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="admin"
                      autoComplete="username"
                      disabled={carregando}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                      autoComplete="email"
                      disabled={carregando}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="senha">Senha</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={carregando}
                      className="px-9"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {mostrarSenha ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="token">Token de setup</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="obrigatório em produção"
                      autoComplete="off"
                      disabled={carregando}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco se a API não tiver um token configurado.
                  </p>
                </div>

                {erro && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {erro}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="mt-1 w-full"
                  disabled={carregando}
                >
                  {carregando ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Criando…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      Criar administrador
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="self-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Já tenho conta — ir para o login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PaginaPublica>
  );
}
