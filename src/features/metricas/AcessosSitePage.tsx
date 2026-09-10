import { useState } from "react";
import {
  Eye,
  MousePointerClick,
  ClipboardCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import {
  useMetricaResumo,
  type ItemContagem,
  type SerieDia,
} from "@/features/metricas/metricaApi";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PERIODOS = [
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
  { label: "90 dias", dias: 90 },
] as const;

const nf = new Intl.NumberFormat("pt-BR");

function Cartao({
  icone: Icone,
  rotulo,
  valor,
  carregando,
}: {
  icone: LucideIcon;
  rotulo: string;
  valor: number;
  carregando: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icone className="size-5" />
        </span>
        <div className="min-w-0">
          {carregando ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-bold tabular-nums leading-none">
              {nf.format(valor)}
            </div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">{rotulo}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Gráfico de linha/área em SVG puro (sem lib). viewBox fixo + preserveAspectRatio
// "none" para esticar na largura do card.
function GraficoVisitas({ serie }: { serie: SerieDia[] }) {
  const L = 600;
  const A = 160;
  const pad = 8;
  const max = Math.max(1, ...serie.map((s) => s.valor));
  const n = serie.length;
  const x = (i: number) =>
    n <= 1 ? L / 2 : pad + (i * (L - pad * 2)) / (n - 1);
  const y = (v: number) => A - pad - (v * (A - pad * 2)) / max;

  const pontos = serie.map((s, i) => `${x(i)},${y(s.valor)}`).join(" ");
  const area = `${pad},${A - pad} ${pontos} ${L - pad},${A - pad}`;

  const fmtData = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1,
    ).padStart(2, "0")}`;
  };

  return (
    <div>
      <svg
        viewBox={`0 0 ${L} ${A}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label="Visitas por dia"
      >
        <polygon points={area} fill="var(--color-primary)" opacity="0.12" />
        <polyline
          points={pontos}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {n > 0 && (
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{fmtData(serie[0].data)}</span>
          {n > 2 && <span>{fmtData(serie[Math.floor(n / 2)].data)}</span>}
          <span>{fmtData(serie[n - 1].data)}</span>
        </div>
      )}
    </div>
  );
}

function BarrasTop({ itens }: { itens: ItemContagem[] }) {
  if (itens.length === 0)
    return (
      <p className="text-sm text-muted-foreground">Sem dados no período.</p>
    );
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="space-y-2">
      {itens.map((i) => (
        <div key={i.rotulo} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm" title={i.rotulo}>
            {i.rotulo}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(i.valor / max) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
            {nf.format(i.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AcessosSitePage() {
  useDocumentTitle("Acessos ao site");
  const [dias, setDias] = useState<number>(30);
  const { data, isLoading } = useMetricaResumo(dias);

  return (
    <div className="space-y-4">
      {/* Período */}
      <div className="flex flex-wrap gap-1.5">
        {PERIODOS.map((p) => (
          <button
            key={p.dias}
            onClick={() => setDias(p.dias)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              dias === p.dias
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cartões */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cartao icone={Eye} rotulo="Visitas" valor={data?.visitas ?? 0} carregando={isLoading} />
        <Cartao icone={MousePointerClick} rotulo="Cliques em Doar" valor={data?.doarCliques ?? 0} carregando={isLoading} />
        <Cartao icone={ClipboardCheck} rotulo="Inscrições concluídas" valor={data?.inscricoesConcluidas ?? 0} carregando={isLoading} />
        <Cartao icone={UserCheck} rotulo="Acessos do responsável" valor={data?.acessosResponsavel ?? 0} carregando={isLoading} />
      </div>

      {/* Visitas por dia */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">Visitas por dia</p>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <GraficoVisitas serie={data?.visitasPorDia ?? []} />
          )}
        </CardContent>
      </Card>

      {/* Páginas mais vistas */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">Páginas mais vistas</p>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <BarrasTop itens={data?.topPaginas ?? []} />
          )}
        </CardContent>
      </Card>

      {/* Perguntas ao Davizinho (só se houver) */}
      {!isLoading && (data?.topDavizinho?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">
              Perguntas mais feitas ao Davizinho
            </p>
            <BarrasTop itens={data!.topDavizinho} />
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Os números contam visitantes do site (a equipe logada não entra na
        contagem). Dados agregados por dia, sem informações pessoais.
      </p>
    </div>
  );
}
