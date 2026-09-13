import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Users, LogIn } from "lucide-react";
import { MarcaTribo } from "@/components/site/MarcaTribo";
import { temInformacoes } from "@/features/site/conteudoSite";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4">
        <Link to="/" onClick={fechar} className="flex items-center gap-3">
          <MarcaTribo className="w-8 text-primary" />
          <span className="font-display text-lg font-bold uppercase tracking-wide">
            Tribo de Davi
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden flex-1 items-center justify-end gap-x-4 md:flex">
          <nav className="flex items-center gap-x-5 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
            {LINKS.map((l) => (
              <Link
                key={l.para}
                to={l.para}
                className="transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link to="/responsavel">
                <Users className="size-4" />
                Responsável
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
                className="rounded-md px-2 py-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Button asChild size="lg">
                <Link to="/responsavel" onClick={fechar}>
                  <Users className="size-4" />
                  Área do Responsável
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
