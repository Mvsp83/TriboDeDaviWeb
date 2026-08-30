import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { usePolos, useExcluirPolo } from "@/features/polos/polosApi";
import { PoloFormDialog } from "@/features/polos/PoloFormDialog";
import { ApiError } from "@/lib/api";
import type { HorarioTurma, Polo } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const DIA_CURTO: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

// Agrupa os horários por turma, para exibir "Turma 1: Seg 18:00–19:30 · …".
function agruparPorTurma(horarios: HorarioTurma[]): Map<number, HorarioTurma[]> {
  const mapa = new Map<number, HorarioTurma[]>();
  for (const h of [...horarios].sort((a, b) => a.diaSemana - b.diaSemana)) {
    const lista = mapa.get(h.turma) ?? [];
    lista.push(h);
    mapa.set(h.turma, lista);
  }
  return new Map([...mapa.entries()].sort(([a], [b]) => a - b));
}

export function PolosPage() {
  const { data: polos, isLoading, isError } = usePolos();
  const excluir = useExcluirPolo();

  const [filtro, setFiltro] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [poloEdicao, setPoloEdicao] = useState<Polo | null>(null);
  const [poloExcluir, setPoloExcluir] = useState<Polo | null>(null);

  const filtrados = useMemo(() => {
    const q = filtro.toLocaleLowerCase("pt-BR");
    return (polos ?? []).filter((p) =>
      p.nome.toLocaleLowerCase("pt-BR").includes(q),
    );
  }, [polos, filtro]);

  async function confirmarExclusao() {
    if (!poloExcluir) return;
    try {
      await excluir.mutateAsync(poloExcluir.id);
      toast.success("Polo excluído.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao excluir o polo.",
      );
    } finally {
      setPoloExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${filtrados.length} polo(s)`}
        </p>
        <Button
          onClick={() => {
            setPoloEdicao(null);
            setDialogAberto(true);
          }}
        >
          <Plus className="size-4" />
          Novo polo
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Erro ao carregar os polos. Tente novamente.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && filtrados.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum polo encontrado.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((polo) => (
          <Card key={polo.id} className="flex flex-col">
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <MapPin className="size-5" />
                </div>
                <h3 className="flex-1 font-semibold leading-tight">
                  {polo.nome}
                </h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPoloEdicao(polo);
                      setDialogAberto(true);
                    }}
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPoloExcluir(polo)}
                    aria-label="Excluir"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                {(polo.endereco || polo.bairro) && (
                  <p>
                    {[polo.endereco, polo.bairro].filter(Boolean).join(", ")}
                  </p>
                )}
                {polo.cidade && <p>{polo.cidade}</p>}
                {polo.informacoes && (
                  <p className="pt-1 text-foreground/80">{polo.informacoes}</p>
                )}
                {polo.horarios && polo.horarios.length > 0 && (
                  <div className="space-y-0.5 border-t border-border pt-2 text-xs">
                    {[...agruparPorTurma(polo.horarios).entries()].map(
                      ([turma, hs]) => (
                        <p key={turma}>
                          <span className="font-medium text-foreground">
                            Turma {turma}:
                          </span>{" "}
                          {hs
                            .map(
                              (h) =>
                                `${DIA_CURTO[h.diaSemana]} ${h.horaInicio}${
                                  h.horaFim ? `–${h.horaFim}` : ""
                                }`,
                            )
                            .join(" · ")}
                        </p>
                      ),
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PoloFormDialog
        aberto={dialogAberto}
        onOpenChange={setDialogAberto}
        polo={poloEdicao}
      />

      <ConfirmDialog
        aberto={poloExcluir !== null}
        onOpenChange={(o) => !o && setPoloExcluir(null)}
        titulo="Confirmar exclusão"
        descricao={
          <>
            Deseja excluir o polo <strong>{poloExcluir?.nome}</strong>? Esta
            ação não pode ser desfeita.
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
