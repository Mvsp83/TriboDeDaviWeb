import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, FileText } from "lucide-react";
import { CabecalhoSite } from "@/components/site/CabecalhoSite";
import { RodapeSite } from "@/components/site/RodapeSite";
import { BotaoVoltarAoTopo } from "@/components/BotaoVoltarAoTopo";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

// Peças compartilhadas por todas as páginas públicas internas. A ideia é que
// cada página descreva só o seu conteúdo — capa, seções e listas saem daqui,
// então o ritmo visual (respiro, filete vermelho, tipografia) é o mesmo em
// todas sem ninguém precisar repetir classe.

/** Casca de página interna: cabeçalho, capa, conteúdo e rodapé. */
export function PaginaSite({
  titulo,
  subtitulo,
  etiqueta,
  tituloDocumento,
  capa,
  children,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  /** Pílula pequena acima do título. Ex.: "Transparência e impacto". */
  etiqueta?: ReactNode;
  tituloDocumento?: string;
  /** Conteúdo extra na capa (filtros, abas). */
  capa?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  useDocumentTitle(tituloDocumento ?? (typeof titulo === "string" ? titulo : ""));

  return (
    <div className="site-publico min-h-svh bg-background text-foreground">
      <CabecalhoSite />

      <section className="relative overflow-hidden border-b border-border bg-[linear-gradient(115deg,var(--color-background)_58%,color-mix(in_oklab,var(--color-brand-red)_14%,var(--color-background))_100%)]">
        {/* Filete dourado→vermelho da marca, na lateral. */}
        <div className="absolute left-0 top-12 hidden h-40 w-1.5 bg-gradient-to-b from-primary to-brand-red md:block" />

        <div className="mx-auto max-w-5xl px-4 pb-12 pt-8 md:px-8 md:pb-14 md:pt-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-[gap,color] duration-[var(--dur-fast)] hover:gap-3.5 hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </button>

          {etiqueta && (
            <span className="entra-curto mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 px-3.5 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              {etiqueta}
            </span>
          )}

          <h1 className="entra atraso-1 mt-4 max-w-3xl text-balance font-display text-4xl font-bold uppercase leading-[0.98] md:text-6xl">
            {titulo}
          </h1>

          {subtitulo && (
            <p className="entra atraso-2 mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground md:text-lg">
              {subtitulo}
            </p>
          )}

          {capa && <div className="entra atraso-3 mt-7">{capa}</div>}
        </div>
      </section>

      {children}

      <RodapeSite />
      <BotaoVoltarAoTopo className="bottom-20" />
    </div>
  );
}

/** Seção com título e o filete vermelho que se desenha ao entrar em tela. */
export function SecaoSite({
  titulo,
  acessorio,
  className,
  children,
}: {
  titulo?: ReactNode;
  /** Elemento à direita do título (contador, seletor de ano). */
  acessorio?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16", className)}>
      {titulo && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-tight md:text-3xl">
              {titulo}
            </h2>
            {acessorio}
          </div>
          <div className="revela-regua mt-2 h-[3px] w-[70px] bg-brand-red" />
        </>
      )}
      <div className={titulo ? "mt-8" : undefined}>{children}</div>
    </section>
  );
}

/** Linha com rótulo, valor e barra proporcional que cresce ao entrar em tela. */
export function BarraProporcao({
  rotulo,
  valor,
  porcentagem,
  cor = "var(--color-primary)",
}: {
  rotulo: ReactNode;
  valor: ReactNode;
  porcentagem: number;
  cor?: string;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex justify-between gap-4 text-sm">
        <span>{rotulo}</span>
        <span className="tabular-nums text-muted-foreground">{valor}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="revela-regua h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, porcentagem))}%`, background: cor }}
        />
      </div>
    </div>
  );
}

/** Pergunta do FAQ. Abre e fecha; a seta gira e a resposta entra suave. */
export function ItemAcordeao({
  pergunta,
  children,
  aberturaInicial = false,
}: {
  pergunta: string;
  children: ReactNode;
  aberturaInicial?: boolean;
}) {
  const [aberta, setAberta] = useState(aberturaInicial);
  return (
    <div
      className={cn(
        "mb-2.5 overflow-hidden rounded-xl border transition-colors duration-[var(--dur-base)]",
        aberta ? "border-ring bg-card" : "border-border bg-card/60",
      )}
    >
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[0.95rem] font-semibold"
      >
        {pergunta}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-[transform,color] duration-[var(--dur-base)] ease-[var(--ease-out-premium)]",
            aberta ? "rotate-180 text-primary" : "text-muted-foreground",
          )}
        />
      </button>
      {aberta && (
        <div className="entra-curto px-5 pb-5">
          <div className="mb-3.5 h-px bg-border" />
          <div className="text-pretty text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/** Link de documento (PDF) da prestação de contas. */
export function LinkDocumento({
  nome,
  href,
  tipo = "PDF",
}: {
  nome: string;
  href: string;
  tipo?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-2 flex items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-3 text-sm transition-[transform,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out-premium)] hover:translate-x-1 hover:border-primary"
    >
      <FileText className="size-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate">{nome}</span>
      <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
        {tipo}
      </span>
    </a>
  );
}

/** Campo de formulário com foco dourado, do mesmo desenho em todas as páginas. */
export function CampoSite({
  rotulo,
  obrigatorio,
  ajuda,
  children,
}: {
  rotulo: string;
  obrigatorio?: boolean;
  ajuda?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold text-foreground/80">
        {rotulo}
        {obrigatorio && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {ajuda && <p className="mt-1.5 text-xs text-muted-foreground">{ajuda}</p>}
    </div>
  );
}

/** Classe única dos inputs/textarea/select do site público. */
export const classeCampo = cn(
  "w-full rounded-[10px] border border-input bg-input/40 px-4 py-3.5 text-[15px] text-foreground",
  "outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)]",
  "placeholder:text-muted-foreground",
  "focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]",
);
