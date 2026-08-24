import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Captions, Search } from "lucide-react";
import { toast } from "sonner";
import { urlYouTubeValida, extrairVideoId, urlEmbed } from "@/lib/youtube";
import { apiGet, ApiError } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { VideoSearchDialog } from "@/features/atividades/VideoSearchDialog";
import { useSalvarPosicao, useConfigGraduacao } from "./graduacaoApi";
import { CATEGORIAS, type Posicao } from "./tipos";
import { textoRestricao } from "./restricao";
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
  nome: z.string().min(1, "Informe o nome da posição."),
  nomeEn: z.string(),
  categoria: z.string().min(1),
  tags: z.string(),
  videoUrl: z.string().refine(urlYouTubeValida, "Link do YouTube inválido."),
  descricao: z.string(),
  transcricao: z.string(),
  golpeRestritoId: z.string(), // "none" quando não vinculado
});

type FormValues = z.infer<typeof schema>;

const VAZIO: FormValues = {
  nome: "",
  nomeEn: "",
  categoria: "fundamento",
  tags: "",
  videoUrl: "",
  descricao: "",
  transcricao: "",
  golpeRestritoId: "none",
};

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  posicao: Posicao | null;
}

export function PosicaoFormDialog({ aberto, onOpenChange, posicao }: Props) {
  const salvar = useSalvarPosicao();
  const { data: cfg } = useConfigGraduacao();
  const golpes = cfg?.golpesRestritos ?? [];
  const editando = posicao !== null;
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);

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

  const videoUrl = watch("videoUrl");
  const videoId = extrairVideoId(videoUrl);
  const golpeSelId = watch("golpeRestritoId");
  const golpeSel = golpes.find((g) => g.id === golpeSelId);

  useEffect(() => {
    if (!aberto) return;
    reset(
      posicao
        ? {
            nome: posicao.nome ?? "",
            nomeEn: posicao.nomeEn ?? "",
            categoria: posicao.categoria ?? "fundamento",
            tags: posicao.tags ?? "",
            videoUrl: posicao.videoUrl ?? "",
            descricao: posicao.descricao ?? "",
            transcricao: posicao.transcricao ?? "",
            golpeRestritoId: posicao.golpeRestritoId ?? "none",
          }
        : VAZIO,
    );
  }, [aberto, posicao, reset]);

  // Monta o termo de busca do vídeo a partir do nome (PT/EN) e das tags.
  function termoBusca() {
    const v = getValues();
    return [v.nome, v.nomeEn, ...v.tags.split(",")]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
  }

  async function onSubmit(values: FormValues) {
    try {
      await salvar.mutateAsync({
        id: posicao?.id ?? "",
        nome: values.nome,
        nomeEn: values.nomeEn || undefined,
        categoria: values.categoria,
        tags: values.tags || undefined,
        videoUrl: values.videoUrl || undefined,
        descricao: values.descricao || undefined,
        transcricao: values.transcricao || undefined,
        golpeRestritoId:
          values.golpeRestritoId === "none" ? null : values.golpeRestritoId,
      });
      toast.success(editando ? "Posição atualizada." : "Posição criada.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a posição.");
    }
  }

  // Traz a legenda traduzida (PT) do vídeo para o campo de transcrição.
  async function trazerTranscricao() {
    const id = extrairVideoId(getValues("videoUrl"));
    if (!id) {
      toast.warning("Informe primeiro um link de vídeo do YouTube.");
      return;
    }
    setTranscrevendo(true);
    try {
      const r = await apiGet<{ texto: string; aviso: string }>(
        ApiRotas.videoTranscricao(id),
      );
      if (!r.texto) {
        toast.error(r.aviso || "Não foi possível trazer a transcrição.");
        return;
      }
      setValue("transcricao", r.texto, { shouldDirty: true });
      toast.success("Transcrição traduzida adicionada.");
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
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar posição" : "Nova posição"}</DialogTitle>
          <DialogDescription>
            Técnica do catálogo de jiu-jitsu — usada como requisito nos programas
            de graduação e na apostila.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5">Nome *</Label>
              <Input {...register("nome")} placeholder="ex: Raspagem tesourinha" />
              {errors.nome && (
                <p className="mt-1 text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>
            <div>
              <Label className="mb-1.5">Nome em inglês</Label>
              <Input {...register("nomeEn")} placeholder="ex: Scissor sweep" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5">Categoria</Label>
              <Controller
                control={control}
                name="categoria"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c.valor} value={c.valor}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="mb-1.5">Tags (separadas por vírgula)</Label>
              <Input {...register("tags")} placeholder="ex: guarda, raspagem" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5">Vídeo de referência (YouTube, opcional)</Label>
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
                title="Pesquisar vídeo no YouTube ou Google"
              >
                <Search className="size-4" />
              </Button>
            </div>
            {errors.videoUrl && (
              <p className="mt-1 text-xs text-destructive">{errors.videoUrl.message}</p>
            )}
            {videoId && (
              <div className="mt-2 aspect-video w-full overflow-hidden rounded-md border border-border">
                <iframe
                  src={urlEmbed(videoId)}
                  title="Prévia do vídeo"
                  className="h-full w-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          <div>
            <Label className="mb-1.5">Descrição</Label>
            <Textarea rows={3} {...register("descricao")} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Label>Transcrição do vídeo</Label>
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
                Buscar transcrição (PT)
              </Button>
            </div>
            <Textarea
              rows={4}
              placeholder="Legenda do vídeo traduzida — preenchida pelo botão acima ou digitada."
              {...register("transcricao")}
            />
          </div>

          <div>
            <Label className="mb-1.5">Restrição por idade/faixa (IBJJF, opcional)</Label>
            <Controller
              control={control}
              name="golpeRestritoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {golpes.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {golpeSel && textoRestricao(golpeSel) && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                {textoRestricao(golpeSel)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Vincula esta posição a um golpe da tabela de golpes restritos —
              aparece como aviso no catálogo e na apostila.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
