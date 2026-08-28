import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { comprimirImagem } from "@/features/fotosTreino/fotosTreinoApi";
import {
  useSalvarAlunoFoto,
  useRemoverAlunoFoto,
} from "@/features/alunos/fotoAlunoApi";
import { AlunoAvatar } from "@/features/alunos/AlunoAvatar";
import { Button } from "@/components/ui/button";

// Seção de foto no cadastro do aluno: mostra a foto atual e permite tirar
// (câmera) ou escolher uma nova, ou remover. Reaproveita a compactação no
// cliente. Para um aluno novo (sem id), orienta a salvar o cadastro antes.
export function FotoAlunoCadastro({
  alunoId,
  nome,
  temFoto,
}: {
  alunoId: number | null;
  nome: string;
  temFoto: boolean;
}) {
  const salvar = useSalvarAlunoFoto();
  const remover = useRemoverAlunoFoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file || !alunoId) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Selecione uma imagem.");
      return;
    }
    setEnviando(true);
    try {
      const blob = await comprimirImagem(file, 512, 0.85);
      await salvar.mutateAsync({ alunoId, arquivo: blob });
      toast.success("Foto atualizada.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar a foto.");
    } finally {
      setEnviando(false);
    }
  }

  async function excluir() {
    if (!alunoId) return;
    try {
      await remover.mutateAsync(alunoId);
      toast.success("Foto removida.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <AlunoAvatar alunoId={alunoId} nome={nome || "?"} temFoto={temFoto} size={64} ampliavel />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={escolher}
        className="hidden"
      />
      {alunoId ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
          >
            {enviando ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {temFoto ? "Trocar foto" : "Tirar/escolher foto"}
          </Button>
          {temFoto && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={excluir}
              disabled={remover.isPending}
            >
              <Trash2 className="size-4" />
              Remover
            </Button>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Salve o cadastro para poder adicionar a foto.
        </p>
      )}
    </div>
  );
}
