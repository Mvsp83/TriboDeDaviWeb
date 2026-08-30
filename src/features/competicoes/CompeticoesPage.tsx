import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, CalendarDays, MapPin, Users, Pencil } from "lucide-react";
import { toApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  useCompeticoes,
  useSalvarCompeticao,
  STATUS_COMPETICAO,
  type CompeticaoEvento,
} from "@/features/competicoes/competicoesApi";

function statusVariant(s: number): "warning" | "success" | "secondary" {
  if (s === 0) return "warning";
  if (s === 1) return "success";
  return "secondary";
}

const VAZIO = {
  nome: "",
  data: new Date().toISOString().slice(0, 10),
  dataFim: "",
  local: "",
  organizador: "",
  prazoInscricao: "",
  link: "",
  status: "0",
  observacao: "",
};

function FormDialog({
  aberto,
  onOpenChange,
  evento,
}: {
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
  evento: CompeticaoEvento | null;
}) {
  const salvar = useSalvarCompeticao();
  const [f, setF] = useState(VAZIO);

  // Recarrega ao abrir.
  useEffect(() => {
    if (!aberto) return;
    setF(
      evento
        ? {
            nome: evento.nome,
            data: evento.data?.slice(0, 10) ?? "",
            dataFim: evento.dataFim?.slice(0, 10) ?? "",
            local: evento.local,
            organizador: evento.organizador,
            prazoInscricao: evento.prazoInscricao?.slice(0, 10) ?? "",
            link: evento.link,
            status: String(evento.status),
            observacao: evento.observacao,
          }
        : VAZIO,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, evento]);

  async function onSalvar() {
    if (!f.nome.trim() || !f.data) {
      toast.warning("Informe nome e data.");
      return;
    }
    try {
      await salvar.mutateAsync({
        id: evento?.id,
        nome: f.nome.trim(),
        data: f.data,
        dataFim: f.dataFim || null,
        local: f.local.trim(),
        organizador: f.organizador.trim(),
        prazoInscricao: f.prazoInscricao || null,
        link: f.link.trim(),
        status: Number(f.status),
        observacao: f.observacao.trim(),
      });
      toast.success(evento ? "Competição atualizada." : "Competição cadastrada.");
      onOpenChange(false);
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  const set = (k: keyof typeof VAZIO) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar competição" : "Nova competição"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Nome *</Label>
            <Input value={f.nome} onChange={(e) => set("nome")(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Data *</Label>
            <Input type="date" value={f.data} onChange={(e) => set("data")(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Data fim (opcional)</Label>
            <Input type="date" value={f.dataFim} onChange={(e) => set("dataFim")(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Local</Label>
            <Input value={f.local} onChange={(e) => set("local")(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Organizador</Label>
            <Input value={f.organizador} onChange={(e) => set("organizador")(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Prazo de inscrição</Label>
            <Input type="date" value={f.prazoInscricao} onChange={(e) => set("prazoInscricao")(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Status</Label>
            <Select value={f.status} onValueChange={set("status")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_COMPETICAO).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Link (regulamento/inscrição)</Label>
            <Input value={f.link} onChange={(e) => set("link")(e.target.value)} placeholder="https://…" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Observações</Label>
            <Textarea rows={2} value={f.observacao} onChange={(e) => set("observacao")(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar} disabled={salvar.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CompeticoesPage() {
  useDocumentTitle("Competições");
  const { data: competicoes = [], isLoading } = useCompeticoes();
  const [dialog, setDialog] = useState(false);
  const [edicao, setEdicao] = useState<CompeticaoEvento | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "proximas" | "realizadas">("todas");

  const filtradas = competicoes.filter((c) =>
    filtro === "todas"
      ? true
      : filtro === "proximas"
        ? c.status === 0
        : c.status === 1,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Competições</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Carregando…" : `${competicoes.length} competição(ões)`}
          </p>
        </div>
        <Button
          onClick={() => {
            setEdicao(null);
            setDialog(true);
          }}
        >
          <Plus className="size-4" />
          Nova competição
        </Button>
      </div>

      <div className="flex gap-2">
        {(["todas", "proximas", "realizadas"] as const).map((v) => (
          <Button key={v} size="sm" variant={filtro === v ? "default" : "outline"} onClick={() => setFiltro(v)}>
            {v === "todas" ? "Todas" : v === "proximas" ? "Próximas" : "Realizadas"}
          </Button>
        ))}
      </div>

      {!isLoading && filtradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma competição aqui.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtradas.map((c) => (
            <Card key={c.id} className="transition-colors hover:border-primary/40">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/competicoes/${c.id}`} className="min-w-0 flex-1">
                    <span className="font-semibold">{c.nome}</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEdicao(c);
                      setDialog(true);
                    }}
                    aria-label="Editar"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
                <Link to={`/competicoes/${c.id}`}>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <Badge variant={statusVariant(c.status)}>{STATUS_COMPETICAO[c.status]}</Badge>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {dataBR(c.data)}
                    </span>
                    {c.local && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {c.local}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" />
                      {c.totalParticipantes}
                    </span>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormDialog aberto={dialog} onOpenChange={setDialog} evento={edicao} />
    </div>
  );
}
