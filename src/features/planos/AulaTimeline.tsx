import { blocoCor } from "@/features/planos/blocoCores";
import { TIPO_BLOCO_LABEL } from "@/types";

export interface BlocoTimeline {
  tipo: number;
  nome: string;
  minutos: number;
}

// Barra proporcional dos blocos + tempo livre hachurado, legenda e resumo.
export function AulaTimeline({
  blocos,
  duracaoTotalMinutos,
}: {
  blocos: BlocoTimeline[];
  duracaoTotalMinutos: number;
}) {
  if (blocos.length === 0) return null;

  const soma = blocos.reduce((s, b) => s + b.minutos, 0);
  const totalBase = Math.max(duracaoTotalMinutos, soma, 1);
  const livres = duracaoTotalMinutos - soma;

  const tiposDistintos = [...new Set(blocos.map((b) => b.tipo))];

  const resumo =
    livres > 0
      ? { texto: `Restam ${livres} min`, cor: "var(--warning)" }
      : livres === 0
        ? { texto: "Duração completa", cor: "var(--success)" }
        : { texto: `Excede em ${-livres} min`, cor: "var(--destructive)" };

  return (
    <div className="space-y-2">
      <div className="flex h-7 overflow-hidden rounded-md">
        {blocos.map((b, i) => (
          <div
            key={i}
            title={`${b.nome} — ${b.minutos} min`}
            className="flex min-w-1 items-center justify-center overflow-hidden whitespace-nowrap text-[11px] font-medium text-white"
            style={{
              width: `${(b.minutos * 100) / totalBase}%`,
              background: blocoCor(b.tipo),
            }}
          >
            {b.minutos}
          </div>
        ))}
        {livres > 0 && (
          <div
            title={`Tempo livre — ${livres} min`}
            style={{
              width: `${(livres * 100) / totalBase}%`,
              background:
                "repeating-linear-gradient(45deg, var(--muted), var(--muted) 6px, var(--border) 6px, var(--border) 12px)",
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {tiposDistintos.map((tipo) => (
          <span key={tipo} className="inline-flex items-center gap-1.5 text-xs">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ background: blocoCor(tipo) }}
            />
            {TIPO_BLOCO_LABEL[tipo]}
          </span>
        ))}
        <span
          className="ml-auto text-xs font-medium"
          style={{ color: resumo.cor }}
        >
          {resumo.texto}
        </span>
      </div>
    </div>
  );
}
