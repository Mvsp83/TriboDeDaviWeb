import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Receipt, Search, Sparkles, Ban, Trash2, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { moeda } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthContext";
import { useAlunos } from "@/features/alunos/alunosApi";
import { useContas } from "@/features/administrativo/financeiro/contasApi";
import {
  useCobrancas,
  useGerarCobrancas,
  useBaixarCobranca,
  useExcluirCobranca,
  useSalvarCobranca,
} from "@/features/mensalidades/mensalidadesApi";
import {
  FORMAS_PAGAMENTO,
  StatusCobranca,
  STATUS_EXIBICAO_LABEL,
  statusExibicao,
  competenciaAtual,
  competenciaLabel,
  type Cobranca,
  type StatusExibicao,
} from "@/features/mensalidades/tipos";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Cores do selo de status (inclui o derivado "atrasado").
function corStatus(s: StatusExibicao): string {
  switch (s) {
    case "pago":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "atrasado":
      return "bg-red-500/15 text-red-700 dark:text-red-400";
    case "pendente":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "isento":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function KPI({ label, valor, tom }: { label: string; valor: string; tom?: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${tom ?? ""}`}>{valor}</div>
    </div>
  );
}

// Diálogo de baixa: registra o pagamento e (no backend) lança no livro-caixa.
function BaixaDialog({
  cobranca,
  nomeAluno,
  onOpenChange,
}: {
  cobranca: Cobranca | null;
  nomeAluno: string;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: contas } = useContas();
  const baixar = useBaixarCobranca();
  const contasAtivas = (contas ?? []).filter((c) => c.ativa && c.tipo !== "Aplicacao");

  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [valor, setValor] = useState(0);
  const [forma, setForma] = useState<string>(FORMAS_PAGAMENTO[1]);
  const [contaId, setContaId] = useState<string>("");

  useEffect(() => {
    if (cobranca) {
      setData(new Date().toISOString().slice(0, 10));
      setValor(cobranca.valor);
      setForma(FORMAS_PAGAMENTO[1]);
      setContaId("");
    }
  }, [cobranca]);

  async function submeter() {
    if (!cobranca) return;
    if (!contaId) {
      toast.warning("Escolha a conta que recebeu (para lançar no livro-caixa).");
      return;
    }
    try {
      await baixar.mutateAsync({
        id: cobranca.id,
        pagamentoData: data,
        pagamentoValor: valor,
        pagamentoForma: forma,
        contaId: Number(contaId),
      });
      toast.success("Baixa registrada e lançada no livro-caixa.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao dar baixa.");
    }
  }

  return (
    <Dialog open={cobranca !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dar baixa</DialogTitle>
          <DialogDescription>
            {nomeAluno}
            {cobranca ? ` — ${competenciaLabel(cobranca.competencia)} · ${moeda(cobranca.valor)}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Data do pagamento</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5">Valor recebido (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={valor}
                onChange={(e) => setValor(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Forma</Label>
              <Select value={forma} onValueChange={setForma}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Conta que recebeu</Label>
              <Select value={contaId} onValueChange={setContaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {contasAtivas.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {contasAtivas.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Nenhuma conta cadastrada no Financeiro. Cadastre uma conta em Extratos
              para poder lançar o recebimento.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submeter} disabled={baixar.isPending}>
            {baixar.isPending && <Loader2 className="size-4 animate-spin" />}
            <CheckCircle2 className="size-4" />
            Confirmar baixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CobrancasPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const { data: alunos } = useAlunos(admin);

  const [competencia, setCompetencia] = useState(competenciaAtual());
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  const { data: cobrancas, isLoading } = useCobrancas(competencia);
  const gerar = useGerarCobrancas();
  const salvar = useSalvarCobranca();
  const excluir = useExcluirCobranca();

  const [baixando, setBaixando] = useState<Cobranca | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Cobranca | null>(null);

  const nomeAluno = useMemo(
    () => new Map((alunos ?? []).map((a) => [a.id, a.nome])),
    [alunos],
  );

  const lista = useMemo(() => cobrancas ?? [], [cobrancas]);

  // Resumo do mês.
  const resumo = useMemo(() => {
    let previsto = 0;
    let recebido = 0;
    let emAberto = 0;
    let atrasado = 0;
    for (const c of lista) {
      if (c.status === "cancelado") continue;
      if (c.status === "pago") {
        recebido += c.pagamentoValor ?? c.valor;
        previsto += c.valor;
      } else if (c.status === "pendente") {
        previsto += c.valor;
        emAberto += c.valor;
        if (statusExibicao(c) === "atrasado") atrasado += c.valor;
      }
      // isento não soma valor (é 0).
    }
    const inadimplencia = previsto > 0 ? (atrasado / previsto) * 100 : 0;
    return { previsto, recebido, emAberto, atrasado, inadimplencia };
  }, [lista]);

  const termo = busca.trim().toLowerCase();
  const visiveis = lista.filter((c) => {
    const st = statusExibicao(c);
    if (filtroStatus !== "todos" && st !== filtroStatus) return false;
    if (termo) {
      const nome = (nomeAluno.get(c.alunoId) ?? "").toLowerCase();
      if (!nome.includes(termo)) return false;
    }
    return true;
  });

  async function gerarMes() {
    try {
      const r = await gerar.mutateAsync(competencia);
      toast.success(r.mensagem || `${r.geradas} cobrança(s) gerada(s).`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao gerar cobranças.");
    }
  }

  async function cancelar(c: Cobranca) {
    try {
      await salvar.mutateAsync({ ...c, status: StatusCobranca.Cancelado });
      toast.success("Cobrança cancelada.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao cancelar.");
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Cobrança removida.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <Receipt className="mt-0.5 size-4 shrink-0" />
        <p>
          Cobranças do mês, geradas a partir das matrículas ativas. Dar baixa
          registra o pagamento e lança no{" "}
          <span className="font-medium text-foreground">livro-caixa</span>. "Atrasado"
          é a cobrança pendente cujo vencimento já passou.
        </p>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <Label className="mb-1.5">Competência</Label>
            <Input
              type="month"
              className="w-44"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value || competenciaAtual())}
            />
          </div>
          <div>
            <Label className="mb-1.5">Status</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="atrasado">Atrasados</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
                <SelectItem value="isento">Isentos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Label className="mb-1.5">Buscar aluno</Label>
            <Search className="pointer-events-none absolute left-3 top-9 size-4 text-muted-foreground" />
            <Input
              placeholder="Nome do aluno"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-56 pl-9"
            />
          </div>
          <Button className="ml-auto" onClick={gerarMes} disabled={gerar.isPending}>
            {gerar.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Gerar cobranças do mês
          </Button>
        </CardContent>
      </Card>

      {/* Painel de inadimplência */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label={`Previsto (${competenciaLabel(competencia)})`} valor={moeda(resumo.previsto)} />
        <KPI label="Recebido" valor={moeda(resumo.recebido)} tom="text-emerald-600 dark:text-emerald-400" />
        <KPI label="Em aberto" valor={moeda(resumo.emAberto)} tom="text-amber-600 dark:text-amber-400" />
        <KPI
          label="Inadimplência"
          valor={`${resumo.inadimplencia.toFixed(0)}%`}
          tom={resumo.atrasado > 0 ? "text-red-600 dark:text-red-400" : ""}
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead className="w-28">Vencimento</TableHead>
                <TableHead className="w-28">Valor</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-40">Pagamento</TableHead>
                <TableHead className="w-28 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && visiveis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {lista.length === 0
                      ? "Nenhuma cobrança nesta competência. Gere as cobranças do mês."
                      : "Nenhuma cobrança com os filtros atuais."}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                visiveis.map((c) => {
                  const st = statusExibicao(c);
                  const podeBaixar = c.status === "pendente";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {nomeAluno.get(c.alunoId) ?? `#${c.alunoId}`}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {c.vencimento.split("-").reverse().join("/")}
                      </TableCell>
                      <TableCell className="tabular-nums">{moeda(c.valor)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${corStatus(st)}`}
                        >
                          {STATUS_EXIBICAO_LABEL[st]}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.status === "pago"
                          ? `${moeda(c.pagamentoValor ?? c.valor)} · ${c.pagamentoForma ?? ""}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {podeBaixar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                              title="Dar baixa"
                              onClick={() => setBaixando(c)}
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                          )}
                          {c.status !== "cancelado" && c.status !== "pago" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="Cancelar cobrança"
                              onClick={() => cancelar(c)}
                            >
                              <Ban className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            title="Remover"
                            onClick={() => setParaExcluir(c)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BaixaDialog
        cobranca={baixando}
        nomeAluno={baixando ? nomeAluno.get(baixando.alunoId) ?? "Aluno" : ""}
        onOpenChange={(v) => !v && setBaixando(null)}
      />

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(v) => !v && setParaExcluir(null)}
        titulo="Remover cobrança?"
        descricao="A cobrança será removida definitivamente. Se já teve baixa, o lançamento no livro-caixa não é desfeito automaticamente."
        confirmarLabel="Remover"
        destrutivo
        carregando={excluir.isPending}
        onConfirmar={confirmarExclusao}
      />
    </div>
  );
}
