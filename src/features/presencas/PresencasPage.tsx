import { useMemo, useState } from "react";
import {
  Search,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAulas } from "@/features/aulas/aulasApi";
import { usePolos } from "@/features/polos/polosApi";
import { usePresencas } from "@/features/presencas/presencasApi";
import { dataBR, horaCurta } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Presenca } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PresencasPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;

  const { data: aulas, isLoading: carregandoAulas } = useAulas(admin);
  const { data: polos } = usePolos();

  const aulaIds = useMemo(() => (aulas ?? []).map((a) => a.id), [aulas]);
  const { data: presencas } = usePresencas(admin, aulaIds);

  const [filtroPolo, setFiltroPolo] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [expandida, setExpandida] = useState<Set<number>>(new Set());

  const nomePorPolo = useMemo(() => {
    const m = new Map<number, string>();
    polos?.forEach((p) => m.set(p.id, p.nome));
    return m;
  }, [polos]);

  const presencasPorAula = useMemo(() => {
    const m = new Map<number, Presenca[]>();
    (presencas ?? []).forEach((p) => {
      const arr = m.get(p.aulaId) ?? [];
      arr.push(p);
      m.set(p.aulaId, arr);
    });
    return m;
  }, [presencas]);

  const filtradas = useMemo(() => {
    const norm = (s: string) => s.toLocaleLowerCase("pt-BR");
    return (aulas ?? [])
      .filter(
        (a) =>
          !filtroPolo ||
          norm(nomePorPolo.get(a.poloId) ?? "").includes(norm(filtroPolo)),
      )
      .filter((a) => !filtroData || dataBR(a.data).includes(filtroData))
      .filter((a) => !filtroTurma || String(a.turma) === filtroTurma)
      .sort((a, b) => +new Date(b.data) - +new Date(a.data));
  }, [aulas, filtroPolo, filtroData, filtroTurma, nomePorPolo]);

  function toggle(id: number) {
    setExpandida((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          {admin && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Polo"
                value={filtroPolo}
                onChange={(e) => setFiltroPolo(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          <Input
            placeholder="Data (dd/MM/aaaa)"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
          />
          <Input
            placeholder="Turma (1, 2 ou 3)"
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
          />
        </CardContent>
      </Card>

      {carregandoAulas && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {!carregandoAulas && filtradas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma aula encontrada.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtradas.map((aula) => {
          const lista = presencasPorAula.get(aula.id) ?? [];
          const presentes = lista.filter((p) => p.estaPresente).length;
          const total = lista.length;
          const aberta = expandida.has(aula.id);

          return (
            <Card key={aula.id} className="overflow-hidden">
              <button
                onClick={() => toggle(aula.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <CalendarDays className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {dataBR(aula.data)} · {nomePorPolo.get(aula.poloId) ?? "-"} ·
                    Turma {aula.turma}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {horaCurta(aula.horaInicio)} – {horaCurta(aula.horaFim)}
                  </p>
                </div>
                {total > 0 ? (
                  <Badge variant={presentes === total ? "success" : "warning"}>
                    {presentes}/{total} presentes
                  </Badge>
                ) : (
                  <Badge variant="secondary">Sem registro</Badge>
                )}
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform",
                    aberta && "rotate-180",
                  )}
                />
              </button>

              {aberta && total > 0 && (
                <div className="border-t border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Presente</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lista.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.nomeAluno}
                          </TableCell>
                          <TableCell>
                            {p.estaPresente ? (
                              <span className="inline-flex items-center gap-1.5 text-success">
                                <CheckCircle2 className="size-4" /> Sim
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-destructive">
                                <XCircle className="size-4" /> Não
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.observacoes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {aberta && total === 0 && (
                <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                  Nenhuma presença registrada para esta aula.
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
