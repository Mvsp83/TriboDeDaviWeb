import { useMemo, useState } from "react";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAlunos } from "@/features/alunos/alunosApi";
import { usePolos } from "@/features/polos/polosApi";
import { useAniversariantes } from "@/features/aniversariantes/aniversariantesApi";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const TODOS = "__todos__";

export function AniversariantesPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;

  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroPolo, setFiltroPolo] = useState(TODOS);

  const { data: aniversariantes, isLoading } = useAniversariantes(mes);
  const { data: alunos } = useAlunos(admin);
  const { data: polos } = usePolos();

  const nomesPolos = useMemo(
    () =>
      [...new Set((polos ?? []).map((p) => p.nome))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [polos],
  );

  // Casa o aniversariante ao aluno (por nome) para descobrir o polo.
  const linhas = useMemo(() => {
    const norm = (s: string) => s.trim().toLocaleLowerCase("pt-BR");
    const poloPorId = new Map((polos ?? []).map((p) => [p.id, p.nome]));
    const poloPorAluno = new Map(
      (alunos ?? []).map((a) => [norm(a.nome), poloPorId.get(a.poloId) ?? "-"]),
    );

    return (aniversariantes ?? [])
      .map((a) => {
        const d = new Date(a.dataNascimento);
        return {
          ...a,
          nomePolo: poloPorAluno.get(norm(a.nome)) ?? "-",
          mesNasc: d.getMonth(),
          dia: d.getDate(),
        };
      })
      .filter(
        (a) =>
          !filtroNome || norm(a.nome).includes(norm(filtroNome)),
      )
      .filter((a) => filtroPolo === TODOS || a.nomePolo === filtroPolo)
      .sort((a, b) => a.mesNasc - b.mesNasc || a.dia - b.dia);
  }, [aniversariantes, alunos, polos, filtroNome, filtroPolo]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mês
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[["Todos", 0] as const, ...MESES.map((n, i) => [n, i + 1] as const)].map(
                ([nome, m]) => {
                  const ativo = m === mes;
                  return (
                    <button
                      key={nome}
                      onClick={() => setMes(m)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        ativo
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                      )}
                    >
                      {nome}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="pl-9"
              />
            </div>
            {admin && (
              <Select value={filtroPolo} onValueChange={setFiltroPolo}>
                <SelectTrigger>
                  <SelectValue placeholder="Polo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos os polos</SelectItem>
                  {nomesPolos.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Polo</TableHead>
                <TableHead>Comemorado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Nenhum aniversariante encontrado.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                linhas.map((a, i) => (
                  <TableRow key={`${a.nome}-${i}`}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(a.dataNascimento).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.nomePolo}
                    </TableCell>
                    <TableCell>
                      {a.jaComemorado ? (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <CheckCircle2 className="size-4" /> Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-warning">
                          <XCircle className="size-4" /> Não
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
