import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEmprestarBem } from "@/features/patrimonio/patrimonioApi";
import { CATEGORIA_BEM_LABEL } from "@/features/patrimonio/tipos";
import { ApiError } from "@/lib/api";
import type { Aluno, BemPatrimonial } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  bem: BemPatrimonial | null;
  alunos: Pick<Aluno, "id" | "nome">[];
}

export function EmprestarBemDialog({ aberto, onOpenChange, bem, alunos }: Props) {
  const emprestar = useEmprestarBem();
  const [alunoId, setAlunoId] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (aberto) {
      setAlunoId("");
      setObservacao("");
    }
  }, [aberto]);

  async function onEmprestar() {
    if (!bem) return;
    if (!alunoId) {
      toast.warning("Escolha o aluno que vai ficar com o item.");
      return;
    }
    try {
      await emprestar.mutateAsync({
        bemPatrimonialId: bem.id,
        alunoId: Number(alunoId),
        observacao: observacao.trim(),
      });
      toast.success("Empréstimo registrado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao registrar o empréstimo.");
    }
  }

  const detalhe = bem
    ? [CATEGORIA_BEM_LABEL[bem.categoria], bem.tamanho, bem.cor]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Emprestar item</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {bem && (
            <p className="text-sm text-muted-foreground">
              {bem.descricao}
              {detalhe ? ` — ${detalhe}` : ""}
            </p>
          )}
          <div>
            <Label className="mb-1.5">Aluno</Label>
            <Select value={alunoId} onValueChange={setAlunoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {[...alunos]
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5">Observação (opcional)</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder="Ex.: entregue no polo, previsão de devolução no fim do ano."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onEmprestar} disabled={emprestar.isPending}>
            {emprestar.isPending && <Loader2 className="size-4 animate-spin" />}
            Emprestar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
