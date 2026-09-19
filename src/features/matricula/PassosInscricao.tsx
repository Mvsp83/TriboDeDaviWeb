import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Peças visuais do formulário de inscrição. Ficam separadas do
// MatriculaPage.tsx (que tem toda a validação e o envio) para que a troca de
// visual não encoste na lógica: no MatriculaPage você só substitui o cabeçalho
// de etapa e os botões de navegação por estes componentes.

/** Barra de progresso das etapas — um traço por etapa, preenchido em dourado. */
export function ProgressoEtapas({
  etapas,
  atual,
}: {
  etapas: string[];
  atual: number;
}) {
  return (
    <div>
      <div className="flex gap-1.5">
        {etapas.map((nome, i) => (
          <div
            key={nome}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-[var(--dur-slow)] ease-[var(--ease-out-premium)]",
              i <= atual ? "bg-primary" : "bg-secondary",
            )}
          />
        ))}
      </div>
      <p className="mt-3 font-mono text-xs text-muted-foreground">
        Etapa {atual + 1} de {etapas.length} · {etapas[atual]}
      </p>
    </div>
  );
}

/** Cartão da etapa: número grande em marca d'água + título + campos. */
export function CartaoEtapa({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center gap-3.5 border-b border-border pb-5">
        <span className="font-display text-3xl font-bold leading-none text-secondary">
          {String(numero).padStart(2, "0")}
        </span>
        <h2 className="font-display text-xl font-semibold uppercase tracking-tight text-primary md:text-2xl">
          {titulo}
        </h2>
      </div>
      <div className="mt-6 flex flex-col gap-4.5">{children}</div>
    </div>
  );
}

/** Navegação entre etapas. `enviando` trava o botão no último passo. */
export function NavegacaoEtapas({
  onAnterior,
  onProximo,
  primeira,
  ultima,
  enviando,
}: {
  onAnterior: () => void;
  onProximo: () => void;
  primeira?: boolean;
  ultima?: boolean;
  enviando?: boolean;
}) {
  return (
    <div className="mt-8 flex justify-between gap-3 border-t border-border pt-6">
      <button
        type="button"
        onClick={onAnterior}
        disabled={primeira}
        className="inline-flex items-center gap-2 rounded-[9px] border border-border px-6 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.1em] transition-colors duration-[var(--dur-fast)] hover:border-primary hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
      >
        <ArrowLeft className="size-4" />
        Anterior
      </button>
      <button
        type="button"
        onClick={onProximo}
        disabled={enviando}
        className="inline-flex items-center gap-2 rounded-[9px] bg-primary px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-primary-foreground transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-premium)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_var(--color-primary)] disabled:pointer-events-none disabled:opacity-60"
      >
        {enviando && <Loader2 className="size-4 animate-spin" />}
        {ultima ? "Finalizar inscrição" : "Próximo"}
        {!ultima && !enviando && <ArrowRight className="size-4" />}
      </button>
    </div>
  );
}
