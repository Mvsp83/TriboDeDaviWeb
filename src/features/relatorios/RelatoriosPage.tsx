import { useMemo, useState } from "react";
import { FileBarChart, Download, Printer, BookmarkPlus, Bookmark, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { usePolos } from "@/features/polos/polosApi";
import {
  useMeusRelatorios,
  useCriarRelatorio,
  useExcluirRelatorio,
} from "@/features/relatorios/relatoriosSalvosApi";
import { montarFontes, type Fonte, type FiltroCtx } from "@/features/relatorios/fontes";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { RelatorioSalvo } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        ativo
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
      )}
    >
      {children}
    </button>
  );
}

export function RelatoriosPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const { data: polos } = usePolos();

  const { data: salvos } = useMeusRelatorios();
  const criarSalvo = useCriarRelatorio();
  const excluirSalvo = useExcluirRelatorio();

  const nomePolo = useMemo(() => {
    const m = new Map((polos ?? []).map((p) => [p.id, p.nome]));
    return (id: number) => m.get(id) ?? "-";
  }, [polos]);

  const fontes = useMemo(
    () => montarFontes(admin, nomePolo).filter((f) => !f.somenteAdmin || admin),
    [admin, nomePolo],
  );

  const [fonteId, setFonteId] = useState<string | null>(null);
  const [colunasSel, setColunasSel] = useState<Set<string>>(new Set());
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [turma, setTurma] = useState("");
  const [poloId, setPoloId] = useState<number | null>(null);

  const [linhas, setLinhas] = useState<unknown[]>([]);
  const [gerado, setGerado] = useState(false);
  const [gerando, setGerando] = useState(false);

  const [dialogSalvar, setDialogSalvar] = useState(false);
  const [nomeSalvo, setNomeSalvo] = useState("");

  const fonte = fontes.find((f) => f.id === fonteId) ?? null;
  const colunasRelatorio = useMemo(
    () => fonte?.colunas.filter((c) => colunasSel.has(c.id)) ?? [],
    [fonte, colunasSel],
  );
  const temResultado = gerado && linhas.length > 0 && colunasRelatorio.length > 0;

  const mostraPeriodo = !!fonte && (fonte.data != null || !!fonte.usaPeriodo);
  const mostraTurma = !!fonte && (fonte.turma != null || !!fonte.usaTurma);
  const mostraPolo = !!fonte && admin && (fonte.polo != null || !!fonte.usaPolo);

  function selecionarFonte(id: string) {
    const f = fontes.find((x) => x.id === id);
    setFonteId(id);
    setColunasSel(new Set(f?.colunas.filter((c) => c.padrao).map((c) => c.id)));
    setLinhas([]);
    setGerado(false);
    setInicio("");
    setFim("");
    setTurma("");
    setPoloId(null);
  }

  function toggleColuna(id: string) {
    setColunasSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function aplicarFiltros(f: Fonte, brutas: unknown[]): unknown[] {
    let query = brutas;
    if (f.data && inicio) query = query.filter((o) => f.data!(o)! >= new Date(inicio));
    if (f.data && fim) {
      const lim = new Date(fim);
      lim.setDate(lim.getDate() + 1);
      query = query.filter((o) => f.data!(o)! < lim);
    }
    if (f.turma && turma) query = query.filter((o) => f.turma!(o) === Number(turma));
    if (f.polo && admin && poloId != null) query = query.filter((o) => f.polo!(o) === poloId);
    if (f.data) query = [...query].sort((a, b) => +f.data!(a)! - +f.data!(b)!);
    return query;
  }

  async function gerar() {
    if (!fonte) return;
    if (colunasRelatorio.length === 0) {
      toast.warning("Selecione ao menos uma coluna.");
      return;
    }
    setGerando(true);
    setGerado(false);
    try {
      const ctx: FiltroCtx = {
        inicio: inicio || null,
        fim: fim || null,
        turma: turma ? Number(turma) : null,
        poloId,
      };
      const brutas = await fonte.carregar(ctx);
      setLinhas(aplicarFiltros(fonte, brutas));
      setGerado(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao gerar o relatório.");
    } finally {
      setGerando(false);
    }
  }

  function exportarCsv() {
    if (!fonte || !temResultado) return;
    const campo = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const linhasCsv = [
      colunasRelatorio.map((c) => campo(c.titulo)).join(";"),
      ...linhas.map((l) => colunasRelatorio.map((c) => campo(c.valor(l))).join(";")),
    ];
    const blob = new Blob(["﻿" + linhasCsv.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${fonte.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function imprimir() {
    if (!fonte || !temResultado) return;
    const esc = (v: string) =>
      (v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>Relatório de ${esc(fonte.nome)}</title>
<style>body{font-family:Segoe UI,Roboto,sans-serif;color:#111;margin:24px;}
h1{font-size:18px;margin:0 0 2px 0;}p{margin:0 0 16px 0;color:#555;font-size:12px;}
table{border-collapse:collapse;width:100%;font-size:12px;}
th,td{border:1px solid #999;padding:4px 8px;text-align:left;}
th{background:#eee;}tr:nth-child(even) td{background:#f7f7f7;}</style></head><body>
<h1>Instituto Tribo de Davi — Relatório de ${esc(fonte.nome)}</h1>
<p>Gerado em ${new Date().toLocaleString("pt-BR")} — ${linhas.length} registro(s)</p>
<table><thead><tr>${colunasRelatorio.map((c) => `<th>${esc(c.titulo)}</th>`).join("")}</tr></thead>
<tbody>${linhas
      .map((l) => `<tr>${colunasRelatorio.map((c) => `<td>${esc(c.valor(l))}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></body></html>`;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Permita pop-ups para imprimir.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  async function salvar() {
    if (!fonte || colunasRelatorio.length === 0) return;
    if (!nomeSalvo.trim()) {
      toast.warning("Dê um nome ao relatório.");
      return;
    }
    const rel: RelatorioSalvo = {
      id: 0,
      nome: nomeSalvo.trim(),
      fonteId: fonte.id,
      colunas: colunasRelatorio.map((c) => c.id).join(","),
      turma: turma ? Number(turma) : null,
      poloId,
    };
    try {
      await criarSalvo.mutateAsync(rel);
      toast.success("Relatório salvo!");
      setDialogSalvar(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar o relatório.");
    }
  }

  function aplicarSalvo(s: RelatorioSalvo) {
    const f = fontes.find((x) => x.id === s.fonteId);
    if (!f) {
      toast.warning("A fonte deste relatório não está mais disponível.");
      return;
    }
    setFonteId(f.id);
    const ids = new Set(s.colunas.split(",").map((x) => x.trim()).filter(Boolean));
    setColunasSel(new Set(f.colunas.filter((c) => ids.has(c.id)).map((c) => c.id)));
    setTurma(s.turma != null ? String(s.turma) : "");
    setPoloId(admin ? (s.poloId ?? null) : null);
    setInicio("");
    setFim("");
    setLinhas([]);
    setGerado(false);
  }

  async function removerSalvo(s: RelatorioSalvo) {
    try {
      await excluirSalvo.mutateAsync(s.id);
      toast.success("Relatório removido.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover o relatório.");
    }
  }

  return (
    <div className="space-y-4">
      {(salvos ?? []).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">Meus relatórios</p>
            <div className="flex flex-wrap gap-2">
              {(salvos ?? []).map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 py-1 pl-3 pr-1.5 text-sm"
                >
                  <button
                    className="inline-flex items-center gap-1.5 hover:text-primary"
                    onClick={() => aplicarSalvo(s)}
                  >
                    <Bookmark className="size-3.5" />
                    {s.nome}
                  </button>
                  <button
                    onClick={() => removerSalvo(s)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-medium">1. O que você quer reportar?</p>
          <div className="flex flex-wrap gap-2">
            {fontes.map((f) => (
              <Chip key={f.id} ativo={fonteId === f.id} onClick={() => selecionarFonte(f.id)}>
                {f.nome}
              </Chip>
            ))}
          </div>
        </CardContent>
      </Card>

      {fonte && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">2. Quais colunas?</p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setColunasSel(new Set(fonte.colunas.map((c) => c.id)))}
                  >
                    Todas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setColunasSel(new Set(fonte.colunas.filter((c) => c.padrao).map((c) => c.id)))
                    }
                  >
                    Padrão
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {fonte.colunas.map((c) => (
                  <Chip key={c.id} ativo={colunasSel.has(c.id)} onClick={() => toggleColuna(c.id)}>
                    {c.titulo}
                  </Chip>
                ))}
              </div>
            </CardContent>
          </Card>

          {(mostraPeriodo || mostraTurma || mostraPolo) && (
            <Card>
              <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                {mostraPeriodo && (
                  <>
                    <div>
                      <Label className="mb-1.5">De</Label>
                      <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                    </div>
                    <div>
                      <Label className="mb-1.5">Até</Label>
                      <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
                    </div>
                  </>
                )}
                {mostraTurma && (
                  <div>
                    <Label className="mb-1.5">Turma</Label>
                    <Input placeholder="ex: 1" value={turma} onChange={(e) => setTurma(e.target.value)} />
                  </div>
                )}
                {mostraPolo && (
                  <div>
                    <Label className="mb-1.5">Polo</Label>
                    <Select
                      value={poloId != null ? String(poloId) : "todos"}
                      onValueChange={(v) => setPoloId(v === "todos" ? null : Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {(polos ?? []).map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={gerar} disabled={gerando}>
              {gerando ? <Loader2 className="size-4 animate-spin" /> : <FileBarChart className="size-4" />}
              Gerar relatório
            </Button>
            <Button variant="outline" onClick={exportarCsv} disabled={!temResultado}>
              <Download className="size-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={imprimir} disabled={!temResultado}>
              <Printer className="size-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setNomeSalvo("");
                setDialogSalvar(true);
              }}
              disabled={colunasRelatorio.length === 0}
            >
              <BookmarkPlus className="size-4" />
              Salvar
            </Button>
            {gerado && (
              <span className="ml-1 text-sm text-muted-foreground">
                {linhas.length} registro(s)
              </span>
            )}
          </div>

          {gerado && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {colunasRelatorio.map((c) => (
                        <TableHead key={c.id}>{c.titulo}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={colunasRelatorio.length} className="py-10 text-center text-muted-foreground">
                          Nenhum registro encontrado com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                    {linhas.map((l, i) => (
                      <TableRow key={i}>
                        {colunasRelatorio.map((c) => (
                          <TableCell key={c.id}>{c.valor(l)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={dialogSalvar} onOpenChange={setDialogSalvar}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Salvar relatório</DialogTitle>
            <DialogDescription>
              Salva a fonte, as colunas e os filtros de turma/polo para reutilizar depois.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="mb-1.5">Nome do relatório</Label>
            <Input
              placeholder="ex: Contatos da turma 1"
              value={nomeSalvo}
              onChange={(e) => setNomeSalvo(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogSalvar(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={criarSalvo.isPending}>
              {criarSalvo.isPending && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
