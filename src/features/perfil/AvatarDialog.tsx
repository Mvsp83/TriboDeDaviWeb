import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { redimensionarQuadrado } from "@/lib/imagem";
import { ApiError } from "@/lib/api";
import { useSalvarAvatar } from "@/features/perfil/perfilApi";
import {
  AvatarView,
  PresetOption,
  CHAVES_PRESETS,
} from "@/features/perfil/presets";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  nome: string;
  avatarAtual: string | null;
}

export function AvatarDialog({ aberto, onOpenChange, nome, avatarAtual }: Props) {
  const salvar = useSalvarAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selecionado, setSelecionado] = useState<string | null>(avatarAtual);
  const [processando, setProcessando] = useState(false);

  async function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessando(true);
    try {
      const dataUrl = await redimensionarQuadrado(file);
      setSelecionado(dataUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível processar a imagem.");
    } finally {
      setProcessando(false);
    }
  }

  async function onSalvar() {
    try {
      await salvar.mutateAsync(selecionado);
      toast.success("Avatar atualizado!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível salvar o avatar.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar avatar</DialogTitle>
          <DialogDescription>
            Escolha um avatar pronto ou envie uma foto pessoal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <AvatarView valor={selecionado} nome={nome} className="size-20" />
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onFoto}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={processando}
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Enviar foto
          </Button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Avatares prontos</p>
          <div className="flex flex-wrap gap-2">
            {CHAVES_PRESETS.map((chave) => (
              <PresetOption
                key={chave}
                chave={chave}
                selecionado={selecionado === chave}
                onClick={() => setSelecionado(chave)}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => setSelecionado(null)}
            disabled={selecionado === null}
            className="text-destructive focus:text-destructive"
          >
            Remover avatar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSalvar} disabled={salvar.isPending}>
              {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
