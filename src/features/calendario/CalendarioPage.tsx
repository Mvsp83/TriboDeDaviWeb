import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Copy,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Bell,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { usePolos } from "@/features/polos/polosApi";
import {
  useEventosCalendario,
  useAnosCalendario,
  useExcluirEvento,
  useCopiarAno,
  useProcessarAvisos,
} from "@/features/calendario/calendarioApi";
import { EventoFormDialog } from "@/features/calendario/EventoFormDialog";
import {
  TIPO_EVENTO_LABEL,
  TIPOS_EVENTO,
  corTipoEvento,
} from "@/features/calendario/tipos";
import { dataCurtaBR } from "@/lib/format";
import { ApiError } from "@/lib/api";
import type { EventoCalendario } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function CalendarioPage() {
  const { sessao } = useAuth();
  const podeGerenciar =
    (sessao?.isAdministrador ?? false) || sessao?.role === "Supervisor";

  const anoCorrente = new Date().getFullYear();
  const [ano, setAno] = useState(anoCorrente);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroPolo, setFiltroPolo] = useState<string>("todos");

  const { data: eventos, isLoading } = useEventosCalendario(ano);
  const { data: anosComEventos } = useAnosCalendario();
  const { data: polos } = usePolos();
  const excluir = useExcluirEvento();
  const copiar = useCopiarAno();
  const processarAvisos = useProcessarAvisos();

  async function dispararAvisos() {
    try {
      const r = await processarAvisos.mutateAsync();
      if (r.erros.length > 0) {
        toast.error(
          `${r.enviados} enviado(s). Erros: ${r.erros.slice(0, 3).join(" · ")}`,
          { duration: 10000 },
        );
      } else if (r.enviados > 0) {
        toast.success(`${r.enviados} aviso(s) enviado(s) por email.`);
      } else {
        toast.info("Nenhum aviso pendente para enviar agora.");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao processar avisos.");
    }
  }

  const [dialogEvento, setDialogEvento] = useState(false);
  const [emEdicao, setEmEdicao] = useState<EventoCalendario | null>(null);
  const [paraExcluir, setParaExcluir] = useState<EventoCalendario | null>(null);
  const [dialogCopiar, setDialogCopiar] = useState(false);
  const [anoDestino, setAnoDestino] = useState(anoCorrente + 1);

  const nomePorPolo = useMemo(
    () => new Map((polos ?? []).map((p) => [p.id, p.nome])),
    [polos],
  );

  // Anos disponíveis no seletor: os que têm eventos + o corrente e o seguinte.
  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>(anosComEventos ?? []);
    set.add(anoCorrente);
    set.add(anoCorrente + 1);
    set.add(ano);
    return [...set].sort((a, b) => a - b);
  }, [anosComEventos, anoCorrente, ano]);

  const filtrados = useMemo(() => {
    return (eventos ?? [])
      .filter((e) => filtroTipo === "todos" || e.tipo === Number(filtroTipo))
      .filter(
        (e) =>
          filtroPolo === "todos" ||
          (filtroPolo === "geral" ? e.poloId == null : e.poloId === Number(filtroPolo)),
      );
  }, [eventos, filtroTipo, filtroPolo]);

  // Agrupa por mês (usa o MM da string ISO, sem depender de fuso).
  const porMes = useMemo(() => {
    const grupos = new Map<number, EventoCalendario[]>();
    for (const e of filtrados) {
      const mes = Number(e.data.slice(5, 7)) - 1;
      const arr = grupos.get(mes) ?? [];
      arr.push(e);
      grupos.set(mes, arr);
    }
    for (const arr of grupos.values())
      arr.sort((a, b) => a.data.localeCompare(b.data));
    return [...grupos.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtrados]);

  function abrirNovo() {
    setEmEdicao(null);
    setDialogEvento(true);
  }
  function abrirEdicao(e: EventoCalendario) {
    setEmEdicao(e);
    setDialogEvento(true);
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Evento removido.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  async function confirmarCopia() {
    try {
      await copiar.mutateAsync({ origem: ano, destino: anoDestino });
      toast.success(`Calendário copiado para ${anoDestino}.`);
      setDialogCopiar(false);
      setAno(anoDestino);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao copiar o ano.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho: navegação de ano + ações */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAno((a) => a - 1)}
            aria-label="Ano anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAno((a) => a + 1)}
            aria-label="Próximo ano"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {podeGerenciar && (
          <div className="flex gap-2">
            {sessao?.isAdministrador && (
              <Button
                variant="outline"
                onClick={dispararAvisos}
                disabled={processarAvisos.isPending}
                title="Envia agora os avisos por email dos eventos com notificação pendente (para testar sem esperar o horário diário)."
              >
                {processarAvisos.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Bell className="size-4" />
                )}
                Processar avisos agora
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setAnoDestino(ano + 1);
                setDialogCopiar(true);
              }}
            >
              <Copy className="size-4" /> Copiar ano
            </Button>
            <Button onClick={abrirNovo}>
              <Plus className="size-4" /> Novo evento
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-52">
            <Label className="mb-1.5">Tipo</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {TIPOS_EVENTO.map((t) => (
                  <SelectItem key={t.valor} value={String(t.valor)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-52">
            <Label className="mb-1.5">Polo</Label>
            <Select value={filtroPolo} onValueChange={setFiltroPolo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="geral">Geral (todos os polos)</SelectItem>
                {(polos ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista por mês */}
      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && porMes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <CalendarDays className="size-8" />
            <p className="text-sm">
              Nenhum evento em {ano}.
              {podeGerenciar
                ? " Crie o primeiro ou copie de outro ano."
                : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        porMes.map(([mes, lista]) => (
          <div key={mes} className="space-y-2">
            <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {MESES[mes]}
            </h2>
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {lista.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 px-4 py-3"
                  >
                    <span
                      className="mt-1.5 size-3 shrink-0 rounded-sm"
                      style={{ background: corTipoEvento(e.tipo) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{e.titulo}</span>
                        <Badge variant="outline">
                          {TIPO_EVENTO_LABEL[e.tipo] ?? "Outro"}
                        </Badge>
                        {e.notificar && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-primary"
                            title="Aviso por email agendado"
                          >
                            <Bell className="size-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {dataCurtaBR(e.data)}
                          {e.dataFim ? ` – ${dataCurtaBR(e.dataFim)}` : ""}
                        </span>
                        <span>
                          {e.poloId == null
                            ? "Todos os polos"
                            : nomePorPolo.get(e.poloId) ?? "-"}
                        </span>
                      </div>
                      {e.descricao && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {e.descricao}
                        </p>
                      )}
                    </div>
                    {podeGerenciar && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirEdicao(e)}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setParaExcluir(e)}
                          aria-label="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}

      <EventoFormDialog
        aberto={dialogEvento}
        onOpenChange={setDialogEvento}
        evento={emEdicao}
        anoAtual={ano}
        polos={polos ?? []}
      />

      {/* Copiar ano */}
      <Dialog open={dialogCopiar} onOpenChange={setDialogCopiar}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Copiar calendário de {ano}</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="mb-1.5">Ano de destino</Label>
            <Input
              type="number"
              value={anoDestino}
              onChange={(e) => setAnoDestino(Number(e.target.value) || ano + 1)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Todos os eventos de {ano} serão recriados em {anoDestino} (mesmo
              mês e dia). O ano de destino precisa estar vazio.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCopiar(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCopia} disabled={copiar.isPending}>
              {copiar.isPending && <Loader2 className="size-4 animate-spin" />}
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(o) => !o && setParaExcluir(null)}
        titulo="Excluir evento"
        descricao={
          <>
            Excluir <strong>{paraExcluir?.titulo}</strong> do calendário?
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
