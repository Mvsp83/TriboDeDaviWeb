import { useState } from "react";
import { cn } from "@/lib/utils";

// Imagem do site público com espaço reservado. Enquanto a foto real não é
// colocada em /public, mostra uma textura listrada com a descrição do que
// deve entrar ali — nunca um bloco vazio nem um ícone genérico.
//
// Para usar uma foto real: coloque o arquivo em /public (ex.: /heroi.jpg) e
// passe `src="/heroi.jpg"`. Se o arquivo não existir, cai no reservado.
export function FotoSite({
  src,
  alt,
  descricao,
  className,
  posicaoLegenda = "canto",
}: {
  src?: string;
  alt?: string;
  /** O que deve entrar aqui, em uma linha. Ex.: "treino no tatame". */
  descricao: string;
  className?: string;
  /** Onde fica a legenda do reservado. "canto" evita cruzar com o título. */
  posicaoLegenda?: "canto" | "centro";
}) {
  const [falhou, setFalhou] = useState(false);

  if (src && !falhou) {
    return (
      <img
        src={src}
        alt={alt ?? descricao}
        loading="lazy"
        onError={() => setFalhou(true)}
        className={cn("size-full object-cover", className)}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "relative size-full",
        // Listras diagonais no tom das superfícies — some no fundo em vez de
        // competir com o conteúdo.
        "bg-[repeating-linear-gradient(115deg,var(--color-secondary)_0_14px,var(--color-card)_14px_28px)]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute flex items-center",
          posicaoLegenda === "centro"
            ? "inset-0 justify-center"
            : "inset-x-0 bottom-0 justify-end p-4",
        )}
      >
        <span className="rounded-md border border-dashed border-border px-3 py-2 font-mono text-[11px] tracking-wider text-muted-foreground">
          {descricao}
        </span>
      </span>
    </div>
  );
}
