import { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAulas } from "@/features/aulas/aulasApi";
import { useAlunos } from "@/features/alunos/alunosApi";
import { usePolos } from "@/features/polos/polosApi";
import { usePresencas } from "@/features/presencas/presencasApi";
import { useTableSort, type SortValue } from "@/lib/useTableSort";
import { SortableHead } from "@/components/SortableHead";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Linha {
  alunoId: number;
  nomeAluno: string;
  poloId: number;
  nomePolo: string;
  turma: number;
  totalAulas: number;
  presencas: number;
  faltas: number;
  percentual: number;
}

export function FrequenciaPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;

  const { data: aulas, isLoading: carregandoAulas } = useAulas(admin);
  const { data: polos } = usePolos();
  const { data: alunos } = useAlunos(admin);
  const aulaIds = useMemo(() => (aulas ?? []).map((a) => a.id), [aulas]);
  const { data: presencas, isLoading: carregandoPresencas } = usePresencas(
    admin,
    aulaIds,
  );

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroPolo, setFiltroPolo] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");

  const carregando = carregandoAulas || carregandoPresencas;

  const linhas = useMemo<Linha[]>(() => {
    const nomePolo = new Map((polos ?? []).map((p) => [p.id, p.nome]));
    const turmaPorAula = new Map((aulas ?? []).map((a) => [a.id, a.turma]));
    // O get-all de presenças (admin) devolve NomeAluno vazio; resolvemos o nome
    // pela lista de alunos (o endpoint por aula, do professor, já traz o nome).
    const nomeAlunoPorId = new Map((alunos ?? []).map((a) => [a.id, a.nome]));

    const grupos = new Map<number, Linha>();
    for (const p of presencas ?? []) {
      let linha = grupos.get(p.alunoId);
      if (!linha) {
        linha = {
          alunoId: p.alunoId,
          nomeAluno: p.nomeAluno || nomeAlunoPorId.get(p.alunoId) || "-",
          poloId: p.poloId,
          nomePolo: nomePolo.get(p.poloId) ?? "-",
          turma: turmaPorAula.get(p.aulaId) ?? 0,
          totalAulas: 0,
          presencas: 0,
          faltas: 0,
          percentual: 0,
        };
        grupos.set(p.alunoId, linha);
      }
      linha.totalAulas += 1;
      if (p.estaPresente) linha.presencas += 1;
      else linha.faltas += 1;
    }

    const norm = (s: string) => s.toLocaleLowerCase("pt-BR");
    return [...grupos.values()]
      .map((l) => ({
        ...l,
        percentual: l.totalAulas > 0 ? (l.presencas * 100) / l.totalAulas : 0,
      }))
      .filter((l) => !filtroNome || norm(l.nomeAluno).includes(norm(filtroNome)))
      .filter((l) => !filtroPolo || norm(l.nomePolo).includes(norm(filtroPolo)))
      .filter((l) => !filtroTurma || String(l.turma) === filtroTurma)
      .sort((a, b) => a.turma - b.turma || a.nomeAluno.localeCompare(b.nomeAluno, "pt-BR"));
  }, [presencas, aulas, polos, alunos, filtroNome, filtroPolo, filtroTurma]);

  const acessar = useCallback((l: Linha, key: string): SortValue => {
    switch (key) {
      case "aluno":
        return l.nomeAluno;
      case "polo":
        return l.nomePolo;
      case "aulas":
        return l.totalAulas;
      case "presencas":
        return l.presencas;
      case "faltas":
        return l.faltas;
      case "frequencia":
        return l.percentual;
      default:
        return "";
    }
  }, []);

  // Sem ordenação inicial: mantém a ordem padrão (turma, nome) até o usuário
  // clicar num cabeçalho.
  const { sorted, sortKey, sortDir, toggleSort } = useTableSort(linhas, acessar);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="pl-9"
            />
          </div>
          {admin && (
            <Input
              placeholder="Polo"
              value={filtroPolo}
              onChange={(e) => setFiltroPolo(e.target.value)}
            />
          )}
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
                {(
                  [
                    ["aluno", "Aluno"],
                    ["polo", "Polo"],
                    ["aulas", "Aulas"],
                    ["presencas", "Presenças"],
                    ["faltas", "Faltas"],
                    ["frequencia", "Frequência"],
                  ] as const
                ).map(([key, label]) => (
                  <SortableHead
                    key={key}
                    label={label}
                    columnKey={key}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!carregando && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum dado encontrado.
                  </TableCell>
                </TableRow>
              )}

              {!carregando &&
                sorted.map((l) => (
                  <TableRow key={l.alunoId}>
                    <TableCell className="font-medium">{l.nomeAluno}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.nomePolo}
                    </TableCell>
                    <TableCell className="tabular-nums">{l.totalAulas}</TableCell>
                    <TableCell className="tabular-nums">{l.presencas}</TableCell>
                    <TableCell className="tabular-nums">{l.faltas}</TableCell>
                    <TableCell
                      className={
                        l.percentual >= 75
                          ? "font-medium text-success"
                          : "font-medium text-destructive"
                      }
                    >
                      {l.percentual.toFixed(1)}%
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
