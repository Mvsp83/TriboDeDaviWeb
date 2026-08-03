import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSalvarPolo } from "@/features/polos/polosApi";
import { ApiError } from "@/lib/api";
import type { Polo } from "@/types";
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

const schema = z.object({
  nome: z.string().min(1, "O nome é obrigatório."),
  cidade: z.string(),
  endereco: z.string(),
  bairro: z.string(),
  informacoes: z.string(),
});

type FormValues = z.infer<typeof schema>;

const VAZIO: FormValues = {
  nome: "",
  cidade: "",
  endereco: "",
  bairro: "",
  informacoes: "",
};

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  polo: Polo | null;
}

export function PoloFormDialog({ aberto, onOpenChange, polo }: Props) {
  const salvar = useSalvarPolo();
  const editando = polo !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: VAZIO,
  });

  useEffect(() => {
    if (!aberto) return;
    reset(
      polo
        ? {
            nome: polo.nome ?? "",
            cidade: polo.cidade ?? "",
            endereco: polo.endereco ?? "",
            bairro: polo.bairro ?? "",
            informacoes: polo.informacoes ?? "",
          }
        : VAZIO,
    );
  }, [aberto, polo, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await salvar.mutateAsync({ id: polo?.id, ...values });
      toast.success(editando ? "Polo atualizado." : "Polo criado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao salvar o polo.",
      );
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar polo" : "Novo polo"}</DialogTitle>
          <DialogDescription>
            Dados do polo. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Nome *</Label>
              <Input {...register("nome")} />
              {errors.nome && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.nome.message}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Cidade</Label>
              <Input {...register("cidade")} />
            </div>
            <div>
              <Label className="mb-1.5">Bairro</Label>
              <Input {...register("bairro")} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Endereço</Label>
              <Input {...register("endereco")} />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Informações</Label>
              <Textarea rows={3} {...register("informacoes")} />
            </div>
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
