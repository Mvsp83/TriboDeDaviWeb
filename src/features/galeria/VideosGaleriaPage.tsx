import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Search, Trash2, Video } from "lucide-react";
import { ApiError } from "@/lib/api";
import { VideoSearchDialog } from "@/features/atividades/VideoSearchDialog";
import {
  useVideosGaleria,
  useSalvarVideoGaleria,
  useExcluirVideoGaleria,
  extrairYoutubeId,
  thumbYoutube,
  type VideoGaleria,
} from "@/features/galeria/videosGaleriaApi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export function VideosGaleriaPage() {
  const { data: videos, isLoading } = useVideosGaleria();
  const salvar = useSalvarVideoGaleria();
  const excluir = useExcluirVideoGaleria();

  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<VideoGaleria | null>(null);

  const lista = videos ?? [];
  const idPreview = extrairYoutubeId(url);

  async function adicionar() {
    if (!titulo.trim()) {
      toast.warning("Informe o título do vídeo.");
      return;
    }
    if (!idPreview) {
      toast.warning("Cole um link válido do YouTube.");
      return;
    }
    try {
      await salvar.mutateAsync({
        titulo: titulo.trim(),
        youtubeId: idPreview,
        url: url.trim(),
        descricao: descricao.trim(),
      });
      toast.success("Vídeo adicionado à galeria.");
      setUrl("");
      setTitulo("");
      setDescricao("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar o vídeo.");
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Vídeo removido.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <Video className="mt-0.5 size-4 shrink-0" />
        <p>
          Vídeos do canal do instituto no YouTube que aparecem na{" "}
          <span className="font-medium text-foreground">Galeria de vídeos</span> do site.
          Cole o link do YouTube e dê um título.
        </p>
      </div>

      {/* Adicionar */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <Label className="mb-1.5">Link do YouTube</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://youtu.be/... ou https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setBuscaAberta(true)}
                  title="Pesquisar vídeo no YouTube ou Google"
                >
                  <Search className="size-4" />
                </Button>
              </div>
              {url && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {idPreview ? `Vídeo reconhecido (${idPreview}).` : "Link não reconhecido."}
                </p>
              )}
            </div>
            {idPreview && (
              <img
                src={thumbYoutube(idPreview)}
                alt="Prévia"
                className="h-20 w-36 rounded-md object-cover"
              />
            )}
          </div>
          <div>
            <Label className="mb-1.5">Título</Label>
            <Input
              placeholder="ex: Graduação 2026 — melhores momentos"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5">Descrição (opcional)</Label>
            <Textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={adicionar}
              disabled={salvar.isPending || !idPreview || !titulo.trim()}
            >
              {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Adicionar vídeo
            </Button>
            {(!idPreview || !titulo.trim()) && (
              <span className="text-xs text-muted-foreground">
                Preencha {!idPreview ? "um link válido do YouTube" : ""}
                {!idPreview && !titulo.trim() ? " e " : ""}
                {!titulo.trim() ? "o título" : ""} para adicionar.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && lista.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhum vídeo na galeria ainda.
        </div>
      )}

      {!isLoading && lista.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((v) => (
            <Card key={v.id}>
              <CardContent className="space-y-2 p-3">
                <a
                  href={v.url || `https://youtu.be/${v.youtubeId}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir no YouTube"
                >
                  <img
                    src={thumbYoutube(v.youtubeId)}
                    alt={v.titulo}
                    className="aspect-video w-full rounded-md object-cover"
                  />
                </a>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{v.titulo}</div>
                    {v.descricao && (
                      <div className="line-clamp-1 text-xs text-muted-foreground">{v.descricao}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    title="Remover"
                    onClick={() => setParaExcluir(v)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VideoSearchDialog
        aberto={buscaAberta}
        onOpenChange={setBuscaAberta}
        termoInicial={titulo}
      />

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(v) => !v && setParaExcluir(null)}
        titulo="Remover vídeo?"
        descricao={
          <>
            O vídeo <strong>{paraExcluir?.titulo}</strong> sai da galeria do site.
          </>
        }
        confirmarLabel="Remover"
        destrutivo
        carregando={excluir.isPending}
        onConfirmar={confirmarExclusao}
      />
    </div>
  );
}
