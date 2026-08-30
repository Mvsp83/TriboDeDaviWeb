import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Medal } from "lucide-react";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { faixaInfo } from "@/features/alunos/faixa";
import { useAtletas } from "@/features/atletas/atletasApi";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AtletaComparativoPage() {
  useDocumentTitle("Comparativo de atletas");
  const { data: atletas = [], isLoading } = useAtletas();

  // Ranking por medalhas (ouro, depois prata, depois bronze).
  const porMedalhas = useMemo(
    () =>
      [...atletas]
        .filter((a) => a.totalCompeticoes > 0)
        .sort(
          (x, y) =>
            y.medalhasOuro - x.medalhasOuro ||
            y.medalhasPrata - x.medalhasPrata ||
            y.medalhasBronze - x.medalhasBronze,
        ),
    [atletas],
  );

  // Indicadores disponíveis (dos últimos registros de cada atleta).
  const indicadores = useMemo(() => {
    const set = new Set<string>();
    for (const a of atletas)
      for (const i of a.ultimosIndicadores) if (i.nome) set.add(i.nome);
    return [...set];
  }, [atletas]);
  const [indicador, setIndicador] = useState("");

  const rankingIndicador = useMemo(() => {
    if (!indicador) return [];
    return atletas
      .map((a) => {
        const ind = a.ultimosIndicadores.find((i) => i.nome === indicador);
        return ind ? { atleta: a, valor: ind.valor, unidade: ind.unidade } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((x, y) => y.valor - x.valor);
  }, [atletas, indicador]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/atletas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Atletas
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <BarChart3 className="size-6 text-primary" />
          Comparativo
        </h1>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          {/* Ranking de medalhas */}
          <div>
            <h2 className="mb-2 flex items-center gap-2 font-semibold">
              <Medal className="size-4 text-primary" /> Medalhas
            </h2>
            {porMedalhas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma competição registrada ainda.
              </p>
            ) : (
              <div className="space-y-1.5">
                {porMedalhas.map((a, i) => (
                  <Link
                    key={a.id}
                    to={`/atletas/${a.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 hover:border-primary/40"
                  >
                    <span className="w-5 text-center text-sm font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {a.alunoNome}
                    </span>
                    <span className="text-sm">
                      🥇{a.medalhasOuro} 🥈{a.medalhasPrata} 🥉{a.medalhasBronze}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {a.totalCompeticoes} comp.
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Comparativo por indicador */}
          <div>
            <h2 className="mb-2 font-semibold">Por indicador</h2>
            {indicadores.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Registre avaliações com indicadores para comparar.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="max-w-xs">
                  <Label className="mb-1.5">Indicador</Label>
                  <Select value={indicador} onValueChange={setIndicador}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um indicador" />
                    </SelectTrigger>
                    <SelectContent>
                      {indicadores.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  {rankingIndicador.map((r, i) => (
                    <Link
                      key={r.atleta.id}
                      to={`/atletas/${r.atleta.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 hover:border-primary/40"
                    >
                      <span className="w-5 text-center text-sm font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          background: faixaInfo(r.atleta.faixa).cor,
                          color: faixaInfo(r.atleta.faixa).texto,
                        }}
                      >
                        {faixaInfo(r.atleta.faixa).nome}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {r.atleta.alunoNome}
                      </span>
                      <span className="font-semibold text-primary">
                        {r.valor}
                        {r.unidade ? ` ${r.unidade}` : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
