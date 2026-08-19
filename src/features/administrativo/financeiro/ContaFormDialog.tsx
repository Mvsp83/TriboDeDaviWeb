import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSalvarConta } from "./contasApi";
import {
  TipoConta,
  TIPO_CONTA_LABEL,
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

const schema = z.object({
  nome: z.string().min(1, "O nome é obrigatório."),
  tipo: z.enum(["Corrente", "Poupanca", "Aplicacao"]),
  banco: z.string(),
  agencia: z.string(),
  numero: z.string(),
  saldoInicial: z.coerce.number().refine((n) => Number.isFinite(n), {
    message: "Informe um valor válido.",
  }),
  ativa: z.boolean(),
  observacoes: z.string(),
});

type FormValues = z.input<typeof schema>;

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  conta: ContaFinanceira | null;
  // Tipos que a página oferece (Extratos: Corrente/Poupança; Aplicações:
  // Aplicacao). O seletor de tipo só aparece quando há mais de uma opção; com
  // um único tipo permitido, o campo fica oculto e já vem pré-selecionado.
  tiposPermitidos: TipoConta[];
}

export function ContaFormDialog({
  aberto,
  onOpenChange,
  conta,
  tiposPermitidos,
}: Props) {
  const salvar = useSalvarConta();
  const editando = conta !== null;
  const tipoUnico = tiposPermitidos.length === 1 ? tiposPermitidos[0] : null;

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
      nome: "",
      tipo: tiposPermitidos[0] ?? "Corrente",
      banco: "",
      agencia: "",
      numero: "",
      saldoInicial: 0,
      ativa: true,
      observacoes: "",
    },
  });

  const tipo = watch("tipo");
  const ativa = watch("ativa");

  useEffect(() => {
    if (!aberto) return;
    reset({
      nome: conta?.nome ?? "",
      tipo: conta?.tipo ?? tiposPermitidos[0] ?? "Corrente",
      banco: conta?.banco ?? "",
      agencia: conta?.agencia ?? "",
      numero: conta?.numero ?? "",
      saldoInicial: conta?.saldoInicial ?? 0,
      ativa: conta?.ativa ?? true,
      observacoes: conta?.observacoes ?? "",
    });
  }, [aberto, conta, tiposPermitidos, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await salvar.mutateAsync({
        id: conta?.id,
        nome: values.nome,
        tipo: values.tipo,
        banco: values.banco,
        agencia: values.agencia,
        numero: values.numero,
        saldoInicial: Number(values.saldoInicial),
        ativa: values.ativa,
        observacoes: values.observacoes,
      });
      toast.success(editando ? "Conta atualizada." : "Conta criada.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao salvar a conta.",
      );
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>
            Dados bancários da conta. O saldo inicial é o ponto de partida do
            portal — os lançamentos ajustam o saldo a partir dele.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Nome *</Label>
              <Input placeholder="ex: Banco do Brasil C/C" {...register("nome")} />
              {errors.nome && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.nome.message}
                </p>
              )}
            </div>

            {!tipoUnico && (
              <div>
                <Label className="mb-1.5">Tipo</Label>
                <Select
                  value={tipo}
                  onValueChange={(v) => setValue("tipo", v as TipoConta)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPermitidos.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIPO_CONTA_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="mb-1.5">Banco</Label>
              <Input placeholder="ex: Banco do Brasil" {...register("banco")} />
            </div>
            <div>
              <Label className="mb-1.5">Agência</Label>
              <Input {...register("agencia")} />
            </div>
            <div>
              <Label className="mb-1.5">Número da conta</Label>
              <Input {...register("numero")} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Saldo inicial (R$)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("saldoInicial")}
              />
              {errors.saldoInicial && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.saldoInicial.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Observações</Label>
              <Textarea rows={2} {...register("observacoes")} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={ativa}
                onChange={(e) => setValue("ativa", e.target.checked)}
              />
              Conta ativa
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
