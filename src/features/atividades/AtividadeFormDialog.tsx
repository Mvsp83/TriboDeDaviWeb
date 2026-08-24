import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search, Captions } from "lucide-react";
import { toast } from "sonner";
import { useSalvarAtividade } from "@/features/atividades/atividadesApi";
import { VideoSearchDialog } from "@/features/atividades/VideoSearchDialog";
import { urlYouTubeValida, extrairVideoId } from "@/lib/youtube";
import { apiGet, ApiError } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { TipoBloco, TIPOS_BLOCO, type Atividade } from "@/types";
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
  nome: z.string().min(1, "Informe o nome da atividade."),
  tipo: z.number(),
  tags: z.string(),
  videoUrl: z.string().refine(urlYouTubeValida, "Link do YouTube inválido."),
  principio: z.string(),
  referenciaBiblica: z.string(),
  descricao: z.string(),
});

type FormValues = z.infer<typeof schema>;

const VAZIO: FormValues = {
  nome: "",
  tipo: TipoBloco.Posicoes,
  tags: "",
  videoUrl: "",
  principio: "",
  referenciaBiblica: "",
  descricao: "",
};

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  atividade: Atividade | null;
}

export function AtividadeFormDialog({ aberto, onOpenChange, atividade }: Props) {
  const salvar = useSalvarAtividade();
  const editando = atividade !== null;
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: VAZIO,
  });

  const tipo = watch("tipo");

  useEffect(() => {
    if (!aberto) return;
    reset(
      atividade
        ? {
            nome: atividade.nome ?? "",
            tipo: atividade.tipo,
            tags: atividade.tags ?? "",
            videoUrl: atividade.videoUrl ?? "",
            principio: atividade.principio ?? "",
            referenciaBiblica: atividade.referenciaBiblica ?? "",
            descricao: atividade.descricao ?? "",
          }
        : VAZIO,
    );
  }, [aberto, atividade, reset]);

  function termoBusca() {
    const v = getValues();
    return [v.nome, ...v.tags.split(",")]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
  }

  async function onSubmit(values: FormValues) {
    try {
      await salvar.mutateAsync({ id: atividade?.id, ...values });
      toast.success(editando ? "Atividade atualizada." : "Atividade criada.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao salvar a atividade.",
      );
    }
  }

  // Traz a transcrição (legenda traduzida para PT) do vídeo informado e joga na
  // descrição. Depende de o vídeo ter legenda e de o YouTube não bloquear.
  async function trazerTranscricao() {
    const videoId = extrairVideoId(getValues("videoUrl"));
    if (!videoId) {
      toast.warning("Informe primeiro um link de vídeo do YouTube.");
      return;
    }
    setTranscrevendo(true);
    try {
      const r = await apiGet<{ texto: string; aviso: string }>(
        ApiRotas.videoTranscricao(videoId),
      );
      if (!r.texto) {
        toast.error(r.aviso || "Não foi possível trazer a transcrição.");
        return;
      }
      const atual = getValues("descricao").trim();
      // Não apaga o que já foi escrito: acrescenta abaixo.
      setValue("descricao", atual ? `${atual}\n\n${r.texto}` : r.texto, {
        shouldDirty: true,
      });
      toast.success("Transcrição traduzida adicionada à descrição.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível trazer a transcrição.",
      );
    } finally {
      setTranscrevendo(false);
    }
  }

  return (
    <>
      <Dialog open={aberto} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar atividade" : "Nova atividade"}
            </DialogTitle>
            <DialogDescription>
              Técnicas, aquecimentos, dinâmicas e mensagens para reutilizar nos
              planos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label className="mb-1.5">Nome *</Label>
              <Input {...register("nome")} />
              {errors.nome && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.nome.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5">Tipo</Label>
                <Controller
                  control={control}
                  name="tipo"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_BLOCO.map((t) => (
                          <SelectItem key={t.valor} value={String(t.valor)}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label className="mb-1.5">Tags (separadas por vírgula)</Label>
                <Input
                  placeholder="ex: infantil, guarda, finalização"
                  {...register("tags")}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5">
                Vídeo de referência (YouTube, opcional)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...register("videoUrl")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setBuscaAberta(true)}
                  title="Pesquisar vídeo"
                >
                  <Search className="size-4" />
                </Button>
              </div>
              {errors.videoUrl && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.videoUrl.message}
                </p>
              )}
            </div>

            {tipo === TipoBloco.MensagemFinal && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5">Princípio trabalhado</Label>
                  <Input
                    placeholder="ex: Perseverança"
                    {...register("principio")}
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Referência bíblica</Label>
                  <Input
                    placeholder="ex: Tiago 1:12"
                    {...register("referenciaBiblica")}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <Label>Descrição</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={trazerTranscricao}
                  disabled={transcrevendo}
                  title="Traz a legenda do vídeo traduzida para o português"
                >
                  {transcrevendo ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Captions className="size-3.5" />
                  )}
                  Transcrição do vídeo (PT)
                </Button>
              </div>
              <Textarea rows={3} {...register("descricao")} />
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

      <VideoSearchDialog
        aberto={buscaAberta}
        onOpenChange={setBuscaAberta}
        termoInicial={termoBusca()}
      />
    </>
  );
}
