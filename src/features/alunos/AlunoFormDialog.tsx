import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSalvarAluno } from "@/features/alunos/alunosApi";
import { OPCOES_FAIXA_BASE } from "@/features/alunos/faixa";
import { ApiError } from "@/lib/api";
import { formatarTelefone } from "@/lib/format";
import type { Aluno, Polo } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  nome: z.string().min(1, "O nome é obrigatório."),
  cpf: z.string(),
  rg: z.string(),
  dataNascimento: z.string(),
  celular: z.string(),
  telefone2: z.string(),
  peso: z.string(),
  altura: z.string(),
  escola: z.string(),
  serie: z.string(),
  periodo: z.string(),
  endereco: z.string(),
  numero: z.string(),
  complemento: z.string(),
  bairro: z.string(),
  cidade: z.string(),
  responsavel: z.string(),
  cpfResponsavel: z.string(),
  rgResponsavel: z.string(),
  poloId: z.number().min(1, "Selecione um polo."),
  turma: z.number().min(1).max(3),
  faixaBase: z.number(),
  faixaGrau: z.number(),
});

type FormValues = z.infer<typeof schema>;

function dividirFaixa(faixa: number) {
  const base =
    [...OPCOES_FAIXA_BASE].reverse().find((o) => faixa >= o.valor)?.valor ?? 0;
  return { base, grau: base === 40 ? 0 : faixa - base };
}

function isoParaInput(iso: string): string {
  // yyyy-MM-dd para <input type=date>
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  aluno: Aluno | null;
  polos: Polo[];
  poloPadrao?: number | null;
}

export function AlunoFormDialog({
  aberto,
  onOpenChange,
  aluno,
  polos,
  poloPadrao,
}: Props) {
  const salvar = useSalvarAluno();
  const editando = aluno !== null;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: vazio(poloPadrao),
  });

  const faixaBase = watch("faixaBase");

  useEffect(() => {
    if (!aberto) return;
    if (aluno) {
      const { base, grau } = dividirFaixa(aluno.faixa);
      reset({
        nome: aluno.nome ?? "",
        cpf: aluno.cpf ?? "",
        rg: aluno.rg ?? "",
        dataNascimento: aluno.dataNascimento
          ? isoParaInput(aluno.dataNascimento)
          : "",
        celular: aluno.celular ?? "",
        telefone2: aluno.telefone2 ?? "",
        peso: aluno.peso != null ? String(aluno.peso) : "",
        altura: aluno.altura != null ? String(aluno.altura) : "",
        escola: aluno.escola ?? "",
        serie: aluno.serie ?? "",
        periodo: aluno.periodo ?? "",
        endereco: aluno.endereco ?? "",
        numero: aluno.numero ?? "",
        complemento: aluno.complemento ?? "",
        bairro: aluno.bairro ?? "",
        cidade: aluno.cidade ?? "",
        responsavel: aluno.responsavel ?? "",
        cpfResponsavel: aluno.cpfResponsavel ?? "",
        rgResponsavel: aluno.rgResponsavel ?? "",
        poloId: aluno.poloId,
        turma: aluno.turma || 1,
        faixaBase: base,
        faixaGrau: grau,
      });
    } else {
      reset(vazio(poloPadrao));
    }
  }, [aberto, aluno, poloPadrao, reset]);

  async function onSubmit(values: FormValues) {
    const faixa =
      values.faixaBase === 40 ? 40 : values.faixaBase + values.faixaGrau;
    const pesoNum = parseFloat(values.peso.replace(",", "."));
    const alturaNum = parseFloat(values.altura.replace(",", "."));

    const payload: Partial<Aluno> = {
      id: aluno?.id,
      nome: values.nome,
      cpf: values.cpf,
      rg: values.rg,
      dataNascimento: values.dataNascimento || "2000-01-01",
      celular: values.celular,
      telefone2: values.telefone2,
      peso: Number.isNaN(pesoNum) ? 0 : pesoNum,
      altura: Number.isNaN(alturaNum) ? null : alturaNum,
      escola: values.escola,
      serie: values.serie,
      periodo: values.periodo,
      endereco: values.endereco,
      numero: values.numero,
      complemento: values.complemento,
      bairro: values.bairro,
      cidade: values.cidade,
      responsavel: values.responsavel,
      cpfResponsavel: values.cpfResponsavel,
      rgResponsavel: values.rgResponsavel,
      poloId: values.poloId,
      turma: values.turma,
      faixa,
    };

    try {
      await salvar.mutateAsync(payload);
      toast.success(editando ? "Aluno atualizado." : "Aluno cadastrado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao salvar o aluno.",
      );
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar aluno" : "Novo aluno"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do aluno. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Secao titulo="Dados pessoais">
            <Campo className="sm:col-span-2" label="Nome *" erro={errors.nome?.message}>
              <Input {...register("nome")} />
            </Campo>
            <Campo label="CPF">
              <Input {...register("cpf")} />
            </Campo>
            <Campo label="RG">
              <Input {...register("rg")} />
            </Campo>
            <Campo label="Nascimento">
              <Input type="date" {...register("dataNascimento")} />
            </Campo>
            <Campo label="Celular">
              <Controller
                control={control}
                name="celular"
                render={({ field }) => (
                  <Input
                    inputMode="tel"
                    placeholder="(47) 99999-9999"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(formatarTelefone(e.target.value))}
                  />
                )}
              />
            </Campo>
            <Campo label="Telefone 2">
              <Controller
                control={control}
                name="telefone2"
                render={({ field }) => (
                  <Input
                    inputMode="tel"
                    placeholder="(47) 3333-3333"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(formatarTelefone(e.target.value))}
                  />
                )}
              />
            </Campo>
            <Campo label="Peso (kg)">
              <Input inputMode="decimal" placeholder="ex: 42.5" {...register("peso")} />
            </Campo>
            <Campo label="Altura (m)">
              <Input inputMode="decimal" placeholder="ex: 1.42" {...register("altura")} />
            </Campo>
            <Campo label="Escola">
              <Input {...register("escola")} />
            </Campo>
            <Campo label="Série">
              <Input {...register("serie")} />
            </Campo>
            <Campo label="Período">
              <Input {...register("periodo")} />
            </Campo>
          </Secao>

          <Secao titulo="Endereço">
            <Campo className="sm:col-span-2" label="Rua">
              <Input {...register("endereco")} />
            </Campo>
            <Campo label="Número">
              <Input {...register("numero")} />
            </Campo>
            <Campo label="Complemento">
              <Input {...register("complemento")} />
            </Campo>
            <Campo label="Bairro">
              <Input {...register("bairro")} />
            </Campo>
            <Campo label="Cidade">
              <Input {...register("cidade")} />
            </Campo>
          </Secao>

          <Secao titulo="Responsável">
            <Campo label="Nome do responsável">
              <Input {...register("responsavel")} />
            </Campo>
            <Campo label="CPF do responsável">
              <Input {...register("cpfResponsavel")} />
            </Campo>
            <Campo label="RG do responsável">
              <Input {...register("rgResponsavel")} />
            </Campo>
          </Secao>

          <Secao titulo="Polo e faixa">
            <Campo label="Polo *" erro={errors.poloId?.message}>
              <Controller
                control={control}
                name="poloId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {polos.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Campo>

            <Campo label="Turma">
              <Controller
                control={control}
                name="turma"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Turma 1</SelectItem>
                      <SelectItem value="2">Turma 2</SelectItem>
                      <SelectItem value="3">Turma 3</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Campo>

            <Campo label="Faixa">
              <Controller
                control={control}
                name="faixaBase"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCOES_FAIXA_BASE.map((o) => (
                        <SelectItem key={o.valor} value={String(o.valor)}>
                          {o.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Campo>

            {faixaBase !== 40 && (
              <Campo label="Grau">
                <Controller
                  control={control}
                  name="faixaGrau"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4].map((g) => (
                          <SelectItem key={g} value={String(g)}>
                            {g === 0 ? "Sem grau" : `${g}º grau`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Campo>
            )}
          </Secao>

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

function vazio(poloPadrao?: number | null): FormValues {
  return {
    nome: "",
    cpf: "",
    rg: "",
    dataNascimento: "",
    celular: "",
    telefone2: "",
    peso: "",
    altura: "",
    escola: "",
    serie: "",
    periodo: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    responsavel: "",
    cpfResponsavel: "",
    rgResponsavel: "",
    poloId: poloPadrao ?? 0,
    turma: 1,
    faixaBase: 0,
    faixaGrau: 0,
  };
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Campo({
  label,
  erro,
  className,
  children,
}: {
  label: string;
  erro?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5">{label}</Label>
      {children}
      {erro && <p className="mt-1 text-xs text-destructive">{erro}</p>}
    </div>
  );
}
