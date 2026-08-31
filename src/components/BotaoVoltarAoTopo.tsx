import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Botão flutuante "voltar ao topo": aparece depois de rolar um pouco e leva o
// scroll da janela de volta ao topo. As telas rolam na própria janela
// (cascas com min-h-svh), então observamos window.scrollY. O offset de posição
// (bottom-*) é passado por quem monta, para não conflitar com elementos fixos
// da tela (assistente, navegação inferior).
export function BotaoVoltarAoTopo({ className }: { className?: string }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > 400);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  if (!visivel) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      className={cn(
        "fixed right-4 z-40 flex size-11 items-center justify-center rounded-full",
        "border border-border bg-card/95 text-foreground shadow-lg backdrop-blur",
        "transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
    >
      <ArrowUp className="size-5" />
    </button>
  );
}
