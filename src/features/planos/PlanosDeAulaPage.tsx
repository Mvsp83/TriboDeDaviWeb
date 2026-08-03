import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ClipboardPaste,
  Search,
  Pencil,
  Copy,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { usePolos } from "@/features/polos/polosApi";
import { useModelos } from "@/features/modelos/modelosApi";
import {
  usePlanos,
  useExcluirPlano,
  useClonarPlano,
  useCriarDeModelo,
} from "@/features/planos/planosApi";
import { dataBR, paraInputDate } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { STATUS_PLANO_LABEL, type PlanoDeAula } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GRUPOS = ["Hoje", "Esta semana", "Próximas", "Anteriores"] as const;

function grupoDoPlano(dataPrevista: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 7);

  const data = new Date(dataPrevista);
  data.setHours(0, 0, 0, 0);

  if (data.getTime() === hoje.getTime()) return 0;
  if (data >= inicioSemana && data < fimSemana) return 1;
  return data >= fimSemana ? 2 : 3;
}

const STATUS_BADGE: Record<number, "warning" | "secondary" | "success"> = {
  0: "warning",
  1: "secondary",
  2: "success",
};

export function PlanosDeAulaPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const navigate = useNavigate();

  const { data: planos, isLoading, isError } = usePlanos(admin);
  const { data: polos } = usePolos();
  const { data: modelos } = useModelos();
  const excluir = useExcluirPlano();
  const clonar = useClonarPlano();
  const criarDeModelo = useCriarDeModelo();

  const [filtroTitulo, setFiltroTitulo] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<number | null>(null);

  const [paraExcluir, setParaExcluir] = useState<PlanoDeAula | null>(null);
  const [paraClonar, setParaClonar] = useState<PlanoDeAula | null>(null);
  const [novaData, setNovaData] = useState(paraInputDate(new Date().toISOString()));
  const [dialogModelo, setDialogModelo] = useState(false);

  // Estado do diálogo "novo a partir de modelo"
  const [modeloId, setModeloId] = useState<number | null>(null);
  const [modeloData, setModeloData] = useState(paraInputDate(new Date().toISOString()));
  const [modeloTurma, setModeloTurma] = useState(1);
  const [modeloPolo, setModeloPolo] = useState<number>(sessao?.poloId ?? 0);

  const nomePorPolo = useMemo(() => {
    const m = new Map<number, string>();
    polos?.forEach((p) => m.set(p.id, p.nome));
    return m;
  }, [polos]);

  const grupos = useMemo(() => {
    const norm = (s: string) => s.toLocaleLowerCase("pt-BR");
    const filtrados = (planos ?? [])
      .filter((p) => !filtroTitulo || norm(p.titulo).includes(norm(filtroTitulo)))
      .filter((p) => !filtroTurma || String(p.turma) === filtroTurma)
      .filter((p) => filtroStatus === null || p.status === filtroStatus);

    return GRUPOS.map((nome, rank) => ({
      nome,
      rank,
      planos: filtrados
        .filter((p) => grupoDoPlano(p.dataPrevista) === rank)
        .sort((a, b) => {
          const da = +new Date(a.dataPrevista);
          const db = +new Date(b.dataPrevista);
          return rank === 3 ? db - da : da - db;
        }),
    })).filter((g) => g.planos.length > 0);
  }, [planos, filtroTitulo, filtroTurma, filtroStatus]);

  const totalFiltrado = grupos.reduce((s, g) => s + g.planos.length, 0);

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Plano excluído.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir o plano.");
    } finally {
      setParaExcluir(null);
    }
  }

  async function confirmarClone() {
    if (!paraClonar) return;
    try {
      const clone = await clonar.mutateAsync({
        id: paraClonar.id,
        novaDataPrevista: novaData,
      });
      toast.success("Plano clonado!");
      setParaClonar(null);
      if (clone?.id) navigate(`/planos-de-aula/editor/${clone.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao clonar o plano.");
    }
  }

  async function confirmarCriarDeModelo() {
    if (!modeloId) return;
    try {
      const plano = await criarDeModelo.mutateAsync({
        modeloId,
        dadosBase: {
          poloId: admin ? modeloPolo : (sessao?.poloId ?? 0),
          turma: modeloTurma,
          dataPrevista: modeloData,
        },
      });
      toast.success("Plano criado a partir do modelo!");
      setDialogModelo(false);
      if (plano?.id) navigate(`/planos-de-aula/editor/${plano.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar o plano.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${totalFiltrado} plano(s)`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setModeloId(null);
              setModeloData(paraInputDate(new Date().toISOString()));
              setModeloTurma(1);
              setModeloPolo(sessao?.poloId ?? polos?.[0]?.id ?? 0);
              setDialogModelo(true);
            }}
          >
            <ClipboardPaste className="size-4" />
            Novo a partir de modelo
          </Button>
          <Button onClick={() => navigate("/planos-de-aula/editor")}>
            <Plus className="size-4" />
            Novo plano
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Título"
              value={filtroTitulo}
              onChange={(e) => setFiltroTitulo(e.target.value)}
              className="pl-9"
            />
          </div>
          <Input
            placeholder="Turma"
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
            className="sm:w-28"
          />
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(STATUS_PLANO_LABEL).map(([valor, label]) => {
              const v = Number(valor);
              const ativo = filtroStatus === v;
              return (
                <button
                  key={valor}
                  onClick={() => setFiltroStatus(ativo ? null : v)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    ativo
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Polo</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-destructive">
                    Erro ao carregar os planos. Tente novamente.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && totalFiltrado === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Nenhum plano de aula encontrado. Crie o primeiro!
                  </TableCell>
                </TableRow>
              )}

              {grupos.map((g) => (
                <Fragment key={g.nome}>
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={7}
                      className="bg-secondary/40 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {g.nome}{" "}
                      <span className="font-normal opacity-70">
                        ({g.planos.length})
                      </span>
                    </TableCell>
                  </TableRow>
                  {g.planos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="tabular-nums">
                        {dataBR(p.dataPrevista)}
                      </TableCell>
                      <TableCell className="font-medium">{p.titulo}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {nomePorPolo.get(p.poloId) ?? "-"}
                      </TableCell>
                      <TableCell>Turma {p.turma}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {p.blocos.reduce((s, b) => s + b.duracaoMinutos, 0)} /{" "}
                        {p.duracaoTotalMinutos} min
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[p.status]}>
                          {STATUS_PLANO_LABEL[p.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/planos-de-aula/editor/${p.id}`)}
                            aria-label="Editar"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setParaClonar(p);
                              setNovaData(paraInputDate(new Date().toISOString()));
                            }}
                            aria-label="Clonar"
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setParaExcluir(p)}
                            aria-label="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Novo a partir de modelo */}
      <Dialog open={dialogModelo} onOpenChange={setDialogModelo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo plano a partir de modelo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Modelo</Label>
              <Select
                value={modeloId ? String(modeloId) : ""}
                onValueChange={(v) => setModeloId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {(modelos ?? []).map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.nome} ({m.duracaoTotalMinutos} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5">Data da aula</Label>
                <Input
                  type="date"
                  value={modeloData}
                  onChange={(e) => setModeloData(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5">Turma</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={modeloTurma}
                  onChange={(e) => setModeloTurma(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>
            {admin && (
              <div>
                <Label className="mb-1.5">Polo</Label>
                <Select
                  value={modeloPolo ? String(modeloPolo) : ""}
                  onValueChange={(v) => setModeloPolo(Number(v))}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogModelo(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarCriarDeModelo}
              disabled={!modeloId || !modeloData || criarDeModelo.isPending}
            >
              {criarDeModelo.isPending && <Loader2 className="size-4 animate-spin" />}
              Criar plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clonar */}
      <Dialog open={paraClonar !== null} onOpenChange={(o) => !o && setParaClonar(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clonar "{paraClonar?.titulo}"</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="mb-1.5">Nova data da aula</Label>
            <Input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParaClonar(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmarClone} disabled={!novaData || clonar.isPending}>
              {clonar.isPending && <Loader2 className="size-4 animate-spin" />}
              Clonar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(o) => !o && setParaExcluir(null)}
        titulo="Excluir plano"
        descricao={
          <>
            Tem certeza que deseja excluir o plano{" "}
            <strong>{paraExcluir?.titulo}</strong> de{" "}
            {paraExcluir ? dataBR(paraExcluir.dataPrevista) : ""}?
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
