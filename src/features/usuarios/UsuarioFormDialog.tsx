import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSalvarUsuario } from "@/features/usuarios/usuariosApi";
import { ApiError } from "@/lib/api";
import type { Polo, Usuario } from "@/types";
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

// A tela cria apenas Administrador (0) e Professor (2); Professor exige polo.
const schema = z
  .object({
    login: z.string().min(1, "O login é obrigatório."),
    email: z.string().min(1, "O email é obrigatório.").email("Email inválido."),
    password: z.string(),
    role: z.number(),
    poloId: z.number().nullable(),
    permiteGraduacao: z.boolean(),
  })
  .refine((v) => v.role !== 2 || (v.poloId != null && v.poloId > 0), {
    message: "Selecione um polo para o professor.",
    path: ["poloId"],
  });

type FormValues = z.infer<typeof schema>;

const VAZIO: FormValues = {
  login: "",
  email: "",
  password: "",
  role: 2,
  poloId: null,
  permiteGraduacao: false,
};

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  usuario: Usuario | null;
  polos: Polo[];
}

export function UsuarioFormDialog({
  aberto,
  onOpenChange,
  usuario,
  polos,
}: Props) {
  const salvar = useSalvarUsuario();
  const editando = usuario !== null;
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: VAZIO,
  });

  const role = watch("role");

  useEffect(() => {
    if (!aberto) return;
    setMostrarSenha(false);
    reset(
      usuario
        ? {
            login: usuario.login,
            email: usuario.email,
            password: "",
            role: usuario.role,
            poloId: usuario.poloId ?? null,
            permiteGraduacao: usuario.permiteGraduacao ?? false,
          }
        : VAZIO,
    );
  }, [aberto, usuario, reset]);

  async function onSubmit(values: FormValues) {
    if (!editando && !values.password.trim()) {
      setError("password", { message: "A senha é obrigatória." });
      return;
    }

    const admin = values.role === 0;
    const polo = polos.find((p) => p.id === values.poloId);

    const payload: Usuario = {
      id: usuario?.id ?? 0,
      login: values.login,
      email: values.email,
      password: values.password,
      role: values.role,
      poloId: admin ? null : values.poloId,
      poloNome: admin ? null : (polo?.nome ?? ""),
      // Só faz sentido para professor; o admin já acessa tudo.
      permiteGraduacao: values.role === 2 ? values.permiteGraduacao : false,
    };

    try {
      await salvar.mutateAsync(payload);
      toast.success(editando ? "Usuário atualizado." : "Usuário criado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao salvar o usuário.",
      );
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar usuário" : "Novo usuário"}
          </DialogTitle>
          <DialogDescription>
            Dados de acesso. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5">Login *</Label>
              <Input {...register("login")} />
              {errors.login && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.login.message}
                </p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Email *</Label>
              <Input type="email" {...register("email")} />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1.5">
                {editando ? "Senha" : "Senha *"}
              </Label>
              <div className="relative">
                <Input
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={
                    editando ? "Deixe em branco para manter a atual" : ""
                  }
                  className="pr-9"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Perfil *</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Administrador</SelectItem>
                      <SelectItem value="2">Professor</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {role === 2 && (
              <div>
                <Label className="mb-1.5">Polo *</Label>
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
                {errors.poloId && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.poloId.message}
                  </p>
                )}
              </div>
            )}

            {role === 2 && (
              <Controller
                control={control}
                name="permiteGraduacao"
                render={({ field }) => (
                  <label className="flex items-start gap-2.5 rounded-md border border-border p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-primary"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span>
                      <span className="font-medium">Acesso ao Programa de Graduação</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Libera este professor a ver e editar posições, programas e
                        golpes restritos.
                      </span>
                    </span>
                  </label>
                )}
              />
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
