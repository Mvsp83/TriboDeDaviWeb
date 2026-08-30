import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { comprimirImagem } from "@/features/fotosTreino/fotosTreinoApi";
import { enviarFotoInscricao } from "@/features/alunos/fotoAlunoApi";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

// Orientação exibida na captura da foto da inscrição — usada nas duas fichas
// (infantil e adulto). Deixa claro o que se espera e que a foto fora das
// diretrizes é removida na aprovação.
export const ORIENTACAO_FOTO =
  "Tire agora pelo celular ou escolha uma imagem. Deve ser uma foto apenas do rosto, em ambiente claro e bem iluminado. Fotos fora dessas diretrizes serão excluídas pela equipe (professor ou administração) na aprovação da inscrição.";

// Campo de foto da inscrição, autônomo: comprime, envia ao servidor e devolve o
// id do arquivo pelo callback `onChange` (null quando removida).
export function FotoInscricao({
  onChange,
}: {
  onChange: (fotoArquivoId: string | null) => void;
}) {
  const fotoRef = useRef<HTMLInputElement>(null);
  const [id, setId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fotoRef.current) fotoRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Selecione uma imagem.");
      return;
    }
    setEnviando(true);
    try {
      const blob = await comprimirImagem(file, 512, 0.85);
      const novoId = await enviarFotoInscricao(blob);
      setId(novoId);
      setPreview(URL.createObjectURL(blob));
      onChange(novoId);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao enviar a foto.",
      );
    } finally {
      setEnviando(false);
    }
  }

  function remover() {
    setId(null);
    setPreview(null);
    onChange(null);
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-sm font-medium">Foto do aluno (opcional)</p>
      <p className="mb-2 text-xs text-muted-foreground">{ORIENTACAO_FOTO}</p>
      <div className="flex items-center gap-3">
        {preview ? (
          <img
            src={preview}
            alt="Prévia"
            className="size-16 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
            <Camera className="size-5" />
          </span>
        )}
        <input
          ref={fotoRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={escolher}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fotoRef.current?.click()}
          disabled={enviando}
        >
          {enviando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          {id ? "Trocar foto" : "Tirar/escolher foto"}
        </Button>
        {id && (
          <Button type="button" variant="ghost" size="sm" onClick={remover}>
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}
