import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRegistrarTransferencia } from "./movimentacoesApi";
import {
  categoriaTransferencia,
  categoriaNome,
  type ContaFinanceira,
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

const schema = z
  .object({
    contaOrigemId: z.coerce.number().int().positive("Selecione a conta de origem."),
    contaDestinoId: z.coerce.number().int().positive("Selecione a conta de destino."),
    data: z.string().min(1, "Informe a data."),
    valor: z.coerce.number().positive("Informe um valor maior que zero."),
    descricao: z.string().min(1, "Descreva a transferência."),
    documento: z.string(),
    observacoes: z.string(),
  })
  .refine((v) => v.contaOrigemId !== v.contaDestinoId, {
    message: "Origem e destino devem ser contas diferentes.",
    path: ["contaDestinoId"],
  });

type FormValues = z.input<typeof schema>;

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  // Todas as contas elegíveis (correntes, poupanças e aplicações ativas).
  contas: ContaFinanceira[];
  contaOrigemPadrao?: number | null;
}

export function TransferenciaFormDialog({
  aberto,
  onOpenChange,
  contas,
  contaOrigemPadrao,
}: Props) {
  const transferir = useRegistrarTransferencia();

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contaOrigemId: 0,
      contaDestinoId: 0,
      data: hoje(),
      valor: 0,
      descricao: "",
      documento: "",
      observacoes: "",
    },
  });

  const origemId = watch("contaOrigemId");
  const destinoId = watch("contaDestinoId");

  useEffect(() => {
    if (!aberto) return;
    reset({
      contaOrigemId: contaOrigemPadrao ?? contas[0]?.id ?? 0,
      contaDestinoId: 0,
      data: hoje(),
      valor: 0,
      descricao: "",
      documento: "",
      observacoes: "",
    });
  }, [aberto, contas, contaOrigemPadrao, reset]);

  const origem = contas.find((c) => c.id === Number(origemId)) ?? null;
  const destino = contas.find((c) => c.id === Number(destinoId)) ?? null;
  // Prévia da categoria derivada (aporte / resgate / transferência).
  const categoriaPrevia =
    origem && destino ? categoriaNome(categoriaTransferencia(origem, destino)) : null;

  async function onSubmit(values: FormValues) {
    const contaOrigem = contas.find((c) => c.id === Number(values.contaOrigemId));
    const contaDestino = contas.find((c) => c.id === Number(values.contaDestinoId));
    if (!contaOrigem || !contaDestino) {
      toast.error("Selecione as contas de origem e destino.");
      return;
    }
    try {
      await transferir.mutateAsync({
        contaOrigemId: contaOrigem.id,
        contaDestinoId: contaDestino.id,
        data: values.data,
        valor: Number(values.valor),
        categoriaId: categoriaTransferencia(contaOrigem, contaDestino),
        descricao: values.descricao,
        documento: values.documento,
        observacoes: values.observacoes,
      });
      toast.success("Transferência registrada.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao registrar a transferência.",
      );
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova transferência</DialogTitle>
          <DialogDescription>
            Move saldo de uma conta para outra criando os dois lançamentos de
            uma vez — débito na origem e crédito no destino. Não afeta o
            resultado da Planilha, apenas o saldo das contas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5">De (origem) *</Label>
              <Select
                value={origemId ? String(origemId) : ""}
                onValueChange={(v) => setValue("contaOrigemId", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Conta de origem" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contaOrigemId && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.contaOrigemId.message}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Para (destino) *</Label>
              <Select
                value={destinoId ? String(destinoId) : ""}
                onValueChange={(v) => setValue("contaDestinoId", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Conta de destino" />
                </SelectTrigger>
                <SelectContent>
                  {contas
                    .filter((c) => c.id !== Number(origemId))
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.contaDestinoId && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.contaDestinoId.message}
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

            <div className="sm:col-span-2">
              <Label className="mb-1.5">Descrição *</Label>
              <Input
                placeholder="ex: Aporte na aplicação — sobra de caixa"
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
          </div>

          {origem && destino && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <span className="font-medium">{origem.nome}</span>
              <ArrowRight className="size-4 text-muted-foreground" />
              <span className="font-medium">{destino.nome}</span>
              {categoriaPrevia && (
                <span className="text-muted-foreground">· {categoriaPrevia}</span>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={transferir.isPending}>
              {transferir.isPending && <Loader2 className="size-4 animate-spin" />}
              Transferir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
