import { cn } from "@/lib/utils";

// Emblema provisório da marca: escudo com a Estrela de Davi em dourado.
// Troque por /images/logo.png quando o arquivo oficial estiver disponível.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-9", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M32 3 8 11v20c0 15 10 24 24 30 14-6 24-15 24-30V11L32 3Z"
        fill="#0a0a0b"
        stroke="#f5c518"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 17l4.9 8.5H27.1L32 17Zm0 22l-4.9-8.5h9.8L32 39Zm10-11-4.9 8.5-4.9-8.5H42Zm-20 0h9.8L26.9 36.5 22 28Z"
        fill="#f5c518"
        opacity="0.95"
      />
    </svg>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-wide text-foreground">
          TRIBO DE DAVI
        </div>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
          Jiu-Jitsu
        </div>
      </div>
    </div>
  );
}
