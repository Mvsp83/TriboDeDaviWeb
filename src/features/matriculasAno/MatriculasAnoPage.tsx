import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Users, UserX, UserCheck, Loader2, Search } from "lucide-react";
import { toApiError } from "@/lib/api";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMatriculasAno,
  useAlterarAtivaMatricula,
  type MatriculaAno,
} from "@/features/matriculasAno/matriculasAnoApi";

// Sem acento/maiúscula, para a busca casar "José" com "jose".
const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const TODOS = "__todos__";

export function MatriculasAnoPage() {
  useDocumentTitle("Alunos do ano");
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);

  const { data: matriculas = [], isLoading } = useMatriculasAno(ano);
  const alterar = useAlterarAtivaMatricula();
  const [emAcao, setEmAcao] = useState<number | null>(null);

  const [filtroPolo, setFiltroPolo] = useState(TODOS);
  const [busca, setBusca] = useState("");

  // Polos disponíveis (para o seletor).
  const polos = useMemo(
    () =>
      [...new Set(matriculas.map((m) => m.poloNome))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [matriculas],
  );

  // Aplica polo + nome antes de agrupar.
  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    return matriculas.filter(
      (m) =>
        (filtroPolo === TODOS || m.poloNome === filtroPolo) &&
        (q === "" || normalizar(m.alunoNome).includes(q)),
    );
  }, [matriculas, filtroPolo, busca]);

  // Agrupa por polo; dentro do polo, ativos primeiro.
  const porPolo = useMemo(() => {
    const grupos = new Map<string, MatriculaAno[]>();
    for (const m of filtradas) {
      const lista = grupos.get(m.poloNome) ?? [];
      lista.push(m);
      grupos.set(m.poloNome, lista);
    }
    return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtradas]);

  async function alternar(m: MatriculaAno) {
    setEmAcao(m.id);
    try {
      await alterar.mutateAsync({ id: m.id, ativa: !m.ativa });
      toast.success(m.ativa ? "Matrícula inativada — vaga liberada." : "Matrícula reativada.");
    } catch (e) {
      toast.error(toApiError(e).message);
    } finally {
      setEmAcao(null);
    }
  }

  const anos = [anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alunos do ano</h1>
          <p className="text-sm text-muted-foreground">
            Ative ou inative a matrícula do aluno no ano. Inativar libera vaga no
            polo.
          </p>
        </div>
        <div className="flex gap-1">
          {anos.map((a) => (
            <Button
              key={a}
              size="sm"
              variant={a === ano ? "default" : "outline"}
              onClick={() => setAno(a)}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>

      {!isLoading && matriculas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filtroPolo} onValueChange={setFiltroPolo}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os polos</SelectItem>
              {polos.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno pelo nome…"
              className="pl-8"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Carregando…
        </p>
      ) : matriculas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma matrícula em {ano}.
          </CardContent>
        </Card>
      ) : porPolo.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum aluno encontrado com esses filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {porPolo.map(([polo, lista]) => {
            const ativos = lista.filter((m) => m.ativa).length;
            return (
              <div key={polo}>
                <h2 className="mb-2 flex items-center gap-2 font-semibold">
                  <Users className="size-4 text-primary" />
                  {polo}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {ativos} ativo(s) de {lista.length}
                  </span>
                </h2>
                <div className="space-y-1.5">
                  {lista.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <span
                          className={`truncate font-medium ${
                            m.ativa ? "" : "text-muted-foreground line-through"
                          }`}
                        >
                          {m.alunoNome}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          Turma {m.turma}
                        </span>
                      </div>
                      {m.ativa ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => alternar(m)}
                        disabled={emAcao === m.id}
                      >
                        {emAcao === m.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : m.ativa ? (
                          <UserX className="size-4" />
                        ) : (
                          <UserCheck className="size-4" />
                        )}
                        {m.ativa ? "Inativar" : "Reativar"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
