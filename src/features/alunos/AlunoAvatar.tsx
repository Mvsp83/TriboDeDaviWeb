import { useState } from "react";
import { X } from "lucide-react";
import { useAlunoFoto } from "@/features/alunos/fotoAlunoApi";
import { cn } from "@/lib/utils";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const a = partes[0]?.[0] ?? "";
  const b = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (a + b).toUpperCase();
}

// Avatar do aluno: mostra a foto (base64, buscada sob demanda) quando a tela
// está habilitada e o aluno tem foto; senão, as iniciais. Reutilizável em
// cadastro, chamada, carteirinha, lista e portal do responsável.
// Com `ampliavel`, clicar na foto abre um lightbox com a imagem grande.
export function AlunoAvatar({
  alunoId,
  nome,
  temFoto = false,
  habilitado = true,
  size = 40,
  ampliavel = false,
  className,
}: {
  alunoId: number | null;
  nome: string;
  temFoto?: boolean;
  habilitado?: boolean;
  size?: number;
  ampliavel?: boolean;
  className?: string;
}) {
  const { data: dataUri } = useAlunoFoto(alunoId, habilitado && temFoto);
  const mostrarFoto = habilitado && temFoto && !!dataUri;
  const [ampliada, setAmpliada] = useState(false);

  const conteudo = (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-semibold text-muted-foreground",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden={!mostrarFoto}
    >
      {mostrarFoto ? (
        <img src={dataUri} alt={nome} className="h-full w-full object-cover" />
      ) : (
        iniciais(nome)
      )}
    </span>
  );

  // Sem foto ou não ampliável: só o avatar.
  if (!mostrarFoto || !ampliavel) return conteudo;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setAmpliada(true);
        }}
        title="Ver foto"
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {conteudo}
      </button>

      {ampliada && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setAmpliada(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${nome}`}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setAmpliada(false);
            }}
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
          <figure className="max-h-[90svh] max-w-lg" onClick={(e) => e.stopPropagation()}>
            <img
              src={dataUri}
              alt={nome}
              className="max-h-[80svh] w-auto rounded-lg object-contain"
            />
            <figcaption className="mt-2 text-center text-sm text-white/80">{nome}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
