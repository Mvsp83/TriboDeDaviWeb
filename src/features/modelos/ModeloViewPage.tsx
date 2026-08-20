import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Clock } from "lucide-react";
import { useModelo } from "@/features/modelos/modelosApi";
import { AulaTimeline } from "@/features/planos/AulaTimeline";
import { blocoCor } from "@/features/planos/blocoCores";
import { TIPO_BLOCO_LABEL } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Visualização somente leitura de um modelo de aula: cabeçalho, timeline e o
// detalhe dos blocos. Modelos não têm atividades (só a estrutura de blocos).
export function ModeloViewPage() {
  const { id } = useParams();
  const modeloId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: modelo, isLoading, isError } = useModelo(modeloId);

  const voltar = () =>
    location.key !== "default" ? navigate(-1) : navigate("/modelos-de-aula");

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (isError || !modelo) {
    return (
      <div className="space-y-4">
        <Voltar onClick={voltar} />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Modelo de aula não encontrado.
          </CardContent>
        </Card>
      </div>
    );
  }

  const blocos = [...modelo.blocos].sort((a, b) => a.ordem - b.ordem);
  const somaBlocos = blocos.reduce((s, b) => s + b.duracaoMinutos, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Voltar onClick={voltar} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/modelos-de-aula/editor/${modelo.id}`)}
        >
          <Pencil className="size-4" /> Editar
        </Button>
      </div>

      {/* Cabeçalho */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{modelo.nome}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="size-3.5" />
            {somaBlocos} / {modelo.duracaoTotalMinutos} min
          </span>
          <span>
            {blocos.length} bloco{blocos.length === 1 ? "" : "s"}
          </span>
        </div>
        {modelo.descricao && (
          <p className="max-w-3xl pt-1 text-sm text-muted-foreground">
            {modelo.descricao}
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
              duracaoTotalMinutos={modelo.duracaoTotalMinutos}
            />
          </CardContent>
        </Card>
      )}

      {/* Blocos */}
      {blocos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Este modelo ainda não tem blocos.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {blocos.map((b, i) => (
            <Card key={b.id || i}>
              <CardContent className="space-y-2 p-4">
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
