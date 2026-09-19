import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Play,
  PlayCircle,
} from "lucide-react";
import {
  useFotosTreinoPublicas,
  CATEGORIA_LABEL,
  type FotoTreinoPublica,
} from "@/features/fotosTreino/fotosTreinoApi";
import {
  useVideosGaleria,
  thumbYoutube,
  embedYoutube,
  type VideoGaleria,
} from "@/features/galeria/videosGaleriaApi";
import { SITE } from "@/features/site/conteudoSite";
import { dataBR } from "@/lib/format";
import { midiaUrl } from "@/lib/api";
import { PaginaSite, SecaoSite } from "@/components/site/PecasSite";
import { BotaoSite } from "@/components/site/ElementosSite";

interface Opcao {
  id: string;
  label: string;
  fotos: FotoTreinoPublica[];
}

// Galeria pública no visual novo. Os dados são os reais do repo: um álbum por
// polo (fotos dos professores) + as coleções do admin (Graduações, Geral,
// Eventos), com lightbox de fotos e player de vídeos do YouTube.
export function GaleriaPage() {
  const { data: fotos } = useFotosTreinoPublicas();
  const { data: videos } = useVideosGaleria();
  const [selId, setSelId] = useState<string | null>(null);
  const [ampliada, setAmpliada] = useState<FotoTreinoPublica | null>(null);
  const [videoAberto, setVideoAberto] = useState<VideoGaleria | null>(null);

  const listaVideos = videos ?? [];

  const opcoes = useMemo<Opcao[]>(() => {
    const lista = fotos ?? [];

    const nomesPolo = [
      ...new Set(
        lista
          .filter((f) => f.categoria === "polo")
          .map((f) => f.poloNome?.trim() || "Polo"),
      ),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));

    const dePolo: Opcao[] = nomesPolo.map((nome) => ({
      id: `polo:${nome}`,
      label: nome,
      fotos: lista.filter(
        (f) => f.categoria === "polo" && (f.poloNome?.trim() || "Polo") === nome,
      ),
    }));

    const cats = ["graduacoes", "eventos", "geral"] as const;
    const deCategoria: Opcao[] = cats
      .map((cat) => ({
        id: cat,
        label: CATEGORIA_LABEL[cat],
        fotos: lista.filter((f) => f.categoria === cat),
      }))
      .filter((o) => o.fotos.length > 0);

    return [...dePolo, ...deCategoria];
  }, [fotos]);

  const selecionada = opcoes.find((o) => o.id === selId) ?? null;
  const temFotos = opcoes.length > 0;

  // Lightbox: anterior/próxima dentro da coleção aberta (com giro).
  const fotosColecao = selecionada?.fotos ?? [];
  const idxAmpliada = ampliada
    ? fotosColecao.findIndex((f) => f.id === ampliada.id)
    : -1;
  const navegar = (delta: number) => {
    if (idxAmpliada < 0 || fotosColecao.length === 0) return;
    const n = fotosColecao.length;
    setAmpliada(fotosColecao[(idxAmpliada + delta + n) % n]);
  };

  useEffect(() => {
    if (!ampliada) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navegar(-1);
      else if (e.key === "ArrowRight") navegar(1);
      else if (e.key === "Escape") setAmpliada(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ampliada, idxAmpliada, fotosColecao]);

  return (
    <PaginaSite
      titulo="Galeria"
      subtitulo="Treinos, graduações e eventos do projeto. Escolha uma coleção para ver as fotos."
      tituloDocumento={`Galeria de fotos — ${SITE.nome}`}
    >
      <SecaoSite>
        {!temFotos ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
            Em breve — as fotos aparecerão aqui.
          </p>
        ) : !selecionada ? (
          // Álbuns (polos + coleções) no card novo.
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {opcoes.map((o, i) => {
              const capa = o.fotos[0]?.url
                ? `${midiaUrl(o.fotos[0].url)}?mini=true`
                : undefined;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelId(o.id)}
                  className={`revela-${(i % 3) + 1} group overflow-hidden rounded-xl border border-border bg-card text-left transition-[transform,border-color] duration-[var(--dur-base)] ease-[var(--ease-out-premium)] hover:-translate-y-1.5 hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                >
                  <div className="aspect-square overflow-hidden bg-secondary">
                    {capa ? (
                      <img
                        src={capa}
                        alt={o.label}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-premium)] group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-8" />
                      </span>
                    )}
                  </div>
                  <div className="p-3.5">
                    <p className="truncate font-display text-[15px] font-semibold uppercase tracking-wide group-hover:text-primary">
                      {o.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {o.fotos.length} foto{o.fotos.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelId(null)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-[gap,color] duration-[var(--dur-fast)] hover:gap-3.5 hover:text-primary"
              >
                <ArrowLeft className="size-4" />
                Todas as coleções
              </button>
              <h2 className="font-display text-xl font-semibold uppercase tracking-tight md:text-2xl">
                {selecionada.label}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
              {selecionada.fotos.map((f) => (
                <figure
                  key={f.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setAmpliada(f)}
                    className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img
                      src={`${midiaUrl(f.url)}?mini=true`}
                      alt={f.legenda ?? selecionada.label}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition-transform duration-[var(--dur-base)] hover:scale-105"
                    />
                  </button>
                  <figcaption className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {dataBR(f.dataAula)}
                      {f.categoria === "polo" ? ` · Turma ${f.turma}` : ""}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </SecaoSite>

      {/* Vídeos (YouTube) */}
      {listaVideos.length > 0 && (
        <SecaoSite titulo="Vídeos" className="!pt-0">
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {listaVideos.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVideoAberto(v)}
                className={`revela-${(i % 3) + 1} group overflow-hidden rounded-xl border border-border bg-card text-left transition-[transform,border-color] duration-[var(--dur-base)] ease-[var(--ease-out-premium)] hover:-translate-y-1.5 hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
              >
                <div className="relative aspect-video overflow-hidden bg-secondary">
                  <img
                    src={thumbYoutube(v.youtubeId)}
                    alt={v.titulo}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-[var(--dur-base)] group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-13 items-center justify-center rounded-full border border-border bg-background/70 transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-premium)] group-hover:scale-110">
                      <Play className="size-5 fill-primary text-primary" />
                    </span>
                  </span>
                </div>
                <div className="p-3.5">
                  <p className="line-clamp-2 text-sm font-semibold group-hover:text-primary">
                    {v.titulo}
                  </p>
                  {v.descricao && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {v.descricao}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </SecaoSite>
      )}

      <SecaoSite className="!pt-0">
        <p className="text-xs leading-relaxed text-muted-foreground">
          As imagens são publicadas com autorização dos responsáveis. Para
          solicitar a remoção de alguma foto, fale com a coordenação do polo.
        </p>
        <div className="revela mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-[linear-gradient(115deg,var(--color-card)_55%,color-mix(in_oklab,var(--color-brand-red)_14%,var(--color-card))_100%)] px-7 py-6">
          <p className="font-display text-xl font-medium uppercase tracking-tight">
            Gostou do que vê? Ajude a manter o projeto.
          </p>
          <BotaoSite to="/doar">Doar por Pix</BotaoSite>
        </div>
      </SecaoSite>

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

          {fotosColecao.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-4"
                onClick={(e) => {
                  e.stopPropagation();
                  navegar(-1);
                }}
                aria-label="Foto anterior"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-4"
                onClick={(e) => {
                  e.stopPropagation();
                  navegar(1);
                }}
                aria-label="Próxima foto"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <figure className="max-h-[90svh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={midiaUrl(ampliada.url)}
              alt={ampliada.legenda ?? "Foto do Instituto Tribo de Davi"}
              className="max-h-[85svh] w-auto rounded-lg object-contain"
            />
            <figcaption className="mt-2 text-center text-sm text-white/80">
              {[dataBR(ampliada.dataAula), ampliada.legenda].filter(Boolean).join(" · ")}
              {fotosColecao.length > 1 && (
                <span className="ml-2 text-white/50">
                  {idxAmpliada + 1}/{fotosColecao.length}
                </span>
              )}
            </figcaption>
          </figure>
        </div>
      )}

      {/* Player do vídeo */}
      {videoAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setVideoAberto(null)}
          role="dialog"
          aria-modal="true"
          aria-label={videoAberto.titulo}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setVideoAberto(null)}
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                src={`${embedYoutube(videoAberto.youtubeId)}?autoplay=1&rel=0`}
                title={videoAberto.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/80">
              <span>{videoAberto.titulo}</span>
              <a
                href={videoAberto.url || `https://youtu.be/${videoAberto.youtubeId}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <PlayCircle className="size-4" /> Abrir no YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </PaginaSite>
  );
}
