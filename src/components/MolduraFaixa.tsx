import { useId } from "react";
import { faixaInfo, baseDaCor } from "@/features/alunos/faixa";

// Moldura em formato de faixa de jiu-jitsu ao redor da foto de rosto. Anel
// grosso na cor da faixa com linhas de costura, nó (duas fitas cruzadas) e as
// pontas com ponteira costurada — vermelha na faixa preta, preta nas demais.
// `faixa` é a base (0=Branca .. 40=Preta).

// Cor da linha de costura conforme o tom da faixa (clara em faixa escura e
// vice-versa), para a costura aparecer nos dois casos.
function corCostura(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "rgba(0,0,0,0.18)";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.5 ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.20)";
}

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
  const borda = "rgba(0,0,0,0.28)";
  const costura = corCostura(cor);
  const costuraPonteira = "rgba(255,255,255,0.32)";

  // Uma ponta da faixa (fita + ponteira costurada), inclinada a partir do nó.
  const ponta = (ang: number) => (
    <g key={ang} transform={`translate(50 73) rotate(${ang})`}>
      <rect x="-5" y="1" width="10" height="27" rx="3" fill={cor} stroke={borda} strokeWidth="0.8" />
      <line x1="0" y1="3" x2="0" y2="15" stroke={costura} strokeWidth="0.7" />
      {/* Ponteira (barra costurada na ponta) */}
      <rect x="-5" y="16" width="10" height="12" rx="3" fill={ponteira} stroke={borda} strokeWidth="0.6" />
      <line x1="-3.4" y1="20" x2="3.4" y2="20" stroke={costuraPonteira} strokeWidth="0.7" />
      <line x1="-3.4" y1="24" x2="3.4" y2="24" stroke={costuraPonteira} strokeWidth="0.7" />
    </g>
  );

  // Uma fita do nó, cruzando sobre a foto.
  const fitaNo = (ang: number) => (
    <g transform={`rotate(${ang})`}>
      <rect x="-5.5" y="-11" width="11" height="22" rx="3.5" fill={cor} stroke={borda} strokeWidth="0.9" />
      <line x1="-2.7" y1="-8.5" x2="-2.7" y2="8.5" stroke={costura} strokeWidth="0.6" />
      <line x1="2.7" y1="-8.5" x2="2.7" y2="8.5" stroke={costura} strokeWidth="0.6" />
    </g>
  );

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

      {/* Pontas, atrás do nó e da fita */}
      {temFaixa && [-24, 24].map(ponta)}

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

      {/* Faixa (anel grosso) com arestas e costura longitudinal */}
      <circle cx="50" cy="45" r="33" fill="none" stroke={cor} strokeWidth="10" />
      <circle cx="50" cy="45" r="38" fill="none" stroke={borda} strokeWidth="0.8" />
      <circle cx="50" cy="45" r="28" fill="none" stroke={borda} strokeWidth="0.8" />
      <circle cx="50" cy="45" r="31" fill="none" stroke={costura} strokeWidth="0.7" />
      <circle cx="50" cy="45" r="35" fill="none" stroke={costura} strokeWidth="0.7" />

      {/* Nó: duas fitas cruzadas, por cima do anel e das pontas */}
      {temFaixa && (
        <g transform="translate(50 73)">
          {fitaNo(45)}
          {fitaNo(-45)}
        </g>
      )}
    </svg>
  );
}
