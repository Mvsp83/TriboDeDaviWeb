import { PlayCircle, Pencil, ShieldAlert } from "lucide-react";
import { extrairVideoId, urlEmbed } from "@/lib/youtube";
import { CATEGORIA_LABEL, type Posicao } from "./tipos";
import { useConfigGraduacao } from "./graduacaoApi";
import { acharGolpe, divisoesRestritas } from "./restricao";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function tagsDe(p: Posicao): string[] {
  return (p.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// Visualização somente leitura de uma posição — descrição, vídeo e transcrição,
// sem entrar no modo de edição. O botão "Editar" abre o formulário.
export function PosicaoDetalhesDialog({
  posicao,
  onOpenChange,
  onEditar,
}: {
  posicao: Posicao | null;
  onOpenChange: (aberto: boolean) => void;
  onEditar: (p: Posicao) => void;
}) {
  const { data: cfg } = useConfigGraduacao();
  const tags = posicao ? tagsDe(posicao) : [];
  const videoId = extrairVideoId(posicao?.videoUrl);
  const golpe = acharGolpe(cfg, posicao?.golpeRestritoId);
  const restricoes = golpe ? divisoesRestritas(golpe) : [];

  return (
    <Dialog open={posicao !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{posicao?.nome}</DialogTitle>
          <DialogDescription className={posicao?.nomeEn ? "" : "sr-only"}>
            {posicao?.nomeEn || "Detalhes da posição."}
          </DialogDescription>
        </DialogHeader>

        {posicao && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {CATEGORIA_LABEL[posicao.categoria] ?? posicao.categoria}
              </Badge>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            {videoId && (
              <div className="aspect-video w-full overflow-hidden rounded-md border border-border">
                <iframe
                  src={urlEmbed(videoId)}
                  title="Vídeo da posição"
                  className="h-full w-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {golpe && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="size-4" /> Restrição por idade/faixa
                </p>
                <p className="mt-0.5 text-muted-foreground">{golpe.descricao}</p>
                {restricoes.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {restricoes.map((r) => (
                      <span
                        key={r.curto}
                        title={`${r.label} — ${r.severidade === "gravissima" ? "Falta gravíssima" : "Falta grave"}`}
                        className={`rounded-md px-1.5 py-0.5 text-xs ${
                          r.severidade === "gravissima"
                            ? "bg-red-600/15 text-red-700 dark:text-red-400"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {r.curto}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sem divisões marcadas — ajuste na tela de Golpes Restritos.
                  </p>
                )}
              </div>
            )}

            <Campo titulo="Descrição" valor={posicao.descricao} />
            <Campo titulo="Transcrição do vídeo" valor={posicao.transcricao} />

            {posicao.videoUrl && (
              <a
                href={posicao.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <PlayCircle className="size-4" /> Abrir no YouTube
              </a>
            )}

            {!posicao.descricao && !posicao.transcricao && !posicao.videoUrl && (
              <p className="text-muted-foreground">
                Sem descrição, vídeo ou transcrição ainda. Use "Editar" para
                preencher.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {posicao && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEditar(posicao);
              }}
            >
              <Pencil className="size-4" /> Editar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ titulo, valor }: { titulo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div>
      <p className="mb-0.5 font-medium text-foreground">{titulo}</p>
      <p className="whitespace-pre-wrap text-muted-foreground">{valor}</p>
    </div>
  );
}
