import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UsersRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import { faixaInfo } from "@/features/alunos/faixa";
import {
  useAlunosSemTurma,
  useAtribuirTurma,
  type AlunoPendenteTurma,
} from "@/features/alunos/alunosApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Idade em anos completos — ajuda a professora a escolher a turma certa.
function idadeAnos(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) anos -= 1;
  return anos >= 0 ? anos : null;
}

function ChipFaixa({ faixa }: { faixa: number }) {
  const info = faixaInfo(faixa);
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: info.cor, color: info.texto, borderColor: "rgba(0,0,0,0.15)" }}
    >
      {info.nome}
    </span>
  );
}

// Alunos importados de planilha sem turma (turma 0). Ficam fora da lista normal
// (que filtra turmas 1-3) até alguém atribuir a turma. A professora do polo (ou
// o admin) resolve aqui com um clique. Só aparece quando há pendências.
export function AlunosSemTurma({ mostrarPolo = false }: { mostrarPolo?: boolean }) {
  const { data: pendentes, isLoading } = useAlunosSemTurma();
  const atribuir = useAtribuirTurma();
  const [idAtual, setIdAtual] = useState<number | null>(null);

  if (isLoading || !pendentes || pendentes.length === 0) return null;

  function definir(aluno: AlunoPendenteTurma, turma: number) {
    setIdAtual(aluno.id);
    atribuir.mutate(
      { alunoId: aluno.id, turma },
      {
        onSuccess: () =>
          toast.success(`${aluno.nome} atribuído(a) à Turma ${turma}.`),
        onError: (e) =>
          toast.error(
            e instanceof ApiError ? e.message : "Não foi possível atribuir a turma.",
          ),
        onSettled: () => setIdAtual(null),
      },
    );
  }

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-2">
          <UsersRound className="mt-0.5 size-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold text-foreground">
              {pendentes.length} aluno(s) sem turma
            </p>
            <p className="text-sm text-muted-foreground">
              Vieram da importação sem turma definida e por isso não aparecem na
              lista. Atribua a turma para cada um.
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {pendentes.map((a) => {
            const idade = idadeAnos(a.dataNascimento);
            const ocupado = idAtual === a.id;
            return (
              <li
                key={a.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-foreground">
                    {a.nome}
                  </span>
                  <ChipFaixa faixa={a.faixa} />
                  {idade != null && (
                    <span className="text-xs text-muted-foreground">
                      {idade} anos
                    </span>
                  )}
                  {mostrarPolo && a.poloNome && (
                    <span className="text-xs text-muted-foreground">
                      · {a.poloNome}
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="mr-1 text-xs text-muted-foreground">
                    Turma:
                  </span>
                  {[1, 2, 3].map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant="outline"
                      disabled={ocupado}
                      onClick={() => definir(a, t)}
                      aria-label={`Atribuir ${a.nome} à Turma ${t}`}
                    >
                      {ocupado ? <Loader2 className="size-4 animate-spin" /> : t}
                    </Button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
