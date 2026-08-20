import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, FileText, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { salvarMovimentacao } from "./financeiroStore";
import { parsearExtrato, type LinhaExtrato } from "./importarExtrato";
import {
  CATEGORIAS,
  type ContaFinanceira,
  type MovimentacaoFinanceira,
} from "./tipos";
import { moeda, dataCurtaBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  contas: ContaFinanceira[];
  movimentacoes: MovimentacaoFinanceira[];
}

function chaveDup(contaId: number, data: string, tipo: string, valor: number, doc: string) {
  return `${contaId}|${data}|${tipo}|${valor.toFixed(2)}|${doc}`;
}

export function ImportarExtratoDialog({
  aberto,
  onOpenChange,
  contas,
  movimentacoes,
}: Props) {
  const qc = useQueryClient();
  const [contaId, setContaId] = useState<string>("");
  const [linhas, setLinhas] = useState<LinhaExtrato[]>([]);
  const [categorias, setCategorias] = useState<Record<number, string>>({});
  const [inclusos, setInclusos] = useState<Set<number>>(new Set());
  const [lendo, setLendo] = useState(false);
  const [importando, setImportando] = useState(false);

  function limpar() {
    setLinhas([]);
    setCategorias({});
    setInclusos(new Set());
  }

  // Chaves das movimentações já existentes (para detectar duplicatas).
  const existentes = useMemo(() => {
    const set = new Set<string>();
    for (const m of movimentacoes)
      set.add(chaveDup(m.contaId, m.data, m.tipo, m.valor, m.documento ?? ""));
    return set;
  }, [movimentacoes]);

  function ehDuplicata(l: LinhaExtrato): boolean {
    if (!contaId) return false;
    return existentes.has(
      chaveDup(Number(contaId), l.data, l.tipo, l.valor, l.documento),
    );
  }

  async function onArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setLendo(true);
    limpar();
    try {
      const lidas = await parsearExtrato(arquivo);
      if (lidas.length === 0) {
        toast.warning("Nenhuma movimentação reconhecida no arquivo.");
        return;
      }
      setLinhas(lidas);
      setCategorias(Object.fromEntries(lidas.map((l, i) => [i, l.categoriaId])));
      // Marca todas para importar; duplicatas são filtradas na hora de importar.
      setInclusos(new Set(lidas.map((_, i) => i)));
      toast.success(`${lidas.length} movimentação(ões) lida(s).`);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível ler o PDF do extrato.");
    } finally {
      setLendo(false);
    }
  }

  function alternar(i: number) {
    setInclusos((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  const resumo = useMemo(() => {
    let novos = 0;
    let dups = 0;
    linhas.forEach((l, i) => {
      if (!inclusos.has(i)) return;
      if (ehDuplicata(l)) dups++;
      else novos++;
    });
    return { novos, dups };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linhas, inclusos, contaId, existentes]);

  async function importar() {
    if (!contaId) {
      toast.warning("Escolha a conta de destino.");
      return;
    }
    setImportando(true);
    let inseridos = 0;
    let ignorados = 0;
    try {
      for (let i = 0; i < linhas.length; i++) {
        if (!inclusos.has(i)) continue;
        const l = linhas[i];
        if (ehDuplicata(l)) {
          ignorados++;
          continue;
        }
        await salvarMovimentacao({
          contaId: Number(contaId),
          data: l.data,
          descricao: l.descricao,
          categoriaId: categorias[i] ?? l.categoriaId,
          tipo: l.tipo,
          valor: l.valor,
          conciliado: false,
          documento: l.documento,
        });
        inseridos++;
      }
      qc.invalidateQueries({ queryKey: ["movimentacoes"] });
      toast.success(
        `${inseridos} importada(s)` +
          (ignorados > 0 ? ` · ${ignorados} duplicada(s) ignorada(s)` : ""),
      );
      onOpenChange(false);
      limpar();
      setContaId("");
    } catch {
      toast.error("Falha ao importar. Tente novamente.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar extrato (PDF ou OFX)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-64">
              <Label className="mb-1.5">Conta de destino</Label>
              <Select value={contaId} onValueChange={setContaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <input
                id="arquivo-extrato"
                type="file"
                accept=".pdf,.ofx,.qfx"
                className="hidden"
                disabled={!contaId || lendo}
                onChange={onArquivo}
              />
              <Button
                variant="outline"
                disabled={!contaId || lendo}
                onClick={() => document.getElementById("arquivo-extrato")?.click()}
              >
                {lendo ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                Escolher arquivo (PDF/OFX)
              </Button>
            </div>
          </div>

          {!contaId && (
            <p className="text-xs text-muted-foreground">
              Escolha a conta antes de carregar o PDF.
            </p>
          )}

          {linhas.length > 0 && (
            <>
              <div className="max-h-[46vh] overflow-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-secondary/60 text-xs">
                    <tr>
                      <th className="p-2 text-left">Imp.</th>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Descrição</th>
                      <th className="p-2 text-right">Valor</th>
                      <th className="p-2 text-left">Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l, i) => {
                      const dup = ehDuplicata(l);
                      return (
                        <tr
                          key={i}
                          className={dup ? "opacity-60" : ""}
                          title={dup ? "Já existe nesta conta" : ""}
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={inclusos.has(i)}
                              onChange={() => alternar(i)}
                              className="size-4 accent-primary"
                            />
                          </td>
                          <td className="whitespace-nowrap p-2 tabular-nums">
                            {dataCurtaBR(l.data)}
                          </td>
                          <td className="p-2">
                            <span className="line-clamp-1">{l.descricao}</span>
                            {dup && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-warning">
                                <AlertTriangle className="size-3" /> duplicada
                              </span>
                            )}
                          </td>
                          <td
                            className={
                              "whitespace-nowrap p-2 text-right tabular-nums " +
                              (l.tipo === "Credito"
                                ? "text-success"
                                : "text-destructive")
                            }
                          >
                            {l.tipo === "Credito" ? "+" : "−"}
                            {moeda(l.valor)}
                          </td>
                          <td className="p-2">
                            <Select
                              value={categorias[i] ?? l.categoriaId}
                              onValueChange={(v) =>
                                setCategorias((c) => ({ ...c, [i]: v }))
                              }
                            >
                              <SelectTrigger className="h-8 w-44">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIAS.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{resumo.novos} a importar</Badge>
                {resumo.dups > 0 && (
                  <Badge variant="warning">{resumo.dups} duplicada(s) serão puladas</Badge>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={importar}
            disabled={importando || resumo.novos === 0}
          >
            {importando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Importar {resumo.novos > 0 ? `(${resumo.novos})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
