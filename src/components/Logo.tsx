import { cn } from "@/lib/utils";

// Logo oficial do Instituto Tribo de Davi (versão branca, para o tema escuro).
// Arquivos em public/: logo.png (símbolo + texto) e simbolo.png (só o símbolo).

// Logo completo — símbolo da Estrela de Davi com coração + "INSTITUTO TRIBO DE
// DAVI". Usado no Login e no topo da Sidebar.
export function LogoLockup({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Instituto Tribo de Davi"
      className={cn("h-10 w-auto select-none", className)}
      draggable={false}
    />
  );
}

// Apenas o símbolo (sem texto), para contextos compactos.
export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/simbolo.png"
      alt="Instituto Tribo de Davi"
      className={cn("size-9 select-none object-contain", className)}
      draggable={false}
    />
  );
}
