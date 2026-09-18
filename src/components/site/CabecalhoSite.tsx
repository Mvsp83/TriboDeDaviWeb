import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Users, LogIn } from "lucide-react";
import { MarcaTribo } from "@/components/site/MarcaTribo";
import { temInformacoes } from "@/features/site/conteudoSite";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Cabeçalho único de todo o site público (home + telas de menu + login).
const LINKS: { label: string; para: string }[] = [
  { label: "Início", para: "/" },
  { label: "História", para: "/historia" },
  { label: "Galeria", para: "/galeria" },
  { label: "Loja", para: "/loja" },
  ...(temInformacoes() ? [{ label: "Informações", para: "/informacoes" }] : []),
  { label: "Transparência", para: "/transparencia" },
];

export function CabecalhoSite() {
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);
  const { pathname } = useLocation();

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4 md:px-8">
        <Link to="/" onClick={fechar} className="flex items-center gap-3">
          <MarcaTribo className="w-8 text-primary" />
          <span className="flex flex-col font-display font-bold uppercase leading-none">
            <span className="text-[0.7rem] tracking-[0.25em] text-muted-foreground">
              Instituto
            </span>
            <span className="text-lg tracking-wide">Tribo de Davi</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden flex-1 items-center justify-end gap-x-5 md:flex">
          <nav className="flex items-center gap-x-6 font-display text-sm font-medium uppercase tracking-wider">
            {LINKS.map((l) => {
              const ativo = pathname === l.para;
              return (
                <Link
                  key={l.para}
                  to={l.para}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    // O filete embaixo é o estado: dourado na página atual,
                    // vermelho da faixa no hover. Sem salto de layout — a
                    // borda existe sempre, só muda de cor.
                    "border-b-2 py-1.5 transition-colors duration-[var(--dur-fast)]",
                    ativo
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-brand-red hover:text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="transition-[transform,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out-premium)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_var(--color-primary)]"
            >
              <Link to="/responsavel">
                <Users className="size-4" />
                Aluno
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">
                <LogIn className="size-4" />
                Equipe
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="inline-flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary md:hidden"
          aria-label="Abrir menu"
          aria-expanded={aberto}
        >
          {aberto ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>

      {aberto && (
        <div className="border-t border-border md:hidden">
          <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-4 pb-4 pt-1 font-display text-sm uppercase tracking-wide">
            {LINKS.map((l) => (
              <Link
                key={l.para}
                to={l.para}
                onClick={fechar}
                className={cn(
                  "rounded-md px-2 py-2.5 transition-colors hover:bg-secondary hover:text-foreground",
                  pathname === l.para
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Button asChild size="lg">
                <Link to="/responsavel" onClick={fechar}>
                  <Users className="size-4" />
                  Área do Aluno
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login" onClick={fechar}>
                  <LogIn className="size-4" />
                  Acesso da equipe
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
