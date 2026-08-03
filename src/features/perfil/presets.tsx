import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Avatares prontos, gerados inline (nada externo — respeita a CSP). Cada preset
// é um par de cores; a chave salva no banco é "preset:N" (N = índice + 1).
const PRESETS: { de: string; para: string }[] = [
  { de: "#F5C518", para: "#B8860B" },
  { de: "#EF4444", para: "#991B1B" },
  { de: "#3B82F6", para: "#1E3A8A" },
  { de: "#10B981", para: "#065F46" },
  { de: "#8B5CF6", para: "#5B21B6" },
  { de: "#EC4899", para: "#9D174D" },
  { de: "#F97316", para: "#9A3412" },
  { de: "#14B8A6", para: "#115E59" },
  { de: "#64748B", para: "#334155" },
  { de: "#84CC16", para: "#3F6212" },
  { de: "#06B6D4", para: "#155E75" },
  { de: "#A855F7", para: "#6B21A8" },
];

export const TOTAL_PRESETS = PRESETS.length;

// Lista de chaves ("preset:1".."preset:12") para a grade de seleção.
export const CHAVES_PRESETS = PRESETS.map((_, i) => `preset:${i + 1}`);

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/[.\s@]+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function indiceDePreset(valor: string): number | null {
  const m = /^preset:(\d+)$/.exec(valor);
  if (!m) return null;
  const idx = Number(m[1]) - 1;
  return idx >= 0 && idx < PRESETS.length ? idx : null;
}

// Desenha o SVG de um preset (círculo com gradiente diagonal + inicial opcional).
function PresetSvg({ indice, label }: { indice: number; label?: string }) {
  const { de, para } = PRESETS[indice];
  const id = `g${indice}`;
  return (
    <svg viewBox="0 0 40 40" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={de} />
          <stop offset="100%" stopColor={para} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill={`url(#${id})`} />
      {label && (
        <text
          x="20"
          y="20"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="#fff"
          fillOpacity="0.95"
        >
          {label}
        </text>
      )}
    </svg>
  );
}

// Resolve o valor do avatar: preset:* → SVG; data:* → imagem; senão iniciais.
export function AvatarView({
  valor,
  nome,
  className,
}: {
  valor?: string | null;
  nome: string;
  className?: string;
}) {
  const label = iniciais(nome);
  const preset = valor ? indiceDePreset(valor) : null;

  return (
    <Avatar className={className}>
      {valor && valor.startsWith("data:") ? (
        <>
          <AvatarImage src={valor} alt={nome} />
          <AvatarFallback>{label}</AvatarFallback>
        </>
      ) : preset !== null ? (
        <PresetSvg indice={preset} label={label} />
      ) : (
        <AvatarFallback>{label}</AvatarFallback>
      )}
    </Avatar>
  );
}

// Miniatura clicável de um preset (usada na grade de seleção do diálogo).
export function PresetOption({
  chave,
  selecionado,
  onClick,
}: {
  chave: string;
  selecionado: boolean;
  onClick: () => void;
}) {
  const idx = indiceDePreset(chave);
  if (idx === null) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Avatar ${chave}`}
      aria-pressed={selecionado}
      className={cn(
        "size-12 overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:scale-105",
        selecionado && "ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <PresetSvg indice={idx} />
    </button>
  );
}
