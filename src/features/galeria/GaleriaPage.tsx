import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  CalendarDays,
  X,
  HeartHandshake,
  ArrowLeft,
  Image as ImageIcon,
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
import { Video, Play, PlayCircle } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { dataBR } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { PaginaPublica } from "@/components/PaginaPublica";

interface Opcao {
  id: string;
  label: string;
  fotos: FotoTreinoPublica[];
}

// Galeria pública organizada em opções: um álbum por polo (fotos dos professores)
// + as coleções do admin (Graduações, Geral, Eventos). Clicar numa opção abre as
// fotos daquela coleção.
export function GaleriaPage() {
  useDocumentTitle(`Galeria de fotos — ${SITE.nome}`);

  const { data: fotos } = useFotosTreinoPublicas();
  const { data: videos } = useVideosGaleria();
  const [selId, setSelId] = useState<string | null>(null);
  const [ampliada, setAmpliada] = useState<FotoTreinoPublica | null>(null);
  const [videoAberto, setVideoAberto] = useState<VideoGaleria | null>(null);

  const listaVideos = videos ?? [];

  const opcoes = useMemo<Opcao[]>(() => {
    const lista = fotos ?? [];

    // Um álbum por polo (categoria "polo"), na ordem alfabética.
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

    // Coleções do admin, na ordem Graduações → Eventos → Geral.
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

  return (
    <PaginaPublica>
      {/* Título */}
      <section className="mx-auto max-w-5xl px-4 pb-6 pt-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
          <Camera className="size-7 text-primary" />
          Galeria de fotos
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Momentos das aulas, graduações e eventos do projeto. Escolha uma coleção.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        {!temFotos ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Em breve — as fotos aparecerão aqui.
          </div>
        ) : !selecionada ? (
          // Tela principal: as opções (polos + coleções).
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {opcoes.map((o) => {
              const capa = o.fotos[0]?.url;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelId(o.id)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="aspect-square w-full overflow-hidden bg-secondary">
                    {capa ? (
                      <img
                        src={capa}
                        alt={o.label}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-8" />
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-2">
                    <span className="block truncate font-semibold text-foreground group-hover:text-primary">
                      {o.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {o.fotos.length} foto{o.fotos.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          // Fotos da opção selecionada.
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelId(null)}>
                <ArrowLeft className="size-4" />
                Todas as coleções
              </Button>
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                {selecionada.label}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                      src={f.url}
                      alt={f.legenda ?? selecionada.label}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition-transform hover:scale-105"
                    />
                  </button>
                  <figcaption className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
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
      </section>

      {/* Galeria de vídeos (YouTube) */}
      {listaVideos.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-12">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
            <Video className="size-6 text-primary" />
            Galeria de vídeos
          </h2>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Vídeos do canal do instituto no YouTube.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {listaVideos.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVideoAberto(v)}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-primary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                  <img
                    src={thumbYoutube(v.youtubeId)}
                    alt={v.titulo}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Play className="size-6" />
                    </span>
                  </span>
                </div>
                <div className="px-3 py-2">
                  <span className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">
                    {v.titulo}
                  </span>
                  {v.descricao && (
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {v.descricao}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

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
            <figcaption className="mt-2 text-center text-sm text-white/80">
              {[dataBR(ampliada.dataAula), ampliada.legenda].filter(Boolean).join(" · ")}
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
    </PaginaPublica>
  );
}
