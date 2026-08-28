import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, FileDown, Pencil, PlayCircle, Clock } from "lucide-react";
import { usePolos } from "@/features/polos/polosApi";
import { useAtividades } from "@/features/atividades/atividadesApi";
import { usePlano } from "@/features/planos/planosApi";
import { AulaTimeline } from "@/features/planos/AulaTimeline";
import { blocoCor } from "@/features/planos/blocoCores";
import { exportarPlanoPdf } from "@/features/planos/planoImpressao";
import { dataBR } from "@/lib/format";
import { urlSegura } from "@/lib/utils";
import {
  STATUS_PLANO_LABEL,
  TIPO_BLOCO_LABEL,
  type Atividade,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_BADGE: Record<number, "warning" | "secondary" | "success"> = {
  0: "warning",
  1: "secondary",
  2: "success",
};

// Visualização somente leitura de um plano de aula: cabeçalho, timeline dos
// blocos e o detalhe de cada bloco com suas atividades. Sem edição.
export function PlanoViewPage() {
  const { id } = useParams();
  const planoId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: plano, isLoading, isError } = usePlano(planoId);
  const { data: polos } = usePolos();
  const { data: atividades } = useAtividades();

  const nomePolo = useMemo(
    () => (polos ?? []).find((p) => p.id === plano?.poloId)?.nome ?? "-",
    [polos, plano],
  );
  const atividadePorId = useMemo(
    () => new Map((atividades ?? []).map((a) => [a.id, a])),
    [atividades],
  );

  const voltar = () =>
    location.key !== "default" ? navigate(-1) : navigate("/planos-de-aula");

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (isError || !plano) {
    return (
      <div className="space-y-4">
        <Voltar onClick={voltar} />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Plano de aula não encontrado.
          </CardContent>
        </Card>
      </div>
    );
  }

  const blocos = [...plano.blocos].sort((a, b) => a.ordem - b.ordem);
  const somaBlocos = blocos.reduce((s, b) => s + b.duracaoMinutos, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Voltar onClick={voltar} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const ok = exportarPlanoPdf(plano, nomePolo, atividadePorId);
              if (!ok) toast.error("Permita pop-ups para exportar o PDF.");
            }}
          >
            <FileDown className="size-4" /> Exportar PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/planos-de-aula/editor/${plano.id}`)}
          >
            <Pencil className="size-4" /> Editar
          </Button>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{plano.titulo}</h1>
          <Badge variant={STATUS_BADGE[plano.status]}>
            {STATUS_PLANO_LABEL[plano.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="tabular-nums">{dataBR(plano.dataPrevista)}</span>
          <Badge variant="outline">Turma {plano.turma}</Badge>
          <span>{nomePolo}</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="size-3.5" />
            {somaBlocos} / {plano.duracaoTotalMinutos} min
          </span>
        </div>
        {plano.objetivo && (
          <p className="max-w-3xl pt-1 text-sm text-muted-foreground">
            {plano.objetivo}
          </p>
        )}
      </div>

      {/* Timeline */}
      {blocos.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <AulaTimeline
              blocos={blocos.map((b) => ({
                tipo: b.tipo,
                nome: b.nome,
                minutos: b.duracaoMinutos,
              }))}
              duracaoTotalMinutos={plano.duracaoTotalMinutos}
            />
          </CardContent>
        </Card>
      )}

      {/* Blocos */}
      {blocos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Este plano ainda não tem blocos.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocos.map((b, i) => (
            <Card key={b.id || i}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-sm"
                    style={{ background: blocoCor(b.tipo) }}
                  />
                  <span className="font-medium">
                    {i + 1}. {b.nome || TIPO_BLOCO_LABEL[b.tipo]}
                  </span>
                  <Badge variant="outline">{TIPO_BLOCO_LABEL[b.tipo]}</Badge>
                  <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                    {b.duracaoMinutos} min
                  </span>
                </div>

                {b.descricao && (
                  <p className="text-sm text-muted-foreground">{b.descricao}</p>
                )}

                {b.atividades.length > 0 && (
                  <div className="space-y-1.5 border-t border-border pt-3">
                    {b.atividades.map((ab) => (
                      <AtividadeLinha
                        key={ab.id}
                        atividade={atividadePorId.get(ab.atividadeId)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Voltar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Voltar
    </button>
  );
}

function AtividadeLinha({ atividade }: { atividade: Atividade | undefined }) {
  if (!atividade) {
    return (
      <p className="text-sm text-muted-foreground">
        Atividade não encontrada.
      </p>
    );
  }
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
      <div className="min-w-0">
        <span className="font-medium">{atividade.nome}</span>
        {atividade.descricao && (
          <span className="text-muted-foreground"> — {atividade.descricao}</span>
        )}
        {urlSegura(atividade.videoUrl) && (
          <a
            href={urlSegura(atividade.videoUrl)}
            target="_blank"
            rel="noreferrer"
            className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
          >
            <PlayCircle className="size-3.5" /> vídeo
          </a>
        )}
      </div>
    </div>
  );
}
