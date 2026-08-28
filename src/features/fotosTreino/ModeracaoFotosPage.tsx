import { toast } from "sonner";
import { ImageOff, Check, EyeOff, ShieldCheck, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import {
  useFotosTreino,
  usePublicarFoto,
  useExcluirFotoTreino,
  usePreviaFoto,
  usePoloFotoConfigs,
  useDefinirPoloFotoConfig,
  CATEGORIA_LABEL,
  type FotoTreino,
} from "@/features/fotosTreino/fotosTreinoApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Miniatura: usa a URL pública quando já publicada; senão, a prévia (base64)
// autenticada — porque <img> não envia token para uma foto pendente.
function Miniatura({ foto }: { foto: FotoTreino }) {
  const { data: previa, isLoading } = usePreviaFoto(foto.publicada ? null : foto.id);
  const src = foto.publicada ? foto.url : previa;

  if (!foto.publicada && isLoading) {
    return <Skeleton className="aspect-video w-full rounded-md" />;
  }
  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ImageOff className="size-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={foto.legenda ?? "Foto de treino"}
      className="aspect-video w-full rounded-md object-cover"
    />
  );
}

function FotoCard({ foto }: { foto: FotoTreino }) {
  const publicar = usePublicarFoto();
  const excluir = useExcluirFotoTreino();

  async function definir(publicada: boolean) {
    try {
      await publicar.mutateAsync({ id: foto.id, publicada });
      toast.success(publicada ? "Foto publicada." : "Foto retirada do álbum.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar.");
    }
  }

  async function remover() {
    try {
      await excluir.mutateAsync(foto.id);
      toast.success("Foto removida.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        <Miniatura foto={foto} />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {foto.categoria === "polo"
                ? `${foto.poloNome ?? "Polo"} · Turma ${foto.turma}`
                : CATEGORIA_LABEL[foto.categoria]}
            </div>
            <div className="text-xs text-muted-foreground">
              Aula: {dataBR(foto.dataAula)}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              foto.publicada
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
            }`}
          >
            {foto.publicada ? "Publicada" : "Pendente"}
          </span>
        </div>
        {foto.legenda && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{foto.legenda}</p>
        )}
        <div className="flex gap-1.5 pt-1">
          {foto.publicada ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => definir(false)}
              disabled={publicar.isPending}
            >
              <EyeOff className="size-4" />
              Despublicar
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => definir(true)}
              disabled={publicar.isPending}
            >
              <Check className="size-4" />
              Publicar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-destructive"
            title="Remover"
            onClick={remover}
            disabled={excluir.isPending}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Config por polo: exigir ou não aprovação antes de publicar.
function ConfigPolos() {
  const { data: configs, isLoading } = usePoloFotoConfigs();
  const definir = useDefinirPoloFotoConfig();

  async function alternar(poloId: number, requerAutorizacao: boolean) {
    try {
      await definir.mutateAsync({ poloId, requerAutorizacao });
      toast.success(
        requerAutorizacao
          ? "Fotos deste polo passarão por aprovação."
          : "Fotos deste polo serão publicadas automaticamente.",
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar.");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="text-sm font-semibold">Aprovação por polo</div>
        <p className="text-xs text-muted-foreground">
          Desmarque um polo para as fotos dele entrarem{" "}
          <span className="font-medium text-foreground">já publicadas</span>, sem moderação.
        </p>
        {isLoading && <Skeleton className="h-8 w-full" />}
        <ul className="divide-y divide-border">
          {(configs ?? []).map((c) => (
            <li key={c.poloId} className="flex items-center justify-between py-2">
              <span className="text-sm">{c.poloNome}</span>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={c.requerAutorizacao}
                  onChange={(e) => alternar(c.poloId, e.target.checked)}
                  disabled={definir.isPending}
                />
                Exigir aprovação
              </label>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ModeracaoFotosPage() {
  const { data: fotos, isLoading } = useFotosTreino();
  const lista = fotos ?? [];
  const pendentes = lista.filter((f) => !f.publicada).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p>
          Fotos de treino enviadas pelos professores. Só as{" "}
          <span className="font-medium text-foreground">publicadas</span> aparecem no
          álbum público do site. {pendentes > 0 && (
            <span className="font-medium text-foreground">{pendentes} pendente(s).</span>
          )}
        </p>
      </div>

      <ConfigPolos />

      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && lista.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Nenhuma foto enviada ainda.
        </div>
      )}

      {!isLoading && lista.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((f) => (
            <FotoCard key={f.id} foto={f} />
          ))}
        </div>
      )}
    </div>
  );
}
