import { toast } from "sonner";
import { Loader2, Copy, RefreshCw, KeyRound } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  useCodigoResponsavel,
  useGerarCodigoResponsavel,
} from "@/features/alunos/alunosApi";
import type { Aluno } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CodigoResponsavelDialog({
  aluno,
  aberto,
  onOpenChange,
}: {
  aluno: Aluno | null;
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const consulta = useCodigoResponsavel(aberto ? (aluno?.id ?? null) : null);
  const gerar = useGerarCodigoResponsavel();

  const codigo = consulta.data?.codigo ?? null;

  async function gerarCodigo() {
    if (!aluno) return;
    try {
      await gerar.mutateAsync(aluno.id);
      toast.success("Código gerado.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao gerar o código.",
      );
    }
  }

  function copiar() {
    if (!codigo) return;
    navigator.clipboard
      .writeText(codigo)
      .then(() => toast.success("Código copiado."))
      .catch(() => toast.error("Não foi possível copiar."));
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Acesso do responsável</DialogTitle>
          <DialogDescription>
            Código para a família acompanhar <strong>{aluno?.nome}</strong> no
            portal do responsável (em <code>/responsavel</code>). A família entra
            com este código + a data de nascimento do aluno.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {consulta.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : codigo ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-3">
              <KeyRound className="size-4 text-muted-foreground" />
              <span className="flex-1 text-center font-mono text-lg tracking-[0.2em]">
                {codigo}
              </span>
              <Button variant="ghost" size="icon" onClick={copiar} aria-label="Copiar">
                <Copy className="size-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum código gerado ainda.
            </p>
          )}

          <Button onClick={gerarCodigo} disabled={gerar.isPending}>
            {gerar.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {codigo ? "Gerar novo código" : "Gerar código"}
          </Button>
          {codigo && (
            <p className="text-xs text-muted-foreground">
              Gerar um novo código invalida o anterior.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
