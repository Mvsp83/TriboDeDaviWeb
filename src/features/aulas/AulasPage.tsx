import { useMemo, useState } from "react";
import { Search, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAulas } from "@/features/aulas/aulasApi";
import { usePolos } from "@/features/polos/polosApi";
import { dataBR, horaCurta } from "@/lib/format";
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

export function AulasPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;

  const { data: aulas, isLoading, isError } = useAulas(admin);
  const { data: polos } = usePolos();

  const [filtroPolo, setFiltroPolo] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");

  const nomePorPolo = useMemo(() => {
    const m = new Map<number, string>();
    polos?.forEach((p) => m.set(p.id, p.nome));
    return m;
  }, [polos]);

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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isLoading ? "Carregando..." : `${filtradas.length} aula(s)`}
      </p>

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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Polo</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Presença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-destructive">
                    Erro ao carregar as aulas. Tente novamente.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhuma aula encontrada.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtradas.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium tabular-nums">
                      {dataBR(a.data)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {nomePorPolo.get(a.poloId) ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Turma {a.turma}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {horaCurta(a.horaInicio)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {horaCurta(a.horaFim)}
                    </TableCell>
                    <TableCell>
                      {a.presencaSalva ? (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <CheckCircle2 className="size-4" /> Salva
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-warning">
                          <Clock className="size-4" /> Pendente
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
