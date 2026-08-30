import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Trophy,
  Medal,
  LineChart,
  NotebookPen,
  Target,
} from "lucide-react";
import { toApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { faixaInfo } from "@/features/alunos/faixa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAtleta,
  useAtualizarPerfil,
  useAdicionarAvaliacao,
  useRemoverAvaliacao,
  useAdicionarCompeticao,
  useRemoverCompeticao,
  useAdicionarAnotacao,
  useRemoverAnotacao,
  useAdicionarMeta,
  useAlterarStatusMeta,
  useRemoverMeta,
  STATUS_ATLETA,
  STATUS_META,
  type Atleta,
  type IndicadorAvaliacao,
} from "@/features/atletas/atletasApi";

const hoje = () => new Date().toISOString().slice(0, 10);

// ── Gráfico de linha simples (SVG) ───────────────────────────────────────────
function MiniGrafico({ pontos }: { pontos: { rotulo: string; valor: number }[] }) {
  if (pontos.length < 2)
    return (
      <p className="text-xs text-muted-foreground">
        Registre ao menos 2 medições deste indicador para ver a evolução.
      </p>
    );
  const w = 320;
  const h = 120;
  const pad = 20;
  const valores = pontos.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const range = max - min || 1;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (pontos.length - 1);
  const y = (v: number) => h - pad - ((v - min) * (h - 2 * pad)) / range;
  const d = pontos
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.valor)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md">
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth={2} />
      {pontos.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.valor)} r={3} fill="var(--primary)" />
      ))}
    </svg>
  );
}

// ── Perfil ───────────────────────────────────────────────────────────────────
function Perfil({ atleta }: { atleta: Atleta }) {
  const salvar = useAtualizarPerfil(atleta.id);
  const [categoria, setCategoria] = useState(atleta.categoriaPeso);
  const [objetivo, setObjetivo] = useState(atleta.objetivo);
  const [status, setStatus] = useState(String(atleta.status));

  async function onSalvar() {
    try {
      await salvar.mutateAsync({
        ...atleta,
        categoriaPeso: categoria.trim(),
        objetivo: objetivo.trim(),
        status: Number(status),
      });
      toast.success("Perfil atualizado.");
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5">Categoria de peso</Label>
          <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_ATLETA).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1.5">Objetivo / foco</Label>
          <Textarea
            rows={2}
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={onSalvar} disabled={salvar.isPending} size="sm">
        Salvar perfil
      </Button>
    </div>
  );
}

// ── Índices ──────────────────────────────────────────────────────────────────
function Indices({ atleta }: { atleta: Atleta }) {
  const adicionar = useAdicionarAvaliacao(atleta.id);
  const remover = useRemoverAvaliacao(atleta.id);

  const [data, setData] = useState(hoje());
  const [observacao, setObservacao] = useState("");
  const [indicadores, setIndicadores] = useState<IndicadorAvaliacao[]>([
    { nome: "", valor: 0, unidade: "" },
  ]);

  // Indicador selecionado para o gráfico.
  const nomesIndicadores = useMemo(() => {
    const set = new Set<string>();
    for (const av of atleta.avaliacoes)
      for (const i of av.indicadores) if (i.nome) set.add(i.nome);
    return [...set];
  }, [atleta.avaliacoes]);
  const [indicadorGrafico, setIndicadorGrafico] = useState("");
  useEffect(() => {
    if (!indicadorGrafico && nomesIndicadores.length > 0)
      setIndicadorGrafico(nomesIndicadores[0]);
  }, [nomesIndicadores, indicadorGrafico]);

  const pontos = useMemo(() => {
    return atleta.avaliacoes
      .map((av) => {
        const ind = av.indicadores.find((i) => i.nome === indicadorGrafico);
        return ind ? { rotulo: dataBR(av.data), valor: ind.valor } : null;
      })
      .filter((p): p is { rotulo: string; valor: number } => p !== null);
  }, [atleta.avaliacoes, indicadorGrafico]);

  function setInd(i: number, campo: keyof IndicadorAvaliacao, v: string | number) {
    setIndicadores((a) => a.map((x, idx) => (idx === i ? { ...x, [campo]: v } : x)));
  }

  async function onSalvar() {
    const validos = indicadores.filter((i) => i.nome.trim());
    if (validos.length === 0) {
      toast.warning("Adicione ao menos um indicador.");
      return;
    }
    try {
      await adicionar.mutateAsync({ data, observacao: observacao.trim(), indicadores: validos });
      toast.success("Avaliação registrada.");
      setObservacao("");
      setIndicadores([{ nome: "", valor: 0, unidade: "" }]);
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  return (
    <div className="space-y-5">
      {/* Gráfico */}
      {nomesIndicadores.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Evolução de</Label>
              <Select value={indicadorGrafico} onValueChange={setIndicadorGrafico}>
                <SelectTrigger className="h-8 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nomesIndicadores.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <MiniGrafico pontos={pontos} />
          </CardContent>
        </Card>
      )}

      {/* Nova avaliação */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Nova avaliação</p>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label className="mb-1 text-xs">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            {indicadores.map((ind, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="min-w-32 flex-1">
                  <Label className="mb-1 text-xs">Indicador</Label>
                  <Input
                    value={ind.nome}
                    onChange={(e) => setInd(i, "nome", e.target.value)}
                    placeholder="Ex.: Peso, Flexão…"
                  />
                </div>
                <div className="w-24">
                  <Label className="mb-1 text-xs">Valor</Label>
                  <Input
                    type="number"
                    step="any"
                    value={ind.valor}
                    onChange={(e) => setInd(i, "valor", Number(e.target.value))}
                  />
                </div>
                <div className="w-20">
                  <Label className="mb-1 text-xs">Unidade</Label>
                  <Input
                    value={ind.unidade}
                    onChange={(e) => setInd(i, "unidade", e.target.value)}
                    placeholder="kg, reps"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIndicadores((a) => a.filter((_, idx) => idx !== i))}
                  aria-label="Remover indicador"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setIndicadores((a) => [...a, { nome: "", valor: 0, unidade: "" }])
              }
            >
              <Plus className="size-4" /> Indicador
            </Button>
          </div>
          <Textarea
            rows={2}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação (opcional)"
          />
          <Button onClick={onSalvar} disabled={adicionar.isPending} size="sm">
            Registrar avaliação
          </Button>
        </CardContent>
      </Card>

      {/* Histórico */}
      <div className="space-y-2">
        {[...atleta.avaliacoes].reverse().map((av) => (
          <div key={av.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{dataBR(av.data)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remover.mutate(av.id)}
                aria-label="Remover avaliação"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {av.indicadores.map((i) => (
                <Badge key={i.id} variant="outline">
                  {i.nome}: {i.valor}
                  {i.unidade ? ` ${i.unidade}` : ""}
                </Badge>
              ))}
            </div>
            {av.observacao && (
              <p className="mt-1 text-xs text-muted-foreground">{av.observacao}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Competições ──────────────────────────────────────────────────────────────
function Competicoes({ atleta }: { atleta: Atleta }) {
  const adicionar = useAdicionarCompeticao(atleta.id);
  const remover = useRemoverCompeticao(atleta.id);
  const [form, setForm] = useState({
    data: hoje(),
    evento: "",
    categoriaPeso: "",
    colocacao: 0,
    lutas: 0,
    vitorias: 0,
    finalizacoes: 0,
    observacao: "",
  });

  const medalhas = useMemo(() => {
    const m = { ouro: 0, prata: 0, bronze: 0 };
    for (const c of atleta.competicoes) {
      if (c.colocacao === 1) m.ouro++;
      else if (c.colocacao === 2) m.prata++;
      else if (c.colocacao === 3) m.bronze++;
    }
    return m;
  }, [atleta.competicoes]);

  async function onSalvar() {
    if (!form.evento.trim()) {
      toast.warning("Informe o nome do evento.");
      return;
    }
    try {
      await adicionar.mutateAsync({ ...form, evento: form.evento.trim() });
      toast.success("Competição registrada.");
      setForm({ data: hoje(), evento: "", categoriaPeso: "", colocacao: 0, lutas: 0, vitorias: 0, finalizacoes: 0, observacao: "" });
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  const num = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="warning">🥇 {medalhas.ouro}</Badge>
        <Badge variant="secondary">🥈 {medalhas.prata}</Badge>
        <Badge variant="outline">🥉 {medalhas.bronze}</Badge>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-medium">Nova competição</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="mb-1 text-xs">Data</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 text-xs">Evento</Label>
              <Input value={form.evento} onChange={(e) => setForm((f) => ({ ...f, evento: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 text-xs">Categoria/peso</Label>
              <Input value={form.categoriaPeso} onChange={(e) => setForm((f) => ({ ...f, categoriaPeso: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 text-xs">Colocação (0 = sem pódio)</Label>
              <Input type="number" min={0} value={form.colocacao} onChange={num("colocacao")} />
            </div>
            <div>
              <Label className="mb-1 text-xs">Lutas</Label>
              <Input type="number" min={0} value={form.lutas} onChange={num("lutas")} />
            </div>
            <div>
              <Label className="mb-1 text-xs">Vitórias</Label>
              <Input type="number" min={0} value={form.vitorias} onChange={num("vitorias")} />
            </div>
            <div>
              <Label className="mb-1 text-xs">Finalizações</Label>
              <Input type="number" min={0} value={form.finalizacoes} onChange={num("finalizacoes")} />
            </div>
          </div>
          <Textarea rows={2} value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} placeholder="Observação (opcional)" />
          <Button onClick={onSalvar} disabled={adicionar.isPending} size="sm">
            Registrar competição
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {atleta.competicoes.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium">{c.evento}</span>
                <span className="ml-2 text-xs text-muted-foreground">{dataBR(c.data)}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remover.mutate(c.id)} aria-label="Remover">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              {c.categoriaPeso && <Badge variant="outline">{c.categoriaPeso}</Badge>}
              {c.colocacao > 0 && <Badge variant="warning">{c.colocacao}º lugar</Badge>}
              <span>{c.vitorias}/{c.lutas} vitórias · {c.finalizacoes} finalizações</span>
            </div>
            {c.observacao && <p className="mt-1 text-xs text-muted-foreground">{c.observacao}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Diário ───────────────────────────────────────────────────────────────────
function Diario({ atleta }: { atleta: Atleta }) {
  const adicionar = useAdicionarAnotacao(atleta.id);
  const remover = useRemoverAnotacao(atleta.id);
  const [texto, setTexto] = useState("");

  async function onSalvar() {
    if (!texto.trim()) return;
    try {
      await adicionar.mutateAsync(texto.trim());
      setTexto("");
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Anotação técnica, evolução, pontos a melhorar…" />
        <Button onClick={onSalvar} disabled={adicionar.isPending || !texto.trim()} size="sm">
          <Plus className="size-4" /> Adicionar anotação
        </Button>
      </div>
      <div className="space-y-2">
        {atleta.anotacoes.map((a) => (
          <div key={a.id} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {dataBR(a.data)}
                {a.autor ? ` · ${a.autor}` : ""}
              </span>
              <Button variant="ghost" size="icon" onClick={() => remover.mutate(a.id)} aria-label="Remover">
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm">{a.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Metas ────────────────────────────────────────────────────────────────────
function Metas({ atleta }: { atleta: Atleta }) {
  const adicionar = useAdicionarMeta(atleta.id);
  const alterar = useAlterarStatusMeta(atleta.id);
  const remover = useRemoverMeta(atleta.id);
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");

  async function onSalvar() {
    if (!descricao.trim()) return;
    try {
      await adicionar.mutateAsync({ descricao: descricao.trim(), prazo: prazo || null });
      setDescricao("");
      setPrazo("");
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <Label className="mb-1 text-xs">Meta</Label>
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Pódio no estadual" />
        </div>
        <div>
          <Label className="mb-1 text-xs">Prazo (opcional)</Label>
          <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
        <Button onClick={onSalvar} disabled={adicionar.isPending || !descricao.trim()} size="sm">
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>
      <div className="space-y-2">
        {atleta.metas.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0 flex-1">
              <span className={m.status === 1 ? "line-through text-muted-foreground" : ""}>{m.descricao}</span>
              {m.prazo && <span className="ml-2 text-xs text-muted-foreground">até {dataBR(m.prazo)}</span>}
            </div>
            <Badge variant={m.status === 1 ? "success" : m.status === 2 ? "secondary" : "warning"}>
              {STATUS_META[m.status]}
            </Badge>
            {m.status !== 1 && (
              <Button size="sm" variant="outline" onClick={() => alterar.mutate({ id: m.id, status: 1 })}>
                Concluir
              </Button>
            )}
            {m.status === 0 && (
              <Button size="sm" variant="ghost" onClick={() => alterar.mutate({ id: m.id, status: 2 })}>
                Cancelar
              </Button>
            )}
            {m.status !== 0 && (
              <Button size="sm" variant="ghost" onClick={() => alterar.mutate({ id: m.id, status: 0 })}>
                Reabrir
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => remover.mutate(m.id)} aria-label="Remover">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────
const ABAS = [
  { id: "perfil", label: "Perfil", icon: Trophy },
  { id: "indices", label: "Índices", icon: LineChart },
  { id: "competicoes", label: "Competições", icon: Medal },
  { id: "diario", label: "Diário", icon: NotebookPen },
  { id: "metas", label: "Metas", icon: Target },
] as const;

export function AtletaDetalhePage() {
  const params = useParams();
  const id = Number(params.id);
  const { data: atleta, isLoading } = useAtleta(Number.isNaN(id) ? null : id);
  useDocumentTitle(atleta ? `Atleta — ${atleta.alunoNome}` : "Atleta");
  const [aba, setAba] = useState<(typeof ABAS)[number]["id"]>("perfil");

  if (isLoading || !atleta) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {isLoading ? "Carregando…" : "Atleta não encontrado."}
      </p>
    );
  }

  const f = faixaInfo(atleta.faixa);

  return (
    <div className="space-y-4">
      <Link
        to="/atletas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Atletas
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{atleta.alunoNome}</h1>
        <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: f.cor, color: f.texto }}>
          {f.nome}
        </span>
        <Badge variant="outline">{atleta.poloNome}</Badge>
        <Badge variant={atleta.status === 0 ? "success" : atleta.status === 1 ? "warning" : "secondary"}>
          {STATUS_ATLETA[atleta.status]}
        </Badge>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {ABAS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                aba === a.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {a.label}
            </button>
          );
        })}
      </div>

      <div className="pt-1">
        {aba === "perfil" && <Perfil atleta={atleta} />}
        {aba === "indices" && <Indices atleta={atleta} />}
        {aba === "competicoes" && <Competicoes atleta={atleta} />}
        {aba === "diario" && <Diario atleta={atleta} />}
        {aba === "metas" && <Metas atleta={atleta} />}
      </div>
    </div>
  );
}
