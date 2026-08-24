import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Video, Eye, ListChecks } from "lucide-react";
import { useConfigGraduacao, useExcluirPosicao } from "./graduacaoApi";
import { CATEGORIAS, CATEGORIA_LABEL, type Posicao } from "./tipos";
import { PosicaoFormDialog } from "./PosicaoFormDialog";
import { PosicaoDetalhesDialog } from "./PosicaoDetalhesDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PosicoesPage() {
  const { data: cfg } = useConfigGraduacao();
  const excluir = useExcluirPosicao();

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [editando, setEditando] = useState<Posicao | null>(null);
  const [vendo, setVendo] = useState<Posicao | null>(null);
  const [criando, setCriando] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Posicao | null>(null);

  const posicoes = cfg?.posicoes ?? [];

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return posicoes
      .filter((p) => categoria === "todas" || p.categoria === categoria)
      .filter(
        (p) =>
          !termo ||
          p.nome.toLowerCase().includes(termo) ||
          (p.nomeEn ?? "").toLowerCase().includes(termo) ||
          (p.tags ?? "").toLowerCase().includes(termo),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [posicoes, busca, categoria]);

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Posição removida.");
    } catch {
      toast.error("Erro ao remover a posição.");
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <ListChecks className="mt-0.5 size-4 shrink-0" />
        <p>
          Catálogo de posições e técnicas de jiu-jitsu. Cada posição pode ter
          vídeo de referência e transcrição, e é usada como requisito nos{" "}
          <span className="font-medium text-foreground">Programas de Graduação</span> e
          na apostila.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-48 flex-1">
            <Label className="mb-1.5">Buscar</Label>
            <Input
              placeholder="Nome, inglês ou tag"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="w-52">
            <Label className="mb-1.5">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.valor} value={c.valor}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="ml-auto" onClick={() => setCriando(true)}>
            <Plus className="size-4" />
            Nova posição
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vídeo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Nenhuma posição com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
              {lista.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => setVendo(p)}
                >
                  <TableCell>
                    <div className="font-medium">{p.nome}</div>
                    {p.nomeEn && (
                      <div className="text-xs text-muted-foreground">{p.nomeEn}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {CATEGORIA_LABEL[p.categoria] ?? p.categoria}
                  </TableCell>
                  <TableCell>
                    {p.videoUrl ? (
                      <Video className="size-4 text-red-600" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* stopPropagation: os botões não devem abrir o detalhe da linha. */}
                    <div
                      className="flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Ver detalhes"
                        onClick={() => setVendo(p)}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Editar"
                        onClick={() => setEditando(p)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        title="Excluir"
                        onClick={() => setParaExcluir(p)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PosicaoDetalhesDialog
        posicao={vendo}
        onOpenChange={(v) => !v && setVendo(null)}
        onEditar={(p) => setEditando(p)}
      />

      <PosicaoFormDialog aberto={criando} onOpenChange={setCriando} posicao={null} />
      <PosicaoFormDialog
        aberto={editando !== null}
        onOpenChange={(v) => !v && setEditando(null)}
        posicao={editando}
      />

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(v) => !v && setParaExcluir(null)}
        titulo="Excluir posição?"
        descricao={
          <>
            <strong>{paraExcluir?.nome}</strong> será removida do catálogo e de
            qualquer requisito que a use.
          </>
        }
        confirmarLabel="Excluir"
        destrutivo
        carregando={excluir.isPending}
        onConfirmar={confirmarExclusao}
      />
    </div>
  );
}
