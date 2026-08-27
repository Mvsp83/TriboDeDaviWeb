import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CircleDollarSign, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api";
import { moeda } from "@/lib/format";
import {
  usePlanos,
  useSalvarPlano,
  useExcluirPlano,
} from "@/features/mensalidades/mensalidadesApi";
import {
  DIAS_VENCIMENTO_SUGERIDOS,
  normalizarDias,
  type PlanoMensalidade,
} from "@/features/mensalidades/tipos";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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

type Rascunho = Omit<PlanoMensalidade, "id"> & { id?: number };

const NOVO: Rascunho = {
  nome: "",
  valor: 0,
  opcoesVencimento: [5, 10],
  ativo: true,
  descricao: "",
};

// Campo compacto para acrescentar um dia de vencimento fora das sugestões.
function NovoDia({ onAdd }: { onAdd: (dia: number) => void }) {
  const [valor, setValor] = useState("");
  function adicionar() {
    const d = Number(valor);
    if (d >= 1 && d <= 28) {
      onAdd(d);
      setValor("");
    }
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Input
        type="number"
        min={1}
        max={28}
        placeholder="outro"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionar())}
        className="h-7 w-16 text-xs"
      />
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={adicionar}>
        Add
      </Button>
    </span>
  );
}

function PlanoDialog({
  plano,
  onOpenChange,
}: {
  plano: Rascunho | null;
  onOpenChange: (v: boolean) => void;
}) {
  const salvar = useSalvarPlano();
  const [form, setForm] = useState<Rascunho>(NOVO);

  useEffect(() => {
    if (plano) setForm({ ...NOVO, ...plano });
  }, [plano]);

  function patch(p: Partial<Rascunho>) {
    setForm((f) => ({ ...f, ...p }));
  }

  async function submeter() {
    if (!form.nome.trim()) {
      toast.warning("Informe o nome do plano.");
      return;
    }
    if (!(form.valor >= 0)) {
      toast.warning("Valor inválido.");
      return;
    }
    try {
      await salvar.mutateAsync({
        ...form,
        nome: form.nome.trim(),
        opcoesVencimento: normalizarDias(form.opcoesVencimento),
        descricao: form.descricao?.trim() || null,
      });
      toast.success("Plano salvo.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar o plano.");
    }
  }

  return (
    <Dialog open={plano !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar plano" : "Novo plano"}</DialogTitle>
          <DialogDescription>
            Um plano define o valor mensal cobrado. O instituto pode ter vários
            (integral, social, meia-bolsa…).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5">Nome</Label>
            <Input
              placeholder="ex: Integral"
              value={form.nome}
              onChange={(e) => patch({ nome: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1.5">Valor mensal (R$)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.valor}
              onChange={(e) => patch({ valor: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
          <div>
            <Label className="mb-1.5">Opções de vencimento (dias)</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {form.opcoesVencimento.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    patch({ opcoesVencimento: form.opcoesVencimento.filter((x) => x !== d) })
                  }
                  title="Remover dia"
                  className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                >
                  dia {d}
                  <X className="size-3" />
                </button>
              ))}
              {DIAS_VENCIMENTO_SUGERIDOS.filter(
                (d) => !form.opcoesVencimento.includes(d),
              ).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    patch({ opcoesVencimento: normalizarDias([...form.opcoesVencimento, d]) })
                  }
                  className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary"
                >
                  + dia {d}
                </button>
              ))}
              <NovoDia
                onAdd={(d) =>
                  patch({ opcoesVencimento: normalizarDias([...form.opcoesVencimento, d]) })
                }
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              O aluno escolhe um destes dias na matrícula. Vazio = qualquer dia (1–28).
            </p>
          </div>
          <div>
            <Label className="mb-1.5">Descrição (opcional)</Label>
            <Textarea
              rows={2}
              placeholder="Observações do plano"
              value={form.descricao ?? ""}
              onChange={(e) => patch({ descricao: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={form.ativo}
              onChange={(e) => patch({ ativo: e.target.checked })}
            />
            Plano ativo (gera cobranças)
          </label>
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

export function PlanosMensalidadePage() {
  const { data: planos, isLoading } = usePlanos();
  const excluir = useExcluirPlano();
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [paraExcluir, setParaExcluir] = useState<PlanoMensalidade | null>(null);

  const lista = planos ?? [];

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Plano removido.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <CircleDollarSign className="mt-0.5 size-4 shrink-0" />
        <p>
          Planos de mensalidade e seus valores. Cada aluno é vinculado a um plano
          em <span className="font-medium text-foreground">Matrículas</span>, e as
          cobranças do mês são geradas em{" "}
          <span className="font-medium text-foreground">Cobranças</span>.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Carregando..." : `${lista.length} plano(s)`}
          </p>
          <Button onClick={() => setEditando(NOVO)}>
            <Plus className="size-4" />
            Novo plano
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead className="w-40">Valor</TableHead>
                <TableHead className="w-48">Opções de vencimento</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum plano cadastrado.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                lista.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.nome}</div>
                      {p.descricao && (
                        <div className="text-xs text-muted-foreground">{p.descricao}</div>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{moeda(p.valor)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.opcoesVencimento.length > 0
                        ? p.opcoesVencimento.map((d) => `dia ${d}`).join(", ")
                        : "qualquer dia"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.ativo
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
                          title="Remover"
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

      <PlanoDialog plano={editando} onOpenChange={(v) => !v && setEditando(null)} />

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(v) => !v && setParaExcluir(null)}
        titulo="Remover plano?"
        descricao={
          <>
            O plano <strong>{paraExcluir?.nome}</strong> será removido. Matrículas que
            o usam precisarão de outro plano.
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
