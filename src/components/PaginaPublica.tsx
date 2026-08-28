import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { SobreApp } from "@/components/SobreApp";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Casca padrão das páginas públicas (fora da home): cabeçalho com o logo à
// esquerda e "Voltar" à direita, e o rodapé único do site. A home tem cabeçalho
// próprio (menu + botões) e não usa esta casca.
export function PaginaPublica({
  children,
  larguraMax = "max-w-5xl",
}: {
  children: ReactNode;
  larguraMax?: string;
}) {
  const navigate = useNavigate();
  const anoAtual = new Date().getFullYear();

  // Volta para a página anterior; se não houver histórico interno (link direto,
  // recarga ou redirecionamento), cai na home. Usa o índice do histórico do
  // React Router (idx) — critério confiável: idx === 0 = primeira entrada, então
  // navigate(-1) seria um no-op e vamos para a home.
  const voltar = () => {
    const idx =
      (typeof window !== "undefined" &&
        (window.history.state as { idx?: number } | null)?.idx) ||
      0;
    if (idx > 0) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header
        className={cn(
          "mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-5",
          larguraMax,
        )}
      >
        <Link to="/" className="inline-flex items-center" aria-label={SITE.nome}>
          <img src="/logo.png" alt={SITE.nome} className="h-12 w-auto md:h-14" />
        </Link>
        <Button variant="ghost" size="sm" onClick={voltar}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div
          className={cn(
            "mx-auto flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-muted-foreground",
            larguraMax,
          )}
        >
          <span>
            © {anoAtual} {SITE.nome}
          </span>
          <SobreApp className="font-medium transition-colors hover:text-foreground" />
          <div className="flex items-center gap-x-6">
            <Link to="/responsavel" className="hover:text-foreground">
              Área do Responsável
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Acesso da equipe
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
