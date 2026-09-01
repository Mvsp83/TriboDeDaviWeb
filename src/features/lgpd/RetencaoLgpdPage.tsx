import { useState } from "react";
import { ShieldCheck, Loader2, Eraser, Info } from "lucide-react";
import { toast } from "sonner";
import {
  useRetencaoInscricoes,
  useAnonimizarInscricao,
  type InscricaoExpurgo,
} from "@/features/lgpd/retencaoApi";
import { ApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Retenção de dados (LGPD): inscrições recusadas com mais de 12 meses guardam
// dados pessoais que já não são necessários (nunca viraram aluno). O admin
// revisa e anonimiza — a decisão é sempre humana; nada é apagado sozinho.
export function RetencaoLgpdPage() {
  const { data: candidatas, isLoading, isError, error } = useRetencaoInscricoes();
  const anonimizar = useAnonimizarInscricao();
  const [alvo, setAlvo] = useState<InscricaoExpurgo | null>(null);

  async function confirmar() {
    if (!alvo) return;
    try {
      await anonimizar.mutateAsync(alvo.id);
      toast.success("Dados pessoais anonimizados.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível anonimizar.",
      );
    } finally {
      setAlvo(null);
    }
  }

  const lista = candidatas ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <ShieldCheck className="size-5 text-primary" />
          Retenção de dados (LGPD)
        </h1>
        <p className="text-sm text-muted-foreground">
          Inscrições recusadas com mais de 12 meses — nunca viraram aluno.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Anonimizar apaga os dados pessoais (nome, nascimento, CPF, endereço,
          saúde) e mantém só o registro sem identificação, para estatística.{" "}
          <span className="font-medium text-foreground">A ação não pode ser desfeita.</span>
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {error instanceof ApiError ? error.message : "Não foi possível carregar."}
            </div>
          ) : lista.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <ShieldCheck className="size-8" />
              <p className="text-sm">
                Nenhuma inscrição recusada fora do prazo de retenção. Tudo em dia.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Enviada em</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nome || "—"}</TableCell>
                    <TableCell className="tabular-nums">{i.ano}</TableCell>
                    <TableCell className="tabular-nums">{dataBR(i.dataEnvio)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAlvo(i)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Eraser className="size-4" />
                        Anonimizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        aberto={alvo !== null}
        onOpenChange={(aberto) => !aberto && setAlvo(null)}
        titulo="Anonimizar dados pessoais"
        descricao={
          <>
            Apagar os dados pessoais da inscrição de{" "}
            <strong>{alvo?.nome || "—"}</strong> ({alvo?.ano})? Esta ação não pode
            ser desfeita.
          </>
        }
        confirmarLabel="Anonimizar"
        onConfirmar={confirmar}
        carregando={anonimizar.isPending}
      />

      {anonimizar.isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Processando…
        </p>
      )}
    </div>
  );
}
