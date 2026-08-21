import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Download,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { useContas, useExcluirConta } from "./contasApi";
import { useMovimentacoes, useExcluirMovimentacao } from "./movimentacoesApi";
import { ContaFormDialog } from "./ContaFormDialog";
import { MovimentacaoFormDialog } from "./MovimentacaoFormDialog";
import { TransferenciaFormDialog } from "./TransferenciaFormDialog";
import { saldoConta } from "./calculos";
import { AvisoMigracao } from "./AvisoMigracao";
import { baixarCsv } from "./exportar";
import {
  CATEGORIAS_APLICACAO,
  categoriaNome,
  type ContaFinanceira,
  type MovimentacaoFinanceira,
} from "./tipos";
import { ApiError } from "@/lib/api";
import { moeda, dataCurtaBR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

// Referência estável para o estado de carregamento (evita recomputar memos).
const SEM_MOVS: MovimentacaoFinanceira[] = [];

function Resumo({ label, valor, tom }: { label: string; valor: string; tom?: "positivo" | "negativo" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums",
          tom === "positivo" && "text-success",
          tom === "negativo" && "text-destructive",
        )}
      >
        {valor}
      </p>
    </div>
  );
}

export function AplicacoesPage() {
  const { data: contasTodas, isLoading, isError } = useContas();
  const { data: movs } = useMovimentacoes();
  const excluirConta = useExcluirConta();
  const excluirMov = useExcluirMovimentacao();

  const aplicacoes = useMemo(
    () => (contasTodas ?? []).filter((c) => c.tipo === "Aplicacao"),
    [contasTodas],
  );
  const movimentacoes = movs ?? SEM_MOVS;

  const [dialogConta, setDialogConta] = useState(false);
  const [contaEdicao, setContaEdicao] = useState<ContaFinanceira | null>(null);
  const [contaExcluir, setContaExcluir] = useState<ContaFinanceira | null>(null);

  const [dialogMov, setDialogMov] = useState(false);
  const [movEdicao, setMovEdicao] = useState<MovimentacaoFinanceira | null>(null);
  const [movExcluir, setMovExcluir] = useState<MovimentacaoFinanceira | null>(null);
  const [contaPadraoMov, setContaPadraoMov] = useState<number | null>(null);
  const [dialogTransf, setDialogTransf] = useState(false);

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const idsAplicacao = useMemo(
    () => new Set(aplicacoes.map((c) => c.id)),
    [aplicacoes],
  );

  // Lançamentos de todas as aplicações, filtrados pelo período.
  const lancamentos = useMemo(
    () =>
      movimentacoes
        .filter((m) => idsAplicacao.has(m.contaId))
        .filter((m) => (!inicio || m.data >= inicio) && (!fim || m.data <= fim))
        .sort((a, b) => (a.data === b.data ? b.id - a.id : b.data.localeCompare(a.data))),
    [movimentacoes, idsAplicacao, inicio, fim],
  );

  const totalAplicado = useMemo(
    () => aplicacoes.reduce((acc, c) => acc + saldoConta(c, movimentacoes), 0),
    [aplicacoes, movimentacoes],
  );

  const resumo = useMemo(() => {
    let aportes = 0;
    let resgates = 0;
    let rendimentos = 0;
    for (const m of lancamentos) {
      if (m.categoriaId === "aporte") aportes += m.valor;
      else if (m.categoriaId === "resgate") resgates += m.valor;
      else if (m.categoriaId === "rendimentos") rendimentos += m.valor;
    }
    return { aportes, resgates, rendimentos };
  }, [lancamentos]);

  const nomeConta = useMemo(() => {
    const m = new Map(aplicacoes.map((c) => [c.id, c.nome]));
    return (id: number) => m.get(id) ?? "-";
  }, [aplicacoes]);

  async function onExcluirConta() {
    if (!contaExcluir) return;
    try {
      await excluirConta.mutateAsync(contaExcluir.id);
      toast.success("Aplicação excluída.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir a aplicação.");
    } finally {
      setContaExcluir(null);
    }
  }

  async function onExcluirMov() {
    if (!movExcluir) return;
    try {
      await excluirMov.mutateAsync(movExcluir.id);
      toast.success("Lançamento excluído.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir o lançamento.");
    } finally {
      setMovExcluir(null);
    }
  }

  function novoLancamento(contaId: number | null) {
    setMovEdicao(null);
    setContaPadraoMov(contaId);
    setDialogMov(true);
  }

  function exportar() {
    baixarCsv(
      `aplicacoes-${new Date().toISOString().slice(0, 10)}`,
      ["Data", "Aplicação", "Descrição", "Categoria", "Valor"],
      lancamentos.map((m) => [
        dataCurtaBR(m.data),
        nomeConta(m.contaId),
        m.descricao,
        categoriaNome(m.categoriaId),
        (m.tipo === "Credito" ? m.valor : -m.valor).toFixed(2),
      ]),
    );
  }

  return (
    <div className="space-y-4">
      <AvisoMigracao />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Aplicações</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhamento das aplicações financeiras do instituto — aportes,
            resgates e rendimentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setContaEdicao(null);
              setDialogConta(true);
            }}
          >
            <TrendingUp className="size-4" />
            Nova aplicação
          </Button>
          <Button
            variant="outline"
            disabled={(contasTodas?.length ?? 0) < 2}
            onClick={() => setDialogTransf(true)}
          >
            <ArrowLeftRight className="size-4" />
            Transferência
          </Button>
          <Button disabled={aplicacoes.length === 0} onClick={() => novoLancamento(null)}>
            <Plus className="size-4" />
            Novo lançamento
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Erro ao carregar as aplicações.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && aplicacoes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <TrendingUp className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma aplicação cadastrada ainda. Cadastre a primeira aplicação
              financeira do instituto.
            </p>
            <Button
              onClick={() => {
                setContaEdicao(null);
                setDialogConta(true);
              }}
            >
              <Plus className="size-4" />
              Nova aplicação
            </Button>
          </CardContent>
        </Card>
      )}

      {aplicacoes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Resumo label="Total aplicado" valor={moeda(totalAplicado)} />
            <Resumo label="Aportes (período)" valor={moeda(resumo.aportes)} />
            <Resumo label="Resgates (período)" valor={moeda(resumo.resgates)} tom="negativo" />
            <Resumo label="Rendimentos (período)" valor={moeda(resumo.rendimentos)} tom="positivo" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aplicacoes.map((c) => (
              <Card key={c.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.nome}</p>
                      {c.banco && (
                        <p className="text-xs text-muted-foreground">{c.banco}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar"
                        onClick={() => {
                          setContaEdicao(c);
                          setDialogConta(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir"
                        onClick={() => setContaExcluir(c)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xl font-semibold tabular-nums">
                    {moeda(saldoConta(c, movimentacoes))}
                  </p>
                  {!c.ativa && <Badge variant="warning" className="w-fit">Inativa</Badge>}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto w-fit"
                    onClick={() => novoLancamento(c.id)}
                  >
                    <Plus className="size-3.5" />
                    Lançamento
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <div>
                    <Label className="mb-1.5">De</Label>
                    <Input
                      type="date"
                      value={inicio}
                      onChange={(e) => setInicio(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Até</Label>
                    <Input
                      type="date"
                      value={fim}
                      onChange={(e) => setFim(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={exportar} disabled={lancamentos.length === 0}>
                  <Download className="size-4" />
                  Exportar CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Data</TableHead>
                      <TableHead>Aplicação</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-20 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          Nenhum lançamento no período.
                        </TableCell>
                      </TableRow>
                    )}
                    {lancamentos.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap">{dataCurtaBR(m.data)}</TableCell>
                        <TableCell className="font-medium">{nomeConta(m.contaId)}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5">
                            {m.descricao}
                            {m.transferenciaId && (
                              <ArrowLeftRight
                                className="size-3.5 shrink-0 text-muted-foreground"
                                aria-label="Transferência entre contas"
                              />
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{categoriaNome(m.categoriaId)}</Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium tabular-nums",
                            m.tipo === "Credito" ? "text-success" : "text-destructive",
                          )}
                        >
                          {m.tipo === "Credito" ? "" : "− "}
                          {moeda(m.valor)}
                        </TableCell>
                        <TableCell className="text-right">
                          {!m.transferenciaId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Editar"
                              onClick={() => {
                                setMovEdicao(m);
                                setContaPadraoMov(m.contaId);
                                setDialogMov(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Excluir"
                            onClick={() => setMovExcluir(m)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ContaFormDialog
        aberto={dialogConta}
        onOpenChange={setDialogConta}
        conta={contaEdicao}
        tiposPermitidos={["Aplicacao"]}
      />

      <MovimentacaoFormDialog
        aberto={dialogMov}
        onOpenChange={setDialogMov}
        movimentacao={movEdicao}
        contas={aplicacoes}
        categorias={CATEGORIAS_APLICACAO}
        contaIdPadrao={contaPadraoMov}
      />

      <TransferenciaFormDialog
        aberto={dialogTransf}
        onOpenChange={setDialogTransf}
        contas={contasTodas ?? []}
      />

      <ConfirmDialog
        aberto={contaExcluir !== null}
        onOpenChange={(o) => !o && setContaExcluir(null)}
        titulo="Excluir aplicação"
        descricao={
          <>
            Excluir a aplicação <strong>{contaExcluir?.nome}</strong> e todos os
            seus lançamentos? Esta ação não pode ser desfeita.
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={onExcluirConta}
        carregando={excluirConta.isPending}
      />

      <ConfirmDialog
        aberto={movExcluir !== null}
        onOpenChange={(o) => !o && setMovExcluir(null)}
        titulo="Excluir lançamento"
        descricao={
          <>
            Excluir <strong>{movExcluir?.descricao}</strong>? Esta ação não pode
            ser desfeita.
            {movExcluir?.transferenciaId && (
              <>
                {" "}
                Como é uma transferência, os <strong>dois lados</strong> (débito
                e crédito) serão removidos.
              </>
            )}
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={onExcluirMov}
        carregando={excluirMov.isPending}
      />
    </div>
  );
}
