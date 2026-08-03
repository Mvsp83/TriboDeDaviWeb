import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useModelo, useSalvarModelo } from "@/features/modelos/modelosApi";
import { AulaTimeline } from "@/features/planos/AulaTimeline";
import { BlocoCard } from "@/features/planos/BlocoCard";
import {
  moverItem,
  tipoSugerido,
  corSoma,
} from "@/features/planos/blocosUtils";
import { useUnsavedChanges } from "@/lib/useUnsavedChanges";
import { ApiError } from "@/lib/api";
import { TIPO_BLOCO_LABEL, type BlocoDoModelo, type ModeloDeAula } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function novoModelo(): ModeloDeAula {
  return { id: 0, nome: "", descricao: "", duracaoTotalMinutos: 60, blocos: [] };
}

function novoBloco(count: number): BlocoDoModelo {
  const tipo = tipoSugerido(count);
  return {
    id: 0,
    modeloDeAulaId: 0,
    ordem: count + 1,
    nome: TIPO_BLOCO_LABEL[tipo],
    tipo,
    duracaoMinutos: 15,
    descricao: "",
  };
}

export function ModeloEditorPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const navigate = useNavigate();

  const { data, isLoading, isError } = useModelo(id);
  const salvar = useSalvarModelo();

  const [modelo, setModelo] = useState<ModeloDeAula | null>(
    id ? null : novoModelo(),
  );
  const [snapshot, setSnapshot] = useState<string>("");

  useEffect(() => {
    if (data) {
      const ordenado = {
        ...data,
        blocos: [...data.blocos].sort((a, b) => a.ordem - b.ordem),
      };
      setModelo(ordenado);
      setSnapshot(JSON.stringify(ordenado));
    }
  }, [data]);

  useEffect(() => {
    if (!id && modelo && !snapshot) setSnapshot(JSON.stringify(modelo));
  }, [id, modelo, snapshot]);

  const dirty = modelo != null && JSON.stringify(modelo) !== snapshot;
  useUnsavedChanges(dirty);

  const planejado = useMemo(
    () => modelo?.blocos.reduce((s, b) => s + b.duracaoMinutos, 0) ?? 0,
    [modelo],
  );

  function patch(p: Partial<ModeloDeAula>) {
    setModelo((m) => (m ? { ...m, ...p } : m));
  }
  function patchBloco(i: number, p: Partial<BlocoDoModelo>) {
    setModelo((m) =>
      m
        ? { ...m, blocos: m.blocos.map((b, j) => (j === i ? { ...b, ...p } : b)) }
        : m,
    );
  }

  function voltar() {
    if (dirty && !window.confirm("Há alterações não salvas. Deseja sair sem salvar?"))
      return;
    navigate("/modelos-de-aula");
  }

  async function onSalvar() {
    if (!modelo) return;
    if (!modelo.nome.trim()) {
      toast.warning("Informe o nome do modelo.");
      return;
    }
    if (planejado > modelo.duracaoTotalMinutos) {
      toast.warning("A soma dos blocos ultrapassa a duração total do modelo.");
      return;
    }

    const payload: ModeloDeAula = {
      ...modelo,
      blocos: modelo.blocos.map((b, i) => ({ ...b, ordem: i + 1 })),
    };

    try {
      await salvar.mutateAsync(payload);
      setSnapshot(JSON.stringify(payload));
      toast.success("Modelo salvo com sucesso!");
      navigate("/modelos-de-aula");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao salvar o modelo.",
      );
    }
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          Modelo não encontrado.
        </CardContent>
      </Card>
    );
  }

  if (!modelo || (id && isLoading)) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={voltar} aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="flex-1 text-lg font-semibold">
          {modelo.id === 0 ? "Novo modelo de aula" : "Editar modelo de aula"}
        </h2>
        <Badge variant={corSoma(planejado, modelo.duracaoTotalMinutos)}>
          {planejado} / {modelo.duracaoTotalMinutos} min
        </Badge>
        <Button onClick={onSalvar} disabled={salvar.isPending}>
          {salvar.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <Label className="mb-1.5">Nome do modelo</Label>
            <Input
              placeholder="ex: Aula padrão 65 min"
              value={modelo.nome}
              onChange={(e) => patch({ nome: e.target.value })}
            />
          </div>
          <div className="sm:col-span-5">
            <Label className="mb-1.5">Descrição</Label>
            <Input
              value={modelo.descricao ?? ""}
              onChange={(e) => patch({ descricao: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Duração (min)</Label>
            <Input
              type="number"
              min={1}
              max={300}
              value={modelo.duracaoTotalMinutos}
              onChange={(e) =>
                patch({
                  duracaoTotalMinutos: Math.max(1, Number(e.target.value) || 0),
                })
              }
            />
          </div>
          {modelo.blocos.length > 0 && (
            <div className="sm:col-span-12">
              <AulaTimeline
                blocos={modelo.blocos.map((b) => ({
                  tipo: b.tipo,
                  nome: b.nome,
                  minutos: b.duracaoMinutos,
                }))}
                duracaoTotalMinutos={modelo.duracaoTotalMinutos}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Blocos do modelo</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            patch({ blocos: [...modelo.blocos, novoBloco(modelo.blocos.length)] })
          }
        >
          <Plus className="size-4" />
          Adicionar bloco
        </Button>
      </div>

      {modelo.blocos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum bloco ainda. Monte a estrutura padrão: Aquecimento, Posições,
            Lutas, Dinâmicas, Mensagem Final...
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {modelo.blocos.map((bloco, i) => (
            <BlocoCard
              key={i}
              bloco={bloco}
              onChange={(p) => patchBloco(i, p)}
              onMoveUp={() => patch({ blocos: moverItem(modelo.blocos, i, -1) })}
              onMoveDown={() => patch({ blocos: moverItem(modelo.blocos, i, 1) })}
              onRemove={() =>
                patch({ blocos: modelo.blocos.filter((_, j) => j !== i) })
              }
              podeSubir={i > 0}
              podeDescer={i < modelo.blocos.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
