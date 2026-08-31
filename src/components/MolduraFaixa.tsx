import { useId } from "react";
import { faixaInfo, baseDaCor } from "@/features/alunos/faixa";

// Moldura em formato de faixa de jiu-jitsu ao redor da foto de rosto: anel
// grosso na cor da faixa, nó embaixo e as pontas com ponteira — vermelha na
// faixa preta, preta nas demais. `faixa` é a base (0=Branca .. 40=Preta).
export function MolduraFaixa({
  foto,
  faixa,
  tamanho = 56,
  alt = "Professor",
}: {
  foto: string;
  faixa: number | null;
  tamanho?: number;
  alt?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const temFaixa = faixa != null;
  const cor = temFaixa ? faixaInfo(faixa).cor : "#d4d4d8";
  const ponteira = temFaixa && baseDaCor(faixa) === 40 ? "#c81e1e" : "#18181b";
  const contorno = "rgba(0,0,0,0.22)";

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 100 100"
      role="img"
      aria-label={temFaixa ? `${alt} — faixa ${faixaInfo(faixa).nome}` : alt}
    >
      <defs>
        <clipPath id={`foto-${uid}`}>
          <circle cx="50" cy="45" r="29" />
        </clipPath>
      </defs>

      {/* Pontas com ponteira, atrás do nó */}
      {temFaixa &&
        [-26, 26].map((ang) => (
          <g key={ang} transform={`translate(50 72) rotate(${ang})`}>
            <rect
              x="-4.5"
              y="2"
              width="9"
              height="26"
              rx="4"
              fill={cor}
              stroke={contorno}
              strokeWidth="0.8"
            />
            <rect x="-4.5" y="17" width="9" height="11" rx="4" fill={ponteira} />
          </g>
        ))}

      {/* Foto de rosto */}
      <image
        href={foto}
        x="21"
        y="16"
        width="58"
        height="58"
        clipPath={`url(#foto-${uid})`}
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Faixa (anel grosso) + arestas para dar volume */}
      <circle cx="50" cy="45" r="33" fill="none" stroke={cor} strokeWidth="9" />
      <circle cx="50" cy="45" r="37.5" fill="none" stroke={contorno} strokeWidth="0.8" />
      <circle cx="50" cy="45" r="28.5" fill="none" stroke={contorno} strokeWidth="0.8" />

      {/* Nó, por cima do anel e das pontas */}
      {temFaixa && (
        <g transform="translate(50 72)">
          <rect
            x="-8.5"
            y="-8.5"
            width="17"
            height="17"
            rx="4"
            transform="rotate(45)"
            fill={cor}
            stroke={contorno}
            strokeWidth="0.9"
          />
        </g>
      )}
    </svg>
  );
}
