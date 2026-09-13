import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Download, FileDown, Handshake, RotateCcw, History, FileText } from "lucide-react";
import { usePolos } from "@/features/polos/polosApi";
import { useAuth } from "@/features/auth/AuthContext";
import { useAlunosLista } from "@/features/alunos/alunosApi";
import { useBens, useExcluirBem, useDevolverBem } from "@/features/patrimonio/patrimonioApi";
import { BemFormDialog } from "@/features/patrimonio/BemFormDialog";
import { EmprestarBemDialog } from "@/features/patrimonio/EmprestarBemDialog";
import { HistoricoBemDialog } from "@/features/patrimonio/HistoricoBemDialog";
import { imprimirComodato } from "@/features/patrimonio/comodatoPdf";
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
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const { data: alunos } = useAlunosLista(admin);
  const excluir = useExcluirBem();
  const devolver = useDevolverBem();

  const nomePorAluno = useMemo(
    () => new Map((alunos ?? []).map((a) => [a.id, a.nome])),
    [alunos],
  );
  const nomeAluno = (id: number | null | undefined) =>
    id == null ? null : nomePorAluno.get(id) ?? `#${id}`;

  // Disponibilidade de itens emprestáveis (Quimono=0, Faixa=1) por tamanho:
  // conta unidades (1 linha = 1 peça) totais x emprestadas x livres.
  const disponibilidade = useMemo(() => {
    const grupos = new Map<
      string,
      { categoria: number; tamanho: string; total: number; emprestados: number }
    >();
    for (const b of bens ?? []) {
      if (b.categoria !== 0 && b.categoria !== 1) continue;
      const tam = (b.tamanho ?? "").trim() || "—";
      const chave = `${b.categoria}|${tam}`;
      const g =
        grupos.get(chave) ??
        { categoria: b.categoria, tamanho: tam, total: 0, emprestados: 0 };
      g.total += 1;
      if (b.alunoId != null) g.emprestados += 1;
      grupos.set(chave, g);
    }
    return [...grupos.values()].sort(
      (a, b) =>
        a.categoria - b.categoria || a.tamanho.localeCompare(b.tamanho, "pt-BR"),
    );
  }, [bens]);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroPolo, setFiltroPolo] = useState("todos");

  const [dialog, setDialog] = useState(false);
  const [emEdicao, setEmEdicao] = useState<BemPatrimonial | null>(null);
  const [paraExcluir, setParaExcluir] = useState<BemPatrimonial | null>(null);
  const [paraEmprestar, setParaEmprestar] = useState<BemPatrimonial | null>(null);
  const [verHistorico, setVerHistorico] = useState<BemPatrimonial | null>(null);

  async function devolverBem(b: BemPatrimonial) {
    try {
      await devolver.mutateAsync(b.id);
      toast.success("Devolução registrada.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao registrar a devolução.");
    }
  }

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
      ["Categoria", "Descrição", "Tamanho", "Cor", "Qtd", "Valor unitário", "Valor total", "Estado", "Polo", "Com quem está", "Nº patrimônio", "Aquisição", "Observações"],
      filtrados.map((b) => [
        CATEGORIA_BEM_LABEL[b.categoria] ?? "",
        b.descricao,
        b.tamanho ?? "",
        b.cor ?? "",
        b.quantidade,
        b.valorUnitario.toFixed(2),
        (b.quantidade * b.valorUnitario).toFixed(2),
        ESTADO_BEM_LABEL[b.estado] ?? "",
        nomePolo(b.poloId),
        nomeAluno(b.alunoId) ?? "",
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

      {disponibilidade.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium">
              Disponibilidade de quimonos e faixas (por tamanho)
            </p>
            <div className="flex flex-wrap gap-2">
              {disponibilidade.map((g) => {
                const livres = g.total - g.emprestados;
                return (
                  <div
                    key={`${g.categoria}-${g.tamanho}`}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div className="font-medium">
                      {CATEGORIA_BEM_LABEL[g.categoria]}{" "}
                      <span className="text-muted-foreground">{g.tamanho}</span>
                    </div>
                    <div className="mt-0.5 text-xs">
                      <span
                        className={
                          livres > 0
                            ? "font-semibold text-emerald-600 dark:text-emerald-400"
                            : "font-semibold text-muted-foreground"
                        }
                      >
                        {livres} livre{livres === 1 ? "" : "s"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        · {g.emprestados} emprestado{g.emprestados === 1 ? "" : "s"} · {g.total} no total
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                <TableHead>Com quem está</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
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
                      {b.descricao}
                      {b.numeroPatrimonio ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          #{b.numeroPatrimonio}
                        </span>
                      ) : null}
                      {(b.tamanho || b.cor) && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({[b.tamanho, b.cor].filter(Boolean).join(" · ")})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{b.quantidade}</TableCell>
                    <TableCell className="text-right tabular-nums">{moeda(b.valorUnitario)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {moeda(b.quantidade * b.valorUnitario)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ESTADO_BEM_LABEL[b.estado]}</TableCell>
                    <TableCell className="text-muted-foreground">{nomePolo(b.poloId)}</TableCell>
                    <TableCell>
                      {nomeAluno(b.alunoId) ? (
                        <Badge variant="secondary">{nomeAluno(b.alunoId)}</Badge>
                      ) : (b.categoria === 0 || b.categoria === 1) ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          Disponível
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(b.categoria === 0 || b.categoria === 1) && (
                          <>
                            {b.alunoId != null ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (!imprimirComodato(b, nomeAluno(b.alunoId) ?? ""))
                                      toast.error("Permita pop-ups para o PDF.");
                                  }}
                                  aria-label="Termo de comodato"
                                  title="Termo de comodato (PDF)"
                                >
                                  <FileText className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => devolverBem(b)}
                                  disabled={devolver.isPending}
                                  aria-label="Registrar devolução"
                                  title="Registrar devolução"
                                >
                                  <RotateCcw className="size-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setParaEmprestar(b)}
                                aria-label="Emprestar"
                                title="Emprestar"
                              >
                                <Handshake className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setVerHistorico(b)}
                              aria-label="Histórico de empréstimos"
                              title="Histórico de empréstimos"
                            >
                              <History className="size-4" />
                            </Button>
                          </>
                        )}
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

      <EmprestarBemDialog
        aberto={paraEmprestar !== null}
        onOpenChange={(o) => !o && setParaEmprestar(null)}
        bem={paraEmprestar}
        alunos={alunos ?? []}
      />

      <HistoricoBemDialog
        aberto={verHistorico !== null}
        onOpenChange={(o) => !o && setVerHistorico(null)}
        bem={verHistorico}
        nomeAluno={nomeAluno}
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
