import { SobreApp } from "@/components/SobreApp";
import { MarcaTribo } from "@/components/site/MarcaTribo";

// Rodapé único de todo o site público.
export function RodapeSite() {
  const anoAtual = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-x-2 px-4 py-6 text-[11px] text-muted-foreground sm:gap-x-6 sm:text-xs">
        <span className="flex items-center gap-1.5 whitespace-nowrap sm:gap-2">
          <MarcaTribo className="w-4 shrink-0 text-primary" />© {anoAtual} Instituto
          Tribo de Davi
        </span>
        <SobreApp className="whitespace-nowrap font-medium transition-colors hover:text-foreground" />
      </div>
    </footer>
  );
}
