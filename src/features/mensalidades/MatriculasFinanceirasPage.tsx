import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { ApiError } from "@/lib/api";
import { moeda } from "@/lib/format";
import { useAuth } from "@/features/auth/AuthContext";
import { useAlunos } from "@/features/alunos/alunosApi";
import {
  usePlanos,
  useMatriculas,
  useSalvarMatricula,
  useExcluirMatricula,
} from "@/features/mensalidades/mensalidadesApi";
import {
  StatusMatricula,
  STATUS_MATRICULA_LABEL,
  TipoDesconto,
  TIPO_DESCONTO_LABEL,
  valorComDesconto,
  competenciaAtual,
  competenciaLabel,
  type MatriculaFinanceira,
  type PlanoMensalidade,
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

type Rascunho = Omit<MatriculaFinanceira, "id"> & { id?: number };

const NOVA: Rascunho = {
  alunoId: 0,
  planoId: 0,
  diaVencimento: 10,
  inicio: competenciaAtual(),
  status: StatusMatricula.Ativo,
  descontoTipo: TipoDesconto.Nenhum,
  descontoValor: 0,
  observacao: "",
};

// Rótulo do desconto para a tabela.
function descontoLabel(m: { descontoTipo: TipoDesconto; descontoValor: number }): string {
  switch (m.descontoTipo) {
    case "percentual":
      return `${m.descontoValor}%`;
    case "valor":
      return `- ${moeda(m.descontoValor)}`;
    case "isencao":
      return "Isento";
    default:
      return "—";
  }
}

function MatriculaDialog({
  matricula,
  planos,
  alunosOrdenados,
  onOpenChange,
}: {
  matricula: Rascunho | null;
  planos: PlanoMensalidade[];
  alunosOrdenados: { id: number; nome: string }[];
  onOpenChange: (v: boolean) => void;
}) {
  const salvar = useSalvarMatricula();
  const [form, setForm] = useState<Rascunho>(NOVA);

  useEffect(() => {
    if (matricula) setForm({ ...NOVA, ...matricula });
  }, [matricula]);

  function patch(p: Partial<Rascunho>) {
    setForm((f) => ({ ...f, ...p }));
  }

  const plano = planos.find((p) => p.id === form.planoId);
  const opcoes = plano?.opcoesVencimento ?? [];
  const valorEfetivo = plano
    ? valorComDesconto(plano.valor, form.descontoTipo, form.descontoValor)
    : 0;

  // Ao trocar de plano, ajusta o dia de vencimento para uma opção válida.
  function escolherPlano(planoId: number) {
    const p = planos.find((x) => x.id === planoId);
    const ops = p?.opcoesVencimento ?? [];
    const dia = ops.length > 0 && !ops.includes(form.diaVencimento) ? ops[0] : form.diaVencimento;
    patch({ planoId, diaVencimento: dia });
  }

  async function submeter() {
    if (!form.alunoId) {
      toast.warning("Selecione o aluno.");
      return;
    }
    if (!form.planoId) {
      toast.warning("Selecione o plano.");
      return;
    }
    try {
      await salvar.mutateAsync({ ...form, observacao: form.observacao?.trim() || null });
      toast.success("Matrícula salva.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a matrícula.");
    }
  }

  const mostraValorDesconto =
    form.descontoTipo === "percentual" || form.descontoTipo === "valor";

  return (
    <Dialog open={matricula !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar matrícula" : "Nova matrícula"}</DialogTitle>
          <DialogDescription>
            Vincula um aluno a um plano de mensalidade. O dia de vencimento é
            escolhido entre as opções do plano.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5">Aluno</Label>
            <Select
              value={form.alunoId ? String(form.alunoId) : ""}
              onValueChange={(v) => patch({ alunoId: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunosOrdenados.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Plano</Label>
              <Select
                value={form.planoId ? String(form.planoId) : ""}
                onValueChange={(v) => escolherPlano(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {planos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome} — {moeda(p.valor)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Dia de vencimento</Label>
              {opcoes.length > 0 ? (
                <Select
                  value={String(form.diaVencimento)}
                  onValueChange={(v) => patch({ diaVencimento: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoes.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        dia {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.diaVencimento}
                  onChange={(e) =>
                    patch({
                      diaVencimento: Math.min(28, Math.max(1, Number(e.target.value) || 1)),
                    })
                  }
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Início (competência)</Label>
              <Input
                type="month"
                value={form.inicio}
                onChange={(e) => patch({ inicio: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => patch({ status: v as StatusMatricula })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StatusMatricula).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_MATRICULA_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Bolsa / desconto</Label>
              <Select
                value={form.descontoTipo}
                onValueChange={(v) =>
                  patch({ descontoTipo: v as TipoDesconto, descontoValor: 0 })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TipoDesconto).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_DESCONTO_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {mostraValorDesconto && (
              <div>
                <Label className="mb-1.5">
                  {form.descontoTipo === "percentual" ? "Percentual (%)" : "Valor (R$)"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={form.descontoTipo === "percentual" ? 1 : 0.01}
                  value={form.descontoValor}
                  onChange={(e) =>
                    patch({ descontoValor: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1.5">Observação (opcional)</Label>
            <Input
              placeholder="ex: bolsa por irmão matriculado"
              value={form.observacao ?? ""}
              onChange={(e) => patch({ observacao: e.target.value })}
            />
          </div>

          {plano && (
            <div className="rounded-md bg-secondary/60 px-3 py-2 text-sm">
              Valor efetivo por mês:{" "}
              <span className="font-semibold tabular-nums">{moeda(valorEfetivo)}</span>
              {valorEfetivo !== plano.valor && (
                <span className="text-muted-foreground"> (cheio {moeda(plano.valor)})</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submeter} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MatriculasFinanceirasPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const { data: alunos } = useAlunos(admin);
  const { data: planos } = usePlanos();
  const { data: matriculas, isLoading } = useMatriculas();
  const excluir = useExcluirMatricula();

  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [paraExcluir, setParaExcluir] = useState<MatriculaFinanceira | null>(null);

  const listaPlanos = planos ?? [];
  const alunosOrdenados = useMemo(
    () =>
      [...(alunos ?? [])]
        .map((a) => ({ id: a.id, nome: a.nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [alunos],
  );
  const nomeAluno = useMemo(
    () => new Map(alunosOrdenados.map((a) => [a.id, a.nome])),
    [alunosOrdenados],
  );
  const planoPorId = useMemo(
    () => new Map((planos ?? []).map((p) => [p.id, p])),
    [planos],
  );

  const lista = matriculas ?? [];

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Matrícula removida.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  const semPlanos = listaPlanos.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <Users className="mt-0.5 size-4 shrink-0" />
        <p>
          Vínculo de cada aluno a um plano de mensalidade, com o dia de vencimento
          e a bolsa/desconto. As <span className="font-medium text-foreground">Cobranças</span>{" "}
          do mês são geradas a partir das matrículas ativas.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Carregando..." : `${lista.length} matrícula(s)`}
          </p>
          <Button onClick={() => setEditando(NOVA)} disabled={semPlanos}>
            <Plus className="size-4" />
            Nova matrícula
          </Button>
        </CardContent>
      </Card>

      {semPlanos && (
        <p className="px-1 text-sm text-muted-foreground">
          Cadastre um plano antes de matricular alunos.
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="w-24">Venc.</TableHead>
                <TableHead className="w-32">Bolsa/Desc.</TableHead>
                <TableHead className="w-32">Valor/mês</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Nenhuma matrícula cadastrada.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                lista.map((m) => {
                  const plano = planoPorId.get(m.planoId);
                  const valor = plano
                    ? valorComDesconto(plano.valor, m.descontoTipo, m.descontoValor)
                    : 0;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {nomeAluno.get(m.alunoId) ?? `#${m.alunoId}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {plano?.nome ?? "—"}
                        <div className="text-xs">desde {competenciaLabel(m.inicio)}</div>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        dia {m.diaVencimento}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{descontoLabel(m)}</TableCell>
                      <TableCell className="tabular-nums">{moeda(valor)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            m.status === "ativo"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : m.status === "suspenso"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {STATUS_MATRICULA_LABEL[m.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Editar"
                            onClick={() => setEditando(m)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            title="Remover"
                            onClick={() => setParaExcluir(m)}
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

      <MatriculaDialog
        matricula={editando}
        planos={listaPlanos}
        alunosOrdenados={alunosOrdenados}
        onOpenChange={(v) => !v && setEditando(null)}
      />

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(v) => !v && setParaExcluir(null)}
        titulo="Remover matrícula?"
        descricao={
          <>
            A matrícula de{" "}
            <strong>{paraExcluir ? nomeAluno.get(paraExcluir.alunoId) ?? "aluno" : ""}</strong>{" "}
            será removida. Cobranças já geradas não são afetadas.
          </>
        }
        confirmarLabel="Remover"
        destrutivo
        carregando={excluir.isPending}
        onConfirmar={confirmarExclusao}
      />
    </div>
  );
}
