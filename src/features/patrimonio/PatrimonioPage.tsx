import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Download, FileDown } from "lucide-react";
import { usePolos } from "@/features/polos/polosApi";
import { useBens, useExcluirBem } from "@/features/patrimonio/patrimonioApi";
import { BemFormDialog } from "@/features/patrimonio/BemFormDialog";
import { exportarPatrimonioPdf } from "@/features/patrimonio/patrimonioPdf";
import {
  CATEGORIA_BEM_LABEL,
  ESTADO_BEM_LABEL,
  CATEGORIAS_BEM,
} from "@/features/patrimonio/tipos";
import { baixarCsv } from "@/features/administrativo/financeiro/exportar";
import { moeda, dataCurtaBR } from "@/lib/format";
import { ApiError } from "@/lib/api";
import type { BemPatrimonial } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { IdRef } from "@/components/IdRef";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PatrimonioPage() {
  const { data: bens, isLoading } = useBens();
  const { data: polos } = usePolos();
  const excluir = useExcluirBem();

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroPolo, setFiltroPolo] = useState("todos");

  const [dialog, setDialog] = useState(false);
  const [emEdicao, setEmEdicao] = useState<BemPatrimonial | null>(null);
  const [paraExcluir, setParaExcluir] = useState<BemPatrimonial | null>(null);

  const nomePorPolo = useMemo(
    () => new Map((polos ?? []).map((p) => [p.id, p.nome])),
    [polos],
  );
  const nomePolo = (id: number | null | undefined) =>
    id == null ? "Geral" : nomePorPolo.get(id) ?? "-";

  const filtrados = useMemo(() => {
    const q = filtroTexto.toLocaleLowerCase("pt-BR");
    return (bens ?? [])
      .filter(
        (b) =>
          !q ||
          b.descricao.toLocaleLowerCase("pt-BR").includes(q) ||
          (b.numeroPatrimonio ?? "").toLocaleLowerCase("pt-BR").includes(q),
      )
      .filter((b) => filtroCategoria === "todas" || b.categoria === Number(filtroCategoria))
      .filter(
        (b) =>
          filtroPolo === "todos" ||
          (filtroPolo === "geral" ? b.poloId == null : b.poloId === Number(filtroPolo)),
      );
  }, [bens, filtroTexto, filtroCategoria, filtroPolo]);

  const totalValor = useMemo(
    () => filtrados.reduce((s, b) => s + b.quantidade * b.valorUnitario, 0),
    [filtrados],
  );

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Bem removido.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  function exportarCsv() {
    baixarCsv(
      `patrimonio-${new Date().toISOString().slice(0, 10)}`,
      ["Categoria", "Descrição", "Qtd", "Valor unitário", "Valor total", "Estado", "Polo", "Nº patrimônio", "Aquisição", "Observações"],
      filtrados.map((b) => [
        CATEGORIA_BEM_LABEL[b.categoria] ?? "",
        b.descricao,
        b.quantidade,
        b.valorUnitario.toFixed(2),
        (b.quantidade * b.valorUnitario).toFixed(2),
        ESTADO_BEM_LABEL[b.estado] ?? "",
        nomePolo(b.poloId),
        b.numeroPatrimonio ?? "",
        b.dataAquisicao ? dataCurtaBR(b.dataAquisicao) : "",
        b.observacoes ?? "",
      ]),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Carregando..."
            : `${filtrados.length} bem(ns) · total ${moeda(totalValor)}`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportarCsv} disabled={filtrados.length === 0}>
            <Download className="size-4" /> CSV
          </Button>
          <Button
            variant="outline"
            disabled={filtrados.length === 0}
            onClick={() => {
              const ok = exportarPatrimonioPdf(filtrados, nomePolo);
              if (!ok) toast.error("Permita pop-ups para o PDF.");
            }}
          >
            <FileDown className="size-4" /> PDF
          </Button>
          <Button
            onClick={() => {
              setEmEdicao(null);
              setDialog(true);
            }}
          >
            <Plus className="size-4" /> Novo bem
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Descrição ou nº de patrimônio"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-44">
            <Label className="mb-1.5">Categoria</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {CATEGORIAS_BEM.map((c) => (
                  <SelectItem key={c.valor} value={String(c.valor)}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-44">
            <Label className="mb-1.5">Polo</Label>
            <Select value={filtroPolo} onValueChange={setFiltroPolo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="geral">Geral</SelectItem>
                {(polos ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor unit.</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Polo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Nenhum bem cadastrado. Comece adicionando um.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtrados.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Badge variant="outline">{CATEGORIA_BEM_LABEL[b.categoria]}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <IdRef id={b.id} />
                      {b.descricao}
                      {b.numeroPatrimonio ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          #{b.numeroPatrimonio}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{b.quantidade}</TableCell>
                    <TableCell className="text-right tabular-nums">{moeda(b.valorUnitario)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {moeda(b.quantidade * b.valorUnitario)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ESTADO_BEM_LABEL[b.estado]}</TableCell>
                    <TableCell className="text-muted-foreground">{nomePolo(b.poloId)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEmEdicao(b);
                            setDialog(true);
                          }}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setParaExcluir(b)}
                          aria-label="Excluir"
                          className="text-destructive hover:text-destructive"
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

      <BemFormDialog
        aberto={dialog}
        onOpenChange={setDialog}
        bem={emEdicao}
        polos={polos ?? []}
      />

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(o) => !o && setParaExcluir(null)}
        titulo="Excluir bem"
        descricao={
          <>
            Excluir <strong>{paraExcluir?.descricao}</strong> do patrimônio?
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
