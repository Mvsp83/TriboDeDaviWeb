import { useMemo, useState } from "react";
import { Download, Printer, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useMovimentacoes } from "./movimentacoesApi";
import { anosDisponiveis, anoDe, mesDe } from "./calculos";
import { baixarCsv, imprimirDocumento } from "./exportar";
import { CATEGORIAS, valorComSinal, type MovimentacaoFinanceira } from "./tipos";
import { moeda, MESES_CURTOS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TipoLinha = "categoria" | "subtotal" | "resultado" | "acumulado";

interface LinhaPlanilha {
  rotulo: string;
  valores: number[]; // 12 meses
  total: number;
  tipo: TipoLinha;
}

const RECEITAS = CATEGORIAS.filter((c) => c.natureza === "Receita");
const DESPESAS = CATEGORIAS.filter((c) => c.natureza === "Despesa");
// Referência estável para o estado de carregamento (evita recomputar memos).
const SEM_MOVS: MovimentacaoFinanceira[] = [];

function numeroCsv(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export function PlanilhaFinanceiraPage() {
  const { data: movs } = useMovimentacoes();
  const movimentacoes = movs ?? SEM_MOVS;

  const anos = useMemo(() => anosDisponiveis(movimentacoes), [movimentacoes]);
  const [ano, setAno] = useState<number>(() => new Date().getFullYear());
  const anoAtivo = anos.includes(ano) ? ano : anos[0];

  // Soma com sinal por categoria e por mês, no ano selecionado.
  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number[]>();
    for (const m of movimentacoes) {
      if (anoDe(m.data) !== anoAtivo) continue;
      const linha = mapa.get(m.categoriaId) ?? new Array(12).fill(0);
      linha[mesDe(m.data)] += valorComSinal(m);
      mapa.set(m.categoriaId, linha);
    }
    return mapa;
  }, [movimentacoes, anoAtivo]);

  const { linhas, temDados } = useMemo(() => {
    const soma12 = () => new Array(12).fill(0);
    const total = (v: number[]) => v.reduce((a, b) => a + b, 0);

    const linhasReceita: LinhaPlanilha[] = RECEITAS.map((c) => {
      const valores = (porCategoria.get(c.id) ?? soma12()).map((v) => v);
      return { rotulo: c.nome, valores, total: total(valores), tipo: "categoria" as const };
    }).filter((l) => l.total !== 0);

    // Despesas em magnitude positiva (o sinal já é negativo em valorComSinal).
    const linhasDespesa: LinhaPlanilha[] = DESPESAS.map((c) => {
      const valores = (porCategoria.get(c.id) ?? soma12()).map((v) => -v);
      return { rotulo: c.nome, valores, total: total(valores), tipo: "categoria" as const };
    }).filter((l) => l.total !== 0);

    const somaColunas = (ls: LinhaPlanilha[]) => {
      const acc = soma12();
      for (const l of ls) for (let i = 0; i < 12; i++) acc[i] += l.valores[i];
      return acc;
    };

    const totReceitas = somaColunas(linhasReceita);
    const totDespesas = somaColunas(linhasDespesa);
    const resultado = totReceitas.map((v, i) => v - totDespesas[i]);
    const acumulado = resultado.reduce<number[]>((acc, v, i) => {
      acc.push((i > 0 ? acc[i - 1] : 0) + v);
      return acc;
    }, []);

    const linhas: LinhaPlanilha[] = [
      ...linhasReceita,
      { rotulo: "Total de Receitas", valores: totReceitas, total: total(totReceitas), tipo: "subtotal" },
      ...linhasDespesa,
      { rotulo: "Total de Despesas", valores: totDespesas, total: total(totDespesas), tipo: "subtotal" },
      { rotulo: "Resultado do mês", valores: resultado, total: total(resultado), tipo: "resultado" },
      { rotulo: "Saldo acumulado", valores: acumulado, total: acumulado[11] ?? 0, tipo: "acumulado" },
    ];

    return {
      linhas,
      temDados: linhasReceita.length > 0 || linhasDespesa.length > 0,
    };
  }, [porCategoria]);

  const totais = useMemo(() => {
    const rec = linhas.find((l) => l.rotulo === "Total de Receitas")?.total ?? 0;
    const desp = linhas.find((l) => l.rotulo === "Total de Despesas")?.total ?? 0;
    return { rec, desp, resultado: rec - desp };
  }, [linhas]);

  function exportarCsv() {
    if (!temDados) return;
    baixarCsv(
      `planilha-financeira-${anoAtivo}`,
      ["Categoria", ...MESES_CURTOS, "Total"],
      linhas.map((l) => [l.rotulo, ...l.valores.map(numeroCsv), numeroCsv(l.total)]),
    );
  }

  function exportarPdf() {
    if (!temDados) return;
    const ok = imprimirDocumento(
      `Planilha Financeira ${anoAtivo}`,
      "Consolidação anual das movimentações financeiras",
      [
        {
          cabecalho: ["Categoria", ...MESES_CURTOS, "Total"],
          linhas: linhas.map((l) => [
            l.rotulo,
            ...l.valores.map((v) => moeda(v)),
            moeda(l.total),
          ]),
          colunasNumericas: Array.from({ length: 13 }, (_, i) => i + 1),
          linhasDestaque: linhas
            .map((l, i) => (l.tipo !== "categoria" ? i : -1))
            .filter((i) => i >= 0),
        },
      ],
    );
    if (!ok) toast.error("Permita pop-ups para gerar o PDF.");
  }

  function corLinha(tipo: TipoLinha): string {
    if (tipo === "subtotal") return "bg-secondary/50 font-medium";
    if (tipo === "resultado") return "bg-accent/40 font-semibold";
    if (tipo === "acumulado") return "bg-accent/60 font-semibold";
    return "";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Planilha Financeira</h1>
          <p className="text-sm text-muted-foreground">
            Consolidação anual de todas as movimentações — a base enviada à
            contabilidade para o balanço e a DRE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(anoAtivo)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportarCsv} disabled={!temDados}>
            <Download className="size-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={exportarPdf} disabled={!temDados}>
            <Printer className="size-4" />
            PDF
          </Button>
        </div>
      </div>

      {!temDados ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <FileSpreadsheet className="size-6" />
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Nenhuma movimentação em {anoAtivo}. A planilha é alimentada
              automaticamente pelos lançamentos de Extratos e Aplicações —
              registre movimentações e elas aparecerão aqui, consolidadas por
              mês.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Receitas em {anoAtivo}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-success">
                {moeda(totais.rec)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Despesas em {anoAtivo}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-destructive">
                {moeda(totais.desp)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Resultado em {anoAtivo}</p>
              <p
                className={cn(
                  "mt-1 text-xl font-semibold tabular-nums",
                  totais.resultado >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {moeda(totais.resultado)}
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">
                        Categoria
                      </th>
                      {MESES_CURTOS.map((m) => (
                        <th key={m} className="px-3 py-2 text-right font-medium">
                          {m}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr
                        key={l.rotulo}
                        className={cn("border-b border-border/60", corLinha(l.tipo))}
                      >
                        <td
                          className={cn(
                            "sticky left-0 z-10 whitespace-nowrap px-3 py-2 text-left",
                            corLinha(l.tipo) || "bg-card",
                          )}
                        >
                          {l.rotulo}
                        </td>
                        {l.valores.map((v, i) => (
                          <td
                            key={i}
                            className={cn(
                              "px-3 py-2 text-right tabular-nums",
                              v === 0 && "text-muted-foreground/40",
                              l.tipo === "resultado" && v < 0 && "text-destructive",
                            )}
                          >
                            {v === 0 ? "—" : moeda(v)}
                          </td>
                        ))}
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-medium tabular-nums",
                            l.tipo === "resultado" && l.total < 0 && "text-destructive",
                          )}
                        >
                          {moeda(l.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Transferências entre contas (aportes e resgates de aplicações) não
            entram no resultado, apenas movem saldo entre as contas. Os
            rendimentos das aplicações contam como receita.
          </p>
        </>
      )}
    </div>
  );
}
