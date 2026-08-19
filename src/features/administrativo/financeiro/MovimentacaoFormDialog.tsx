import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSalvarMovimentacao } from "./movimentacoesApi";
import {
  CATEGORIA_POR_ID,
  TipoMovimentacao,
  type CategoriaFinanceira,
  type ContaFinanceira,
  type MovimentacaoFinanceira,
} from "./tipos";
import { ApiError } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const schema = z.object({
  contaId: z.coerce.number().int().positive("Selecione uma conta."),
  data: z.string().min(1, "Informe a data."),
  categoriaId: z.string().min(1, "Selecione a categoria."),
  tipo: z.enum(["Credito", "Debito"]),
  valor: z.coerce.number().positive("Informe um valor maior que zero."),
  descricao: z.string().min(1, "Descreva o lançamento."),
  documento: z.string(),
  conciliado: z.boolean(),
  observacoes: z.string(),
});

type FormValues = z.input<typeof schema>;

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  movimentacao: MovimentacaoFinanceira | null;
  contas: ContaFinanceira[];
  categorias: CategoriaFinanceira[];
  contaIdPadrao?: number | null;
}

export function MovimentacaoFormDialog({
  aberto,
  onOpenChange,
  movimentacao,
  contas,
  categorias,
  contaIdPadrao,
}: Props) {
  const salvar = useSalvarMovimentacao();
  const editando = movimentacao !== null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contaId: 0,
      data: hoje(),
      categoriaId: "",
      tipo: "Credito",
      valor: 0,
      descricao: "",
      documento: "",
      conciliado: false,
      observacoes: "",
    },
  });

  const contaId = watch("contaId");
  const categoriaId = watch("categoriaId");
  const tipo = watch("tipo");
  const conciliado = watch("conciliado");

  useEffect(() => {
    if (!aberto) return;
    const primeiraConta = contas[0]?.id ?? 0;
    reset({
      contaId: movimentacao?.contaId ?? contaIdPadrao ?? primeiraConta,
      data: movimentacao?.data ?? hoje(),
      categoriaId: movimentacao?.categoriaId ?? categorias[0]?.id ?? "",
      tipo: movimentacao?.tipo ?? categorias[0]?.tipoPadrao ?? "Credito",
      valor: movimentacao?.valor ?? 0,
      descricao: movimentacao?.descricao ?? "",
      documento: movimentacao?.documento ?? "",
      conciliado: movimentacao?.conciliado ?? false,
      observacoes: movimentacao?.observacoes ?? "",
    });
  }, [aberto, movimentacao, contas, categorias, contaIdPadrao, reset]);

  // Ao trocar a categoria, sugere o crédito/débito padrão dela (só na criação
  // ou quando o usuário ainda não mexeu — mantém a edição previsível).
  function aoTrocarCategoria(id: string) {
    setValue("categoriaId", id);
    const cat = CATEGORIA_POR_ID.get(id);
    if (cat) setValue("tipo", cat.tipoPadrao);
  }

  async function onSubmit(values: FormValues) {
    try {
      await salvar.mutateAsync({
        id: movimentacao?.id,
        contaId: Number(values.contaId),
        data: values.data,
        descricao: values.descricao,
        categoriaId: values.categoriaId,
        tipo: values.tipo,
        valor: Number(values.valor),
        conciliado: values.conciliado,
        documento: values.documento,
        observacoes: values.observacoes,
      });
      toast.success(editando ? "Lançamento atualizado." : "Lançamento criado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao salvar o lançamento.",
      );
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar lançamento" : "Novo lançamento"}
          </DialogTitle>
          <DialogDescription>
            Crédito soma ao saldo da conta; débito subtrai. A categoria define
            como o valor entra na Planilha Financeira.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Conta *</Label>
              <Select
                value={contaId ? String(contaId) : ""}
                onValueChange={(v) => setValue("contaId", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contaId && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.contaId.message}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Data *</Label>
              <Input type="date" {...register("data")} />
              {errors.data && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.data.message}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" {...register("valor")} />
              {errors.valor && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.valor.message}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Categoria *</Label>
              <Select value={categoriaId} onValueChange={aoTrocarCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoriaId && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.categoriaId.message}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Tipo</Label>
              <div className="flex gap-2">
                {Object.values(TipoMovimentacao).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setValue("tipo", t)}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      tipo === t
                        ? t === "Credito"
                          ? "border-success bg-success/15 text-success"
                          : "border-destructive bg-destructive/15 text-destructive"
                        : "border-border text-muted-foreground hover:bg-secondary/60",
                    )}
                  >
                    {t === "Credito" ? "Crédito (+)" : "Débito (−)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5">Descrição *</Label>
              <Input
                placeholder="ex: Mensalidade turma 1 — julho"
                {...register("descricao")}
              />
              {errors.descricao && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.descricao.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Documento / comprovante</Label>
              <Input
                placeholder="nº do doc, recibo, etc. (opcional)"
                {...register("documento")}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Observações</Label>
              <Textarea rows={2} {...register("observacoes")} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={conciliado}
                onChange={(e) => setValue("conciliado", e.target.checked)}
              />
              Já conciliado com o extrato do banco
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending}>
              {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
