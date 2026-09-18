import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Faixas do jiu-jitsu infantil, com cores vivas para o site.
// `ponta` = cor do friso (onde ficam os graus); a preta tem ponta vermelha,
// como a faixa preta real.
export const FAIXAS: { nome: string; cor: string; ponta?: string }[] = [
  { nome: "Branca", cor: "#fbfbfa" },
  { nome: "Cinza", cor: "#9aa1ac" },
  { nome: "Amarela", cor: "#ffd60a" },
  { nome: "Laranja", cor: "#ff7a1a" },
  { nome: "Verde", cor: "#17c34a" },
  { nome: "Azul", cor: "#2563ff" },
  { nome: "Roxa", cor: "#9327ff" },
  { nome: "Marrom", cor: "#7a3d15" },
  { nome: "Preta", cor: "#161618", ponta: "#e11d2a" },
];

// Relevo de couro: claro em cima, cor no meio, sombra embaixo.
const relevo = (c: string) =>
  `linear-gradient(180deg, color-mix(in srgb, ${c} 78%, #fff) 0%, ${c} 46%, color-mix(in srgb, ${c} 82%, #000) 100%)`;

// Uma faixa "realista": barra com brilho de couro, friso (ponta) e 4 graus.
// Tudo em CSS, sem imagens. Os graus crescem ao entrar em tela (cresce-y) e um
// brilho atravessa a barra em loop (.brilho-faixa).
export function FaixaBelt({
  nome,
  cor,
  ponta = "#141416",
  className,
}: {
  nome: string;
  cor: string;
  ponta?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div
        className="brilho-faixa relative h-6 w-full overflow-hidden rounded-[3px] shadow-md ring-1 ring-black/25 md:h-8"
        style={{ background: relevo(cor) }}
      >
        <div
          className="absolute inset-y-0 right-1.5 flex w-[32%] items-center justify-evenly px-1"
          style={{ background: relevo(ponta) }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-full w-[2px] rounded-[1px] bg-white/90"
              style={{
                animation: "cresce-y 0.5s var(--ease-out-premium) both",
                animationTimeline: "view()",
                animationRange: `entry ${10 + i * 6}% cover ${34 + i * 4}%`,
              }}
            />
          ))}
        </div>
      </div>
      <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
        {nome}
      </span>
    </div>
  );
}

// A trilha inteira, da branca à preta.
export function TrilhaFaixas({
  titulo = "Da faixa branca à preta",
  legenda = "cada grau é uma etapa vencida",
}: {
  titulo?: string;
  legenda?: string;
}) {
  return (
    <div>
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="revela font-display text-2xl font-semibold uppercase tracking-tight md:text-3xl">
          {titulo}
        </h2>
        <span className="font-mono text-xs text-muted-foreground">{legenda}</span>
      </div>
      <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-9 sm:gap-x-2.5">
        {FAIXAS.map((f) => (
          <FaixaBelt key={f.nome} nome={f.nome} cor={f.cor} ponta={f.ponta} />
        ))}
      </div>
    </div>
  );
}

// Letreiro dos valores do projeto, em loop contínuo. O conteúdo é duplicado:
// a animação desloca -50%, então a emenda é invisível.
export function LetreiroValores() {
  const valores = [
    "Disciplina",
    "Respeito",
    "Perseverança",
    "Fé",
    "Cidadania",
    "Autocontrole",
  ];
  const volta = (chave: string) =>
    valores.map((v, i) => (
      <span key={`${chave}-${v}`} className="flex items-center gap-16">
        {v}
        <span className={i % 2 === 0 ? "text-primary" : "text-brand-red"}>·</span>
      </span>
    ));

  return (
    <div className="overflow-hidden border-y border-border bg-card/40">
      <div className="letreiro flex gap-16 whitespace-nowrap py-5 font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
        {volta("a")}
        {volta("b")}
      </div>
    </div>
  );
}

// Botão de destaque do site (dourado, com elevação no hover). Usa <Link> por
// padrão; passe `href` para links externos.
export function BotaoSite({
  to,
  href,
  children,
  variante = "solido",
  className,
  onClick,
}: {
  to?: string;
  href?: string;
  children: React.ReactNode;
  variante?: "solido" | "contorno";
  className?: string;
  onClick?: () => void;
}) {
  const base = cn(
    "inline-flex items-center justify-center gap-2.5 rounded-lg px-6 py-3.5",
    "font-display text-sm font-semibold uppercase tracking-[0.1em]",
    "transition-[transform,box-shadow,background-color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out-premium)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    variante === "solido"
      ? "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-10px_var(--color-primary)]"
      : "border border-border text-foreground hover:-translate-y-0.5 hover:border-primary hover:bg-secondary",
    className,
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={base}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to ?? "/"} onClick={onClick} className={base}>
      {children}
    </Link>
  );
}
