import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { toApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import { urlSegura } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { faixaInfo } from "@/features/alunos/faixa";
import { useAtletas } from "@/features/atletas/atletasApi";
import { Button } from "@/components/ui/button";
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
  useCompeticao,
  useAdicionarParticipacao,
  useAtualizarParticipacao,
  useRemoverParticipacao,
  STATUS_COMPETICAO,
  type Participacao,
} from "@/features/competicoes/competicoesApi";

function ParticipanteDialog({
  aberto,
  onOpenChange,
  eventoId,
  edicao,
  atletasDisponiveis,
}: {
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
  eventoId: number;
  edicao: Participacao | null;
  atletasDisponiveis: { id: number; nome: string }[];
}) {
  const adicionar = useAdicionarParticipacao(eventoId);
  const atualizar = useAtualizarParticipacao(eventoId);
  const [atletaId, setAtletaId] = useState("");
  const [f, setF] = useState({
    categoriaPeso: "",
    colocacao: 0,
    lutas: 0,
    vitorias: 0,
    finalizacoes: 0,
    observacao: "",
  });

  useEffect(() => {
    if (!aberto) return;
    setAtletaId(edicao ? String(edicao.atletaId) : "");
    setF({
      categoriaPeso: edicao?.categoriaPeso ?? "",
      colocacao: edicao?.colocacao ?? 0,
      lutas: edicao?.lutas ?? 0,
      vitorias: edicao?.vitorias ?? 0,
      finalizacoes: edicao?.finalizacoes ?? 0,
      observacao: edicao?.observacao ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, edicao]);

  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: Number(e.target.value) }));

  async function onSalvar() {
    if (!edicao && !atletaId) {
      toast.warning("Selecione o atleta.");
      return;
    }
    try {
      if (edicao) {
        await atualizar.mutateAsync({ ...edicao, ...f });
      } else {
        await adicionar.mutateAsync({ atletaId: Number(atletaId), ...f } as Partial<Participacao>);
      }
      toast.success("Salvo.");
      onOpenChange(false);
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edicao ? "Editar resultado" : "Adicionar participante"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {!edicao && (
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Atleta</Label>
              <Select value={atletaId} onValueChange={setAtletaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {atletasDisponiveis.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="mb-1.5">Categoria/peso</Label>
            <Input value={f.categoriaPeso} onChange={(e) => setF((s) => ({ ...s, categoriaPeso: e.target.value }))} />
          </div>
          <div>
            <Label className="mb-1.5">Colocação (0 = sem pódio)</Label>
            <Input type="number" min={0} value={f.colocacao} onChange={num("colocacao")} />
          </div>
          <div>
            <Label className="mb-1.5">Lutas</Label>
            <Input type="number" min={0} value={f.lutas} onChange={num("lutas")} />
          </div>
          <div>
            <Label className="mb-1.5">Vitórias</Label>
            <Input type="number" min={0} value={f.vitorias} onChange={num("vitorias")} />
          </div>
          <div>
            <Label className="mb-1.5">Finalizações</Label>
            <Input type="number" min={0} value={f.finalizacoes} onChange={num("finalizacoes")} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Observação</Label>
            <Textarea rows={2} value={f.observacao} onChange={(e) => setF((s) => ({ ...s, observacao: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar} disabled={adicionar.isPending || atualizar.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CompeticaoDetalhePage() {
  const params = useParams();
  const id = Number(params.id);
  const { data: c, isLoading } = useCompeticao(Number.isNaN(id) ? null : id);
  useDocumentTitle(c ? `Competição — ${c.nome}` : "Competição");
  const remover = useRemoverParticipacao(id);
  const atletas = useAtletas();

  const [dialog, setDialog] = useState(false);
  const [edicao, setEdicao] = useState<Participacao | null>(null);

  // Atletas ainda não inscritos nesta competição.
  const disponiveis = useMemo(() => {
    const inscritos = new Set((c?.participacoes ?? []).map((p) => p.atletaId));
    return (atletas.data ?? [])
      .filter((a) => !inscritos.has(a.id))
      .map((a) => ({ id: a.id, nome: a.alunoNome }));
  }, [atletas.data, c?.participacoes]);

  if (isLoading || !c) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {isLoading ? "Carregando…" : "Competição não encontrada."}
      </p>
    );
  }

  const linkSeguro = urlSegura(c.link);
  const medalhas = {
    ouro: c.participacoes.filter((p) => p.colocacao === 1).length,
    prata: c.participacoes.filter((p) => p.colocacao === 2).length,
    bronze: c.participacoes.filter((p) => p.colocacao === 3).length,
  };

  return (
    <div className="space-y-4">
      <Link to="/competicoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Competições
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{c.nome}</h1>
          <Badge variant={c.status === 0 ? "warning" : c.status === 1 ? "success" : "secondary"}>
            {STATUS_COMPETICAO[c.status]}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-4" />
            {dataBR(c.data)}
            {c.dataFim ? ` a ${dataBR(c.dataFim)}` : ""}
          </span>
          {c.local && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" />
              {c.local}
            </span>
          )}
          {c.organizador && <span>Org.: {c.organizador}</span>}
          {c.prazoInscricao && <span>Inscrições até {dataBR(c.prazoInscricao)}</span>}
          {linkSeguro && (
            <a href={linkSeguro} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="size-4" /> Link
            </a>
          )}
        </div>
        {c.observacao && <p className="mt-2 text-sm text-muted-foreground">{c.observacao}</p>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">
          Participantes ({c.participacoes.length})
          {(medalhas.ouro || medalhas.prata || medalhas.bronze) > 0 && (
            <span className="ml-2 text-sm font-normal">
              🥇{medalhas.ouro} 🥈{medalhas.prata} 🥉{medalhas.bronze}
            </span>
          )}
        </h2>
        <Button
          size="sm"
          onClick={() => {
            setEdicao(null);
            setDialog(true);
          }}
        >
          <Plus className="size-4" /> Participante
        </Button>
      </div>

      <div className="space-y-1.5">
        {c.participacoes.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{ background: faixaInfo(p.faixa).cor, color: faixaInfo(p.faixa).texto }}
            >
              {faixaInfo(p.faixa).nome}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{p.atletaNome}</span>
            {p.categoriaPeso && <Badge variant="outline">{p.categoriaPeso}</Badge>}
            {p.colocacao > 0 && <Badge variant="warning">{p.colocacao}º</Badge>}
            <span className="text-xs text-muted-foreground">
              {p.vitorias}/{p.lutas} · {p.finalizacoes} fin.
            </span>
            <Button variant="ghost" size="icon" onClick={() => { setEdicao(p); setDialog(true); }} aria-label="Editar">
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => remover.mutate(p.id)} aria-label="Remover">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
        {c.participacoes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum participante ainda. Clique em “Participante” para adicionar.
          </p>
        )}
      </div>

      <ParticipanteDialog
        aberto={dialog}
        onOpenChange={setDialog}
        eventoId={id}
        edicao={edicao}
        atletasDisponiveis={disponiveis}
      />
    </div>
  );
}
