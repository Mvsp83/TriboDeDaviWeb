import { SobreApp } from "@/components/SobreApp";
import { MarcaTribo } from "@/components/site/MarcaTribo";

// Rodapé único de todo o site público.
export function RodapeSite() {
  const anoAtual = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <MarcaTribo className="w-4 text-primary" />© {anoAtual} Instituto
          Tribo de Davi
        </span>
        <SobreApp className="font-medium transition-colors hover:text-foreground" />
      </div>
    </footer>
  );
}
