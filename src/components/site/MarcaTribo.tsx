import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Símbolo do instituto (estrela de Davi + coração, de /simbolo.png). Recolorido
// pela cor do texto — use `text-primary` (dourado), `text-brand-red`, etc.
// Passe a largura por className (ex.: `w-9`); a altura segue a proporção real.
export function MarcaTribo({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("marca-tribo aspect-[102/113] shrink-0", className)}
      style={style}
    />
  );
}
