import { useHistoricoBem } from "@/features/patrimonio/patrimonioApi";
import { dataHora } from "@/lib/format";
import type { BemPatrimonial } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  bem: BemPatrimonial | null;
  nomeAluno: (id: number | null | undefined) => string | null;
}

export function HistoricoBemDialog({ aberto, onOpenChange, bem, nomeAluno }: Props) {
  const { data: historico = [], isLoading } = useHistoricoBem(aberto ? bem?.id ?? null : null);

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de empréstimos</DialogTitle>
        </DialogHeader>

        {bem && (
          <p className="text-sm text-muted-foreground">{bem.descricao}</p>
        )}

        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

          {!isLoading && historico.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Este item ainda não foi emprestado.
            </p>
          )}

          {!isLoading &&
            historico.map((e) => {
              const aberto = e.dataDevolucao == null;
              return (
                <div
                  key={e.id}
                  className="rounded-md border border-border p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {nomeAluno(e.alunoId) ?? `Aluno #${e.alunoId}`}
                    </span>
                    {aberto ? (
                      <Badge>Em aberto</Badge>
                    ) : (
                      <Badge variant="secondary">Devolvido</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Saída: {dataHora(e.dataEmprestimo)}
                    {e.dataDevolucao ? ` · Devolução: ${dataHora(e.dataDevolucao)}` : ""}
                    {e.registradoPor ? ` · por ${e.registradoPor}` : ""}
                  </div>
                  {e.observacao ? (
                    <p className="mt-1 text-xs">{e.observacao}</p>
                  ) : null}
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
