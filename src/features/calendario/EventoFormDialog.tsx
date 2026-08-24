import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { useSalvarEvento } from "@/features/calendario/calendarioApi";
import { TIPOS_EVENTO } from "@/features/calendario/tipos";
import { ApiError } from "@/lib/api";
import { paraInputDate } from "@/lib/format";
import type { EventoCalendario, Polo } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const TODOS_POLOS = "todos";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  evento: EventoCalendario | null;
  anoAtual: number;
  polos: Polo[];
}

export function EventoFormDialog({
  aberto,
  onOpenChange,
  evento,
  anoAtual,
  polos,
}: Props) {
  const salvar = useSalvarEvento();
  const editando = evento !== null;

  const [data, setData] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("8");
  const [polo, setPolo] = useState<string>(TODOS_POLOS);
  const [descricao, setDescricao] = useState("");
  const [notificar, setNotificar] = useState(false);
  const [emails, setEmails] = useState("");
  const [diasAntecedencia, setDiasAntecedencia] = useState("0");

  // Recarrega o formulário sempre que abre (novo ou edição).
  useEffect(() => {
    if (!aberto) return;
    setData(evento ? paraInputDate(evento.data) : `${anoAtual}-01-01`);
    setDataFim(evento?.dataFim ? paraInputDate(evento.dataFim) : "");
    setTitulo(evento?.titulo ?? "");
    setTipo(String(evento?.tipo ?? 8));
    setPolo(evento?.poloId ? String(evento.poloId) : TODOS_POLOS);
    setDescricao(evento?.descricao ?? "");
    setNotificar(evento?.notificar ?? false);
    setEmails(evento?.emailsNotificacao ?? "");
    setDiasAntecedencia(String(evento?.diasAntecedencia ?? 0));
  }, [aberto, evento, anoAtual]);

  async function onSalvar() {
    if (!data) {
      toast.warning("Informe a data do evento.");
      return;
    }
    if (!titulo.trim()) {
      toast.warning("Informe o título do evento.");
      return;
    }
    try {
      await salvar.mutateAsync({
        id: evento?.id,
        data,
        dataFim: dataFim || null,
        titulo: titulo.trim(),
        tipo: Number(tipo),
        descricao: descricao.trim(),
        poloId: polo === TODOS_POLOS ? null : Number(polo),
        notificar,
        emailsNotificacao: notificar ? emails.trim() : "",
        diasAntecedencia: Number(diasAntecedencia) || 0,
      });
      toast.success(editando ? "Evento atualizado." : "Evento criado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível salvar o evento.",
      );
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar evento" : "Novo evento"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5">Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Início das aulas 2027"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5">Data fim (opcional)</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_EVENTO.map((t) => (
                    <SelectItem key={t.valor} value={String(t.valor)}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Polo</Label>
              <Select value={polo} onValueChange={setPolo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS_POLOS}>Todos os polos</SelectItem>
                  {polos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5">Descrição (opcional)</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>

          {/* Notificação por email */}
          <div className="space-y-3 rounded-md border border-border p-3">
            <label className="flex items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={notificar}
                onChange={(e) => setNotificar(e.target.checked)}
                className="size-4 accent-primary"
              />
              Enviar aviso por email
            </label>

            {notificar && (
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5">Emails (um ou vários)</Label>
                  <Textarea
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    rows={2}
                    placeholder="fulano@email.com, ciclano@email.com"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Separe vários endereços por vírgula ou ponto-e-vírgula.
                  </p>
                  {!emails.trim() && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      Informe ao menos um email — sem destinatário, nenhum aviso
                      será enviado.
                    </p>
                  )}
                </div>
                <div className="w-48">
                  <Label className="mb-1.5">Enviar quantos dias antes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={diasAntecedencia}
                    onChange={(e) => setDiasAntecedencia(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    0 = no próprio dia do evento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
