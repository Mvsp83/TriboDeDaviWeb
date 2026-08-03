import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  descricao: ReactNode;
  confirmarLabel?: string;
  onConfirmar: () => void;
  carregando?: boolean;
  destrutivo?: boolean;
}

// Diálogo genérico de confirmação (exclusões e ações irreversíveis).
export function ConfirmDialog({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  confirmarLabel = "Confirmar",
  onConfirmar,
  carregando = false,
  destrutivo = true,
}: Props) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant={destrutivo ? "destructive" : "default"}
            onClick={onConfirmar}
            disabled={carregando}
          >
            {carregando && <Loader2 className="size-4 animate-spin" />}
            {confirmarLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
