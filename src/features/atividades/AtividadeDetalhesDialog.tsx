import { PlayCircle } from "lucide-react";
import { TIPO_BLOCO_LABEL, type Atividade } from "@/types";
import { urlSegura } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function tagsDe(a: Atividade): string[] {
  return (a.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// Visualização somente leitura de uma atividade — todos os campos, sem edição.
export function AtividadeDetalhesDialog({
  atividade,
  onOpenChange,
}: {
  atividade: Atividade | null;
  onOpenChange: (aberto: boolean) => void;
}) {
  const tags = atividade ? tagsDe(atividade) : [];

  return (
    <Dialog open={atividade !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{atividade?.nome}</DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes da atividade.
          </DialogDescription>
        </DialogHeader>

        {atividade && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{TIPO_BLOCO_LABEL[atividade.tipo]}</Badge>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Campo titulo="Descrição" valor={atividade.descricao} />
            <Campo titulo="Princípio" valor={atividade.principio} />
            <Campo
              titulo="Referência bíblica"
              valor={atividade.referenciaBiblica}
            />

            {urlSegura(atividade.videoUrl) && (
              <div>
                <p className="mb-1 font-medium text-foreground">Vídeo</p>
                <a
                  href={urlSegura(atividade.videoUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <PlayCircle className="size-4" /> Abrir vídeo
                </a>
              </div>
            )}
          </div>
        )}
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
