import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LogIn, User, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { ApiError } from "@/lib/api";
import { LogoLockup } from "@/components/Logo";
import { PaginaPublica } from "@/components/PaginaPublica";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const { entrar, autenticado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  // Segunda etapa: exibida quando a API responde que o usuário tem 2FA.
  const [etapa2fa, setEtapa2fa] = useState(false);
  const [codigo2fa, setCodigo2fa] = useState("");

  const destino =
    (location.state as { from?: string } | null)?.from ?? "/";

  if (autenticado) {
    return <Navigate to={destino} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!etapa2fa && (!login.trim() || !senha.trim())) {
      setErro("Preencha o usuário e a senha.");
      return;
    }
    if (etapa2fa && !codigo2fa.trim()) {
      setErro("Informe o código do aplicativo autenticador.");
      return;
    }

    setCarregando(true);
    try {
      const resultado = await entrar(
        login.trim(),
        senha,
        etapa2fa ? codigo2fa.trim() : undefined,
      );

      if (resultado.requer2fa) {
        // Senha certa; agora pede o segundo fator.
        setEtapa2fa(true);
        return;
      }

      navigate(destino, { replace: true });
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status !== undefined
          ? etapa2fa
            ? "Código inválido. Tente novamente."
            : err.message || "Usuário ou senha inválidos."
          : "Erro ao conectar com o servidor. Tente novamente em instantes.",
      );
    } finally {
      setCarregando(false);
    }
  }

  function voltarDoLogin2fa() {
    setEtapa2fa(false);
    setCodigo2fa("");
    setErro("");
  }

  return (
    <PaginaPublica>
    <div className="relative flex min-h-[75svh] items-center justify-center overflow-hidden p-4">
      {/* Brilho dourado de fundo */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(circle, #f5c518, transparent 70%)" }}
      />

      {/* Símbolo do instituto em destaque, como marca-d'água de fundo */}
      <img
        src="/simbolo.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-1/2 w-[46rem] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.08] blur-[1px]"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <LogoLockup className="h-24" />
          <p className="text-sm text-muted-foreground">
            Portal Administrativo
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!etapa2fa ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="login">Usuário</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="seu.usuario"
                      autoComplete="username"
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
                      autoComplete="current-password"
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
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  Verificação em duas etapas
                </div>
                <Label htmlFor="codigo2fa">Código do app autenticador</Label>
                <Input
                  id="codigo2fa"
                  value={codigo2fa}
                  onChange={(e) =>
                    setCodigo2fa(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={carregando}
                  className="text-center text-lg tracking-[0.4em]"
                />
                <button
                  type="button"
                  onClick={voltarDoLogin2fa}
                  className="self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Voltar
                </button>
              </div>
            )}

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
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  {etapa2fa ? "Verificar" : "Entrar"}
                </>
              )}
            </Button>
          </form>
        </div>

      </div>
    </div>
    </PaginaPublica>
  );
}
