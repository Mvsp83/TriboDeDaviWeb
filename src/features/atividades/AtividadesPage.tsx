import { useMemo, useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import {
  useAtividades,
  useExcluirAtividade,
} from "@/features/atividades/atividadesApi";
import { AtividadeFormDialog } from "@/features/atividades/AtividadeFormDialog";
import { AtividadeDetalhesDialog } from "@/features/atividades/AtividadeDetalhesDialog";
import { VideoDialog } from "@/features/atividades/VideoDialog";
import { extrairVideoId } from "@/lib/youtube";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TIPO_BLOCO_LABEL, TIPOS_BLOCO, type Atividade } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function tagsDe(a: Atividade): string[] {
  return (a.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function AtividadesPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;

  const { data: atividades, isLoading, isError } = useAtividades();
  const excluir = useExcluirAtividade();

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<number | null>(null);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Atividade | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Atividade | null>(null);
  const [videoAtividade, setVideoAtividade] = useState<Atividade | null>(null);
  const [detalhes, setDetalhes] = useState<Atividade | null>(null);

  const filtradas = useMemo(() => {
    const q = filtroTexto.toLocaleLowerCase("pt-BR");
    return (atividades ?? [])
      .filter(
        (a) =>
          !q ||
          a.nome.toLocaleLowerCase("pt-BR").includes(q) ||
          (a.tags ?? "").toLocaleLowerCase("pt-BR").includes(q),
      )
      .filter((a) => filtroTipo === null || a.tipo === filtroTipo)
      .sort((a, b) => a.tipo - b.tipo || a.nome.localeCompare(b.nome, "pt-BR"));
  }, [atividades, filtroTexto, filtroTipo]);

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Atividade excluída.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao excluir a atividade.",
      );
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${filtradas.length} atividade(s)`}
        </p>
        <Button
          onClick={() => {
            setEmEdicao(null);
            setDialogAberto(true);
          }}
        >
          <Plus className="size-4" />
          Nova atividade
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nome ou tag"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TIPOS_BLOCO.map((t) => {
              const ativo = filtroTipo === t.valor;
              return (
                <button
                  key={t.valor}
                  onClick={() => setFiltroTipo(ativo ? null : t.valor)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    ativo
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-destructive">
                    Erro ao carregar as atividades. Tente novamente.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Nenhuma atividade cadastrada.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtradas.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        onClick={() => setDetalhes(a)}
                        className="text-left hover:text-primary hover:underline"
                      >
                        {a.nome}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TIPO_BLOCO_LABEL[a.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tagsDe(a).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setFiltroTexto(tag)}
                            className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetalhes(a)}
                          aria-label="Visualizar"
                        >
                          <Eye className="size-4" />
                        </Button>
                        {extrairVideoId(a.videoUrl) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setVideoAtividade(a)}
                            aria-label="Ver vídeo"
                            className="text-destructive hover:text-destructive"
                          >
                            <PlayCircle className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEmEdicao(a);
                            setDialogAberto(true);
                          }}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {admin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setParaExcluir(a)}
                            aria-label="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AtividadeFormDialog
        aberto={dialogAberto}
        onOpenChange={setDialogAberto}
        atividade={emEdicao}
      />

      <AtividadeDetalhesDialog
        atividade={detalhes}
        onOpenChange={(o) => !o && setDetalhes(null)}
      />

      <VideoDialog
        aberto={videoAtividade !== null}
        onOpenChange={(o) => !o && setVideoAtividade(null)}
        titulo={videoAtividade?.nome}
        videoUrl={videoAtividade?.videoUrl}
      />

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(o) => !o && setParaExcluir(null)}
        titulo="Excluir atividade"
        descricao={
          <>
            Tem certeza que deseja excluir{" "}
            <strong>{paraExcluir?.nome}</strong>? Ela será removida também dos
            planos que a utilizam.
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
