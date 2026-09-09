import { useCallback, useMemo, useState } from "react";
import { Search, MoreVertical } from "lucide-react";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // Total de colunas do cabeçalho (para os colSpan de "carregando"/"vazio"):
  // Aluno, [Polo se admin], Aulas, Presenças, Faltas, Frequência, menu ⋮.
  const nColunas = admin ? 7 : 6;

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
                    // Presenças/Faltas ficam ocultas no celular (vão para o
                    // menu ⋮ de cada linha); reaparecem como colunas em sm+.
                    ["presencas", "Presenças", "hidden sm:table-cell"],
                    ["faltas", "Faltas", "hidden sm:table-cell"],
                    ["frequencia", "Frequência"],
                  ] as const
                )
                  // Polo só faz sentido para o admin; o professor só tem o dele.
                  .filter(([key]) => admin || key !== "polo")
                  .map(([key, label, className]) => (
                  <SortableHead
                    key={key}
                    label={label}
                    columnKey={key}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className={className}
                  />
                ))}
                {/* Coluna do menu ⋮ — só no celular. */}
                <TableHead className="w-10 sm:hidden" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={nColunas}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!carregando && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={nColunas} className="py-10 text-center text-muted-foreground">
                    Nenhum dado encontrado.
                  </TableCell>
                </TableRow>
              )}

              {!carregando &&
                sorted.map((l) => (
                  <TableRow key={l.alunoId}>
                    <TableCell className="font-medium">{l.nomeAluno}</TableCell>
                    {admin && (
                      <TableCell className="text-muted-foreground">
                        {l.nomePolo}
                      </TableCell>
                    )}
                    <TableCell className="tabular-nums">{l.totalAulas}</TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">
                      {l.presencas}
                    </TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">
                      {l.faltas}
                    </TableCell>
                    <TableCell
                      className={
                        l.percentual >= 75
                          ? "font-medium text-success"
                          : "font-medium text-destructive"
                      }
                    >
                      {l.percentual.toFixed(1)}%
                    </TableCell>
                    {/* Menu ⋮ (só no celular): mostra Presenças e Faltas. */}
                    <TableCell className="p-1 sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Presenças e faltas de ${l.nomeAluno}`}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[9rem]">
                          <DropdownMenuLabel className="truncate">
                            {l.nomeAluno}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-sm">
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-muted-foreground">Presenças</span>
                              <span className="font-medium tabular-nums">{l.presencas}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-6">
                              <span className="text-muted-foreground">Faltas</span>
                              <span className="font-medium tabular-nums">{l.faltas}</span>
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
