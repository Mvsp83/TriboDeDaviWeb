import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAvisosPendentes, useMarcarCiente } from "@/features/avisos/avisosApi";
import { dataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Popup dos avisos pendentes do usuário. "Ciente" grava (não reaparece);
// "Adiar" apenas pula nesta sessão (reaparece no próximo login).
export function AvisosPendentes() {
  const { autenticado } = useAuth();
  const { data: pendentes } = useAvisosPendentes(autenticado);
  const ciente = useMarcarCiente();
  const [adiados, setAdiados] = useState<Set<number>>(new Set());

  const fila = useMemo(
    () => (pendentes ?? []).filter((a) => !adiados.has(a.id)),
    [pendentes, adiados],
  );

  const atual = fila[0];
  if (!atual) return null;

  function adiar() {
    setAdiados((s) => new Set(s).add(atual.id));
  }

  function darCiente() {
    ciente.mutate(atual.id, {
      onError: () =>
        toast.error("Não foi possível registrar. Tente novamente."),
    });
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && adiar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            {atual.titulo || "Aviso"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Aviso interno do instituto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="whitespace-pre-wrap text-sm">{atual.mensagem}</p>
          <p className="text-xs text-muted-foreground">
            {dataBR(atual.dataCriacao)}
            {atual.criadoPor ? ` · ${atual.criadoPor}` : ""}
            {fila.length > 1 ? ` · 1 de ${fila.length}` : ""}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={adiar}>
            Adiar
          </Button>
          <Button onClick={darCiente} disabled={ciente.isPending}>
            {ciente.isPending && <Loader2 className="size-4 animate-spin" />}
            Ciente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
