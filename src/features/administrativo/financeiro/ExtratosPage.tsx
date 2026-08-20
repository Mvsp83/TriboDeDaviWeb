import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Landmark,
  Download,
  Upload,
  CheckCircle2,
  Circle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { useContas, useExcluirConta } from "./contasApi";
import {
  useMovimentacoes,
  useExcluirMovimentacao,
  useDefinirConciliacao,
} from "./movimentacoesApi";
import { ContaFormDialog } from "./ContaFormDialog";
import { MovimentacaoFormDialog } from "./MovimentacaoFormDialog";
import { TransferenciaFormDialog } from "./TransferenciaFormDialog";
import { ImportarExtratoDialog } from "./ImportarExtratoDialog";
import { saldoConta, saldoConciliado } from "./calculos";
import { baixarCsv } from "./exportar";
import {
  CATEGORIAS,
  categoriaNome,
  valorComSinal,
  TIPO_CONTA_LABEL,
  TIPOS_CONTA_EXTRATO,
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

export function ExtratosPage() {
  const { data: contasTodas, isLoading, isError } = useContas();
  const { data: movs } = useMovimentacoes();
  const excluirConta = useExcluirConta();
  const excluirMov = useExcluirMovimentacao();
  const conciliar = useDefinirConciliacao();

  const contas = useMemo(
    () => (contasTodas ?? []).filter((c) => TIPOS_CONTA_EXTRATO.includes(c.tipo)),
    [contasTodas],
  );
  const movimentacoes = movs ?? SEM_MOVS;

  const [contaSelId, setContaSelId] = useState<number | null>(null);
  const contaSel =
    contas.find((c) => c.id === contaSelId) ?? contas[0] ?? null;

  const [dialogConta, setDialogConta] = useState(false);
  const [contaEdicao, setContaEdicao] = useState<ContaFinanceira | null>(null);
  const [contaExcluir, setContaExcluir] = useState<ContaFinanceira | null>(null);

  const [dialogMov, setDialogMov] = useState(false);
  const [movEdicao, setMovEdicao] = useState<MovimentacaoFinanceira | null>(null);
  const [movExcluir, setMovExcluir] = useState<MovimentacaoFinanceira | null>(null);
  const [dialogTransf, setDialogTransf] = useState(false);
  const [dialogImportar, setDialogImportar] = useState(false);

  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [saldoBanco, setSaldoBanco] = useState("");

  // Lançamentos da conta selecionada, em ordem cronológica, com saldo
  // acumulado calculado sobre TODOS eles (não só os do período visível).
  const linhas = useMemo(() => {
    if (!contaSel) return [];
    const daConta = movimentacoes
      .filter((m) => m.contaId === contaSel.id)
      .sort((a, b) => (a.data === b.data ? a.id - b.id : a.data.localeCompare(b.data)));
    let acumulado = contaSel.saldoInicial;
    return daConta.map((m) => {
      acumulado += valorComSinal(m);
      return { mov: m, saldo: acumulado };
    });
  }, [contaSel, movimentacoes]);

  const visiveis = useMemo(
    () =>
      linhas.filter(({ mov }) => {
        if (inicio && mov.data < inicio) return false;
        if (fim && mov.data > fim) return false;
        return true;
      }),
    [linhas, inicio, fim],
  );

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    for (const { mov } of visiveis) {
      if (mov.tipo === "Credito") entradas += mov.valor;
      else saidas += mov.valor;
    }
    return { entradas, saidas };
  }, [visiveis]);

  const saldoAtual = contaSel ? saldoConta(contaSel, movimentacoes) : 0;
  const saldoConcil = contaSel ? saldoConciliado(contaSel, movimentacoes) : 0;
  const pendentes = contaSel
    ? movimentacoes.filter((m) => m.contaId === contaSel.id && !m.conciliado).length
    : 0;
  const diffBanco =
    saldoBanco.trim() === "" ? null : saldoConcil - Number(saldoBanco);

  async function onExcluirConta() {
    if (!contaExcluir) return;
    try {
      await excluirConta.mutateAsync(contaExcluir.id);
      toast.success("Conta excluída.");
      if (contaSelId === contaExcluir.id) setContaSelId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir a conta.");
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

  async function alternarConciliacao(m: MovimentacaoFinanceira) {
    try {
      await conciliar.mutateAsync({ id: m.id, conciliado: !m.conciliado });
    } catch {
      toast.error("Erro ao atualizar a conciliação.");
    }
  }

  function exportar() {
    if (!contaSel) return;
    baixarCsv(
      `extrato-${contaSel.nome.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}`,
      ["Data", "Descrição", "Categoria", "Documento", "Entrada", "Saída", "Saldo", "Conciliado"],
      visiveis.map(({ mov, saldo }) => [
        dataCurtaBR(mov.data),
        mov.descricao,
        categoriaNome(mov.categoriaId),
        mov.documento ?? "",
        mov.tipo === "Credito" ? mov.valor.toFixed(2) : "",
        mov.tipo === "Debito" ? mov.valor.toFixed(2) : "",
        saldo.toFixed(2),
        mov.conciliado ? "Sim" : "Não",
      ]),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Extratos</h1>
          <p className="text-sm text-muted-foreground">
            Conciliação bancária e acompanhamento das contas correntes e
            poupanças do instituto.
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
            <Landmark className="size-4" />
            Nova conta
          </Button>
          <Button
            variant="outline"
            disabled={(contasTodas?.length ?? 0) < 2}
            onClick={() => setDialogTransf(true)}
          >
            <ArrowLeftRight className="size-4" />
            Transferência
          </Button>
          <Button
            variant="outline"
            disabled={contas.length === 0}
            onClick={() => setDialogImportar(true)}
          >
            <Upload className="size-4" />
            Importar extrato
          </Button>
          <Button
            disabled={contas.length === 0}
            onClick={() => {
              setMovEdicao(null);
              setDialogMov(true);
            }}
          >
            <Plus className="size-4" />
            Novo lançamento
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Erro ao carregar as contas.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && contas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <Landmark className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma conta cadastrada ainda. Comece criando a primeira conta
              bancária do instituto.
            </p>
            <Button
              onClick={() => {
                setContaEdicao(null);
                setDialogConta(true);
              }}
            >
              <Plus className="size-4" />
              Nova conta
            </Button>
          </CardContent>
        </Card>
      )}

      {contas.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contas.map((c) => {
            const selecionada = contaSel?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setContaSelId(c.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  selecionada
                    ? "border-primary bg-accent/60 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-secondary/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.nome}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="outline">{TIPO_CONTA_LABEL[c.tipo]}</Badge>
                      {!c.ativa && <Badge variant="warning">Inativa</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Editar conta"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContaEdicao(c);
                        setDialogConta(true);
                      }}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Excluir conta"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContaExcluir(c);
                      }}
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xl font-semibold tabular-nums">
                  {moeda(saldoConta(c, movimentacoes))}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {contaSel && (
        <>
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
                <Button
                  variant="outline"
                  onClick={exportar}
                  disabled={visiveis.length === 0}
                >
                  <Download className="size-4" />
                  Exportar CSV
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Resumo label="Entradas (período)" valor={moeda(resumo.entradas)} tom="positivo" />
                <Resumo label="Saídas (período)" valor={moeda(resumo.saidas)} tom="negativo" />
                <Resumo label="Saldo atual" valor={moeda(saldoAtual)} />
                <Resumo label="Saldo conciliado" valor={moeda(saldoConcil)} />
              </div>

              <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                <div>
                  <Label className="mb-1.5">Saldo do extrato do banco</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={saldoBanco}
                    onChange={(e) => setSaldoBanco(e.target.value)}
                    className="w-44"
                  />
                </div>
                <div className="text-sm">
                  {diffBanco === null ? (
                    <p className="text-muted-foreground">
                      Informe o saldo do banco para conferir a conciliação.
                      <br />
                      {pendentes} lançamento(s) ainda não conciliado(s).
                    </p>
                  ) : Math.abs(diffBanco) < 0.005 ? (
                    <p className="flex items-center gap-1.5 font-medium text-success">
                      <CheckCircle2 className="size-4" />
                      Conciliado — saldo confere com o banco.
                    </p>
                  ) : (
                    <p className="font-medium text-warning">
                      Diferença de {moeda(diffBanco)} entre o saldo conciliado e
                      o banco. {pendentes} lançamento(s) pendente(s).
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Entrada</TableHead>
                      <TableHead className="text-right">Saída</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="w-24 text-center">Concil.</TableHead>
                      <TableHead className="w-20 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visiveis.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                          Nenhum lançamento no período.
                        </TableCell>
                      </TableRow>
                    )}
                    {visiveis.map(({ mov, saldo }) => (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap">{dataCurtaBR(mov.data)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {mov.tipo === "Credito" ? (
                              <ArrowDownLeft className="size-4 shrink-0 text-success" />
                            ) : (
                              <ArrowUpRight className="size-4 shrink-0 text-destructive" />
                            )}
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate font-medium">
                                {mov.descricao}
                                {mov.transferenciaId && (
                                  <ArrowLeftRight
                                    className="size-3.5 shrink-0 text-muted-foreground"
                                    aria-label="Transferência entre contas"
                                  />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {categoriaNome(mov.categoriaId)}
                                {mov.documento ? ` · ${mov.documento}` : ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-success">
                          {mov.tipo === "Credito" ? moeda(mov.valor) : ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-destructive">
                          {mov.tipo === "Debito" ? moeda(mov.valor) : ""}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {moeda(saldo)}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => alternarConciliacao(mov)}
                            aria-label={mov.conciliado ? "Marcar como pendente" : "Marcar como conciliado"}
                            className="inline-flex items-center justify-center"
                          >
                            {mov.conciliado ? (
                              <CheckCircle2 className="size-5 text-success" />
                            ) : (
                              <Circle className="size-5 text-muted-foreground/50 hover:text-muted-foreground" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          {!mov.transferenciaId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Editar"
                              onClick={() => {
                                setMovEdicao(mov);
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
                            onClick={() => setMovExcluir(mov)}
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
        tiposPermitidos={TIPOS_CONTA_EXTRATO}
      />

      <MovimentacaoFormDialog
        aberto={dialogMov}
        onOpenChange={setDialogMov}
        movimentacao={movEdicao}
        contas={contas}
        categorias={CATEGORIAS}
        contaIdPadrao={contaSel?.id ?? null}
      />

      <TransferenciaFormDialog
        aberto={dialogTransf}
        onOpenChange={setDialogTransf}
        contas={contasTodas ?? []}
        contaOrigemPadrao={contaSel?.id ?? null}
      />

      <ImportarExtratoDialog
        aberto={dialogImportar}
        onOpenChange={setDialogImportar}
        contas={contas}
        movimentacoes={movimentacoes}
      />

      <ConfirmDialog
        aberto={contaExcluir !== null}
        onOpenChange={(o) => !o && setContaExcluir(null)}
        titulo="Excluir conta"
        descricao={
          <>
            Excluir a conta <strong>{contaExcluir?.nome}</strong> e todos os seus
            lançamentos? Esta ação não pode ser desfeita.
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
