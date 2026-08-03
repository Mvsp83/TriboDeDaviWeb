import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Loader2, PlayCircle, X, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { usePolos } from "@/features/polos/polosApi";
import { useAtividades } from "@/features/atividades/atividadesApi";
import { useHistoricoTurma } from "@/features/atividades/historicoApi";
import { usePlano, useCriarPlano, useAtualizarPlano } from "@/features/planos/planosApi";
import { AulaTimeline } from "@/features/planos/AulaTimeline";
import { BlocoCard } from "@/features/planos/BlocoCard";
import { AtividadePicker } from "@/features/planos/AtividadePicker";
import {
  moverItem,
  tipoSugerido,
  corSoma,
  labelDescricaoBloco,
} from "@/features/planos/blocosUtils";
import { VideoDialog } from "@/features/atividades/VideoDialog";
import { VideoSearchDialog } from "@/features/atividades/VideoSearchDialog";
import { useUnsavedChanges } from "@/lib/useUnsavedChanges";
import { paraInputDate } from "@/lib/format";
import { extrairVideoId } from "@/lib/youtube";
import { ApiError } from "@/lib/api";
import {
  TipoBloco,
  TIPO_BLOCO_LABEL,
  STATUS_PLANO_LABEL,
  type Atividade,
  type BlocoDoPlano,
  type PlanoDeAula,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function novoPlano(poloId: number): PlanoDeAula {
  return {
    id: 0,
    poloId,
    turma: 1,
    titulo: "",
    objetivo: "",
    dataPrevista: paraInputDate(new Date().toISOString()),
    duracaoTotalMinutos: 60,
    status: 0,
    blocos: [],
  };
}

function novoBloco(count: number): BlocoDoPlano {
  const tipo = tipoSugerido(count);
  return {
    id: 0,
    planoDeAulaId: 0,
    ordem: count + 1,
    nome: TIPO_BLOCO_LABEL[tipo],
    tipo,
    duracaoMinutos: 15,
    descricao: "",
    atividades: [],
  };
}

export function PlanoEditorPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const navigate = useNavigate();
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;

  const { data, isLoading, isError } = usePlano(id);
  const { data: polos } = usePolos();
  const { data: atividades } = useAtividades();
  const criar = useCriarPlano();
  const atualizar = useAtualizarPlano();

  const [plano, setPlano] = useState<PlanoDeAula | null>(
    id ? null : novoPlano(sessao?.poloId ?? 0),
  );
  const [snapshot, setSnapshot] = useState<string>("");

  const { data: historico } = useHistoricoTurma(plano?.poloId, plano?.turma ?? 1);
  const historicoMap = useMemo(
    () => new Map((historico ?? []).map((h) => [h.atividadeId, h])),
    [historico],
  );
  const atividadePorId = useMemo(
    () => new Map((atividades ?? []).map((a) => [a.id, a])),
    [atividades],
  );

  const [videoAtividade, setVideoAtividade] = useState<Atividade | null>(null);
  const [buscaBloco, setBuscaBloco] = useState<number | null>(null);

  useEffect(() => {
    if (data) {
      const ordenado = {
        ...data,
        dataPrevista: paraInputDate(data.dataPrevista),
        blocos: [...data.blocos].sort((a, b) => a.ordem - b.ordem),
      };
      setPlano(ordenado);
      setSnapshot(JSON.stringify(ordenado));
    }
  }, [data]);

  useEffect(() => {
    if (!id && plano && !snapshot) setSnapshot(JSON.stringify(plano));
  }, [id, plano, snapshot]);

  const dirty = plano != null && JSON.stringify(plano) !== snapshot;
  useUnsavedChanges(dirty);

  const planejado = useMemo(
    () => plano?.blocos.reduce((s, b) => s + b.duracaoMinutos, 0) ?? 0,
    [plano],
  );

  function patch(p: Partial<PlanoDeAula>) {
    setPlano((m) => (m ? { ...m, ...p } : m));
  }
  function patchBloco(i: number, p: Partial<BlocoDoPlano>) {
    setPlano((m) =>
      m
        ? { ...m, blocos: m.blocos.map((b, j) => (j === i ? { ...b, ...p } : b)) }
        : m,
    );
  }

  function voltar() {
    if (dirty && !window.confirm("Há alterações não salvas. Deseja sair sem salvar?"))
      return;
    navigate("/planos-de-aula");
  }

  async function onSalvar() {
    if (!plano) return;
    if (!plano.titulo.trim()) {
      toast.warning("Informe o título do plano.");
      return;
    }
    if (planejado > plano.duracaoTotalMinutos) {
      toast.warning("A soma dos blocos ultrapassa a duração total da aula.");
      return;
    }

    const payload: PlanoDeAula = {
      ...plano,
      blocos: plano.blocos.map((b, i) => ({ ...b, ordem: i + 1 })),
    };

    try {
      if (plano.id === 0) await criar.mutateAsync(payload);
      else await atualizar.mutateAsync(payload);
      setSnapshot(JSON.stringify(plano));
      toast.success("Plano salvo com sucesso!");
      navigate("/planos-de-aula");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao salvar o plano.",
      );
    }
  }

  const salvando = criar.isPending || atualizar.isPending;

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          Plano não encontrado.
        </CardContent>
      </Card>
    );
  }

  if (!plano || (id && isLoading)) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={voltar} aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="flex-1 text-lg font-semibold">
          {plano.id === 0 ? "Novo plano de aula" : "Editar plano de aula"}
        </h2>
        <Badge variant={corSoma(planejado, plano.duracaoTotalMinutos)}>
          {planejado} / {plano.duracaoTotalMinutos} min
        </Badge>
        <Button onClick={onSalvar} disabled={salvando}>
          {salvando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-12">
          <div className="sm:col-span-6">
            <Label className="mb-1.5">Título</Label>
            <Input
              value={plano.titulo}
              onChange={(e) => patch({ titulo: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Data da aula</Label>
            <Input
              type="date"
              value={plano.dataPrevista}
              onChange={(e) => patch({ dataPrevista: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Turma</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={plano.turma}
              onChange={(e) => patch({ turma: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Duração (min)</Label>
            <Input
              type="number"
              min={1}
              max={300}
              value={plano.duracaoTotalMinutos}
              onChange={(e) =>
                patch({ duracaoTotalMinutos: Math.max(1, Number(e.target.value) || 0) })
              }
            />
          </div>

          {admin && (
            <div className="sm:col-span-4">
              <Label className="mb-1.5">Polo</Label>
              <Select
                value={plano.poloId ? String(plano.poloId) : ""}
                onValueChange={(v) => patch({ poloId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(polos ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className={admin ? "sm:col-span-3" : "sm:col-span-3"}>
            <Label className="mb-1.5">Status</Label>
            <Select
              value={String(plano.status)}
              onValueChange={(v) => patch({ status: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_PLANO_LABEL).map(([valor, label]) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={admin ? "sm:col-span-5" : "sm:col-span-9"}>
            <Label className="mb-1.5">Objetivo da aula</Label>
            <Input
              value={plano.objetivo ?? ""}
              onChange={(e) => patch({ objetivo: e.target.value })}
            />
          </div>

          {plano.blocos.length > 0 && (
            <div className="sm:col-span-12">
              <AulaTimeline
                blocos={plano.blocos.map((b) => ({
                  tipo: b.tipo,
                  nome: b.nome,
                  minutos: b.duracaoMinutos,
                }))}
                duracaoTotalMinutos={plano.duracaoTotalMinutos}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Blocos da aula</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            patch({ blocos: [...plano.blocos, novoBloco(plano.blocos.length)] })
          }
        >
          <Plus className="size-4" />
          Adicionar bloco
        </Button>
      </div>

      {plano.blocos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum bloco ainda. Adicione as partes da aula: Aquecimento, Posições,
            Lutas, Dinâmicas, Mensagem Final...
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {plano.blocos.map((bloco, i) => (
            <BlocoCard
              key={i}
              bloco={bloco}
              onChange={(p) => patchBloco(i, p)}
              onMoveUp={() => patch({ blocos: moverItem(plano.blocos, i, -1) })}
              onMoveDown={() => patch({ blocos: moverItem(plano.blocos, i, 1) })}
              onRemove={() =>
                patch({ blocos: plano.blocos.filter((_, j) => j !== i) })
              }
              podeSubir={i > 0}
              podeDescer={i < plano.blocos.length - 1}
              labelDescricao={labelDescricaoBloco(bloco.tipo)}
            >
              <div className="sm:col-span-12">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <AtividadePicker
                      atividades={atividades ?? []}
                      tipo={bloco.tipo}
                      selecionadasIds={bloco.atividades.map((a) => a.atividadeId)}
                      historico={historicoMap}
                      onAdd={(a) =>
                        patchBloco(i, {
                          atividades: [
                            ...bloco.atividades,
                            { id: 0, blocoDoPlanoId: 0, atividadeId: a.id },
                          ],
                        })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setBuscaBloco(i)}
                    title="Pesquisar vídeo por palavras-chave"
                  >
                    <Search className="size-4" />
                  </Button>
                </div>

                {bloco.atividades.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {bloco.atividades.map((sel, k) => {
                      const info = atividadePorId.get(sel.atividadeId);
                      const nome = info?.nome ?? `Atividade #${sel.atividadeId}`;
                      const temVideo = extrairVideoId(info?.videoUrl) != null;
                      return (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/50 py-0.5 pl-2 pr-1 text-xs"
                        >
                          {temVideo && info && (
                            <button
                              type="button"
                              onClick={() => setVideoAtividade(info)}
                              className="text-destructive hover:opacity-80"
                              title="Ver vídeo"
                            >
                              <PlayCircle className="size-3.5" />
                            </button>
                          )}
                          {nome}
                          <button
                            type="button"
                            onClick={() =>
                              patchBloco(i, {
                                atividades: bloco.atividades.filter(
                                  (_, x) => x !== k,
                                ),
                              })
                            }
                            className="rounded-sm text-muted-foreground hover:text-destructive"
                            aria-label="Remover atividade"
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </BlocoCard>
          ))}
        </div>
      )}

      <VideoDialog
        aberto={videoAtividade !== null}
        onOpenChange={(o) => !o && setVideoAtividade(null)}
        titulo={videoAtividade?.nome}
        videoUrl={videoAtividade?.videoUrl}
      />

      <VideoSearchDialog
        aberto={buscaBloco !== null}
        onOpenChange={(o) => !o && setBuscaBloco(null)}
        termoInicial={
          buscaBloco !== null
            ? `${plano.blocos[buscaBloco]?.nome ?? ""}${
                plano.blocos[buscaBloco]?.tipo === TipoBloco.Posicoes ||
                plano.blocos[buscaBloco]?.tipo === TipoBloco.Lutas
                  ? " jiu-jitsu"
                  : ""
              }`.trim()
            : ""
        }
      />
    </div>
  );
}
