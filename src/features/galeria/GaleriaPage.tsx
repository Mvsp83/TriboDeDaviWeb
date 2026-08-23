import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  LogIn,
  Camera,
  CalendarDays,
  X,
  HeartHandshake,
} from "lucide-react";
import { GALERIA, totalFotosGaleria } from "@/features/galeria/conteudoGaleria";
import type { Foto } from "@/features/site/conteudoSite";
import { SITE } from "@/features/site/conteudoSite";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";

// Galeria pública de fotos por evento. Conteúdo curado (conteudoGaleria.ts),
// sem API. Um lightbox simples amplia a foto clicada.
export function GaleriaPage() {
  useDocumentTitle(`Galeria de fotos — ${SITE.nome}`);
  const anoAtual = new Date().getFullYear();
  const temFotos = totalFotosGaleria() > 0;

  // Foto ampliada no lightbox (null = fechado).
  const [ampliada, setAmpliada] = useState<Foto | null>(null);

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Topo */}
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src="/logo.png" alt={SITE.nome} className="h-10 w-auto md:h-12" />
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Voltar ao site
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">
              <LogIn className="size-4" />
              Acesso da equipe
            </Link>
          </Button>
        </div>
      </header>

      {/* Título */}
      <section className="mx-auto max-w-5xl px-4 pb-8 pt-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
          <Camera className="size-7 text-primary" />
          Galeria de fotos
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Momentos das aulas, graduações e competições do projeto, por evento.
        </p>
      </section>

      {/* Álbuns */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        {!temFotos ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Em breve — as fotos dos próximos eventos aparecerão aqui.
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {GALERIA.filter((a) => a.fotos.length > 0).map((album, i) => (
              <div key={i}>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {album.evento}
                  </h2>
                  {album.data && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />
                      {album.data}
                    </p>
                  )}
                  {album.descricao && (
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                      {album.descricao}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {album.fotos.map((f, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setAmpliada(f)}
                      className="group overflow-hidden rounded-xl border border-border bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img
                        src={f.url}
                        alt={f.legenda ?? `Foto do evento ${album.evento}`}
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Nota de consentimento — reforça a base legal (LGPD) */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <p className="text-xs text-muted-foreground">
          As imagens são publicadas com autorização dos responsáveis. Para
          solicitar a remoção de alguma foto, fale com a coordenação do polo.
        </p>
      </section>

      {/* Chamada de doação */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="font-medium">Gostou do que vê? Ajude a manter o projeto.</p>
          <Button asChild>
            <Link to="/doar">
              <HeartHandshake className="size-4" />
              Doar por Pix
            </Link>
          </Button>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground">
          <span>© {anoAtual} {SITE.nome}</span>
          <div className="flex items-center gap-x-6">
            <Link to="/" className="hover:text-foreground">Site</Link>
            <Link to="/transparencia" className="hover:text-foreground">Transparência</Link>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {ampliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setAmpliada(null)}
          role="dialog"
          aria-modal="true"
          aria-label={ampliada.legenda ?? "Foto ampliada"}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setAmpliada(null)}
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
          <figure className="max-h-[90svh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={ampliada.url}
              alt={ampliada.legenda ?? "Foto do Instituto Tribo de Davi"}
              className="max-h-[85svh] w-auto rounded-lg object-contain"
            />
            {ampliada.legenda && (
              <figcaption className="mt-2 text-center text-sm text-white/80">
                {ampliada.legenda}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </div>
  );
}
