import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSalvarPolo } from "@/features/polos/polosApi";
import { ApiError } from "@/lib/api";
import type { HorarioTurma, Polo } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Dias da semana (valor = padrão JS: 0=Domingo). Segunda primeiro, à brasileira.
const DIAS: { valor: number; label: string }[] = [
  { valor: 1, label: "Segunda" },
  { valor: 2, label: "Terça" },
  { valor: 3, label: "Quarta" },
  { valor: 4, label: "Quinta" },
  { valor: 5, label: "Sexta" },
  { valor: 6, label: "Sábado" },
  { valor: 0, label: "Domingo" },
];

const HORARIO_NOVO: HorarioTurma = {
  turma: 1,
  diaSemana: 1,
  horaInicio: "",
  horaFim: "",
};

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  polo: Polo | null;
}

export function PoloFormDialog({ aberto, onOpenChange, polo }: Props) {
  const salvar = useSalvarPolo();
  const editando = polo !== null;
  const [horarios, setHorarios] = useState<HorarioTurma[]>([]);

  function atualizarHorario(i: number, campo: keyof HorarioTurma, valor: string | number) {
    setHorarios((atual) =>
      atual.map((h, idx) => (idx === i ? { ...h, [campo]: valor } : h)),
    );
  }

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
    setHorarios(polo?.horarios ? polo.horarios.map((h) => ({ ...h })) : []);
  }, [aberto, polo, reset]);

  async function onSubmit(values: FormValues) {
    // Só envia linhas com turma e hora de início preenchidas.
    const horariosValidos = horarios.filter(
      (h) => h.turma > 0 && h.horaInicio.trim() !== "",
    );
    try {
      await salvar.mutateAsync({
        id: polo?.id,
        ...values,
        horarios: horariosValidos,
      });
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

          {/* Horários das aulas por turma */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <Label>Horários das turmas</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setHorarios((atual) => [...atual, { ...HORARIO_NOVO }])
                }
              >
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>

            {horarios.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum horário informado. Adicione os dias e horas de cada turma.
              </p>
            ) : (
              <div className="space-y-2">
                {horarios.map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-2"
                  >
                    <div className="w-16">
                      <Label className="mb-1 text-xs">Turma</Label>
                      <Input
                        type="number"
                        min={1}
                        value={h.turma}
                        onChange={(e) =>
                          atualizarHorario(i, "turma", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="min-w-28 flex-1">
                      <Label className="mb-1 text-xs">Dia</Label>
                      <Select
                        value={String(h.diaSemana)}
                        onValueChange={(v) =>
                          atualizarHorario(i, "diaSemana", Number(v))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAS.map((d) => (
                            <SelectItem key={d.valor} value={String(d.valor)}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label className="mb-1 text-xs">Início</Label>
                      <Input
                        type="time"
                        value={h.horaInicio}
                        onChange={(e) =>
                          atualizarHorario(i, "horaInicio", e.target.value)
                        }
                      />
                    </div>
                    <div className="w-24">
                      <Label className="mb-1 text-xs">Fim</Label>
                      <Input
                        type="time"
                        value={h.horaFim}
                        onChange={(e) =>
                          atualizarHorario(i, "horaFim", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setHorarios((atual) =>
                          atual.filter((_, idx) => idx !== i),
                        )
                      }
                      aria-label="Remover horário"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
