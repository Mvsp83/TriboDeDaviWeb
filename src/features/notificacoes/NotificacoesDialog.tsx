import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import {
  obterEstadoPush,
  ativarPush,
  desativarPush,
  testarPush,
  type EstadoPush,
} from "@/lib/webPush";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Opt-in de notificações no dispositivo (Web Push). Cada dispositivo/navegador
// se inscreve por conta própria; o servidor guarda a inscrição por usuário.
export function NotificacoesDialog({
  aberto,
  onOpenChange,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [estado, setEstado] = useState<EstadoPush | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setEstado(null);
    obterEstadoPush().then(setEstado).catch(() => setEstado(null));
  }, [aberto]);

  async function recarregar() {
    setEstado(await obterEstadoPush());
  }

  async function ativar() {
    setOcupado(true);
    try {
      await ativarPush();
      await recarregar();
      toast.success("Notificações ativadas neste dispositivo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível ativar.");
    } finally {
      setOcupado(false);
    }
  }

  async function desativar() {
    setOcupado(true);
    try {
      await desativarPush();
      await recarregar();
      toast.success("Notificações desativadas neste dispositivo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível desativar.");
    } finally {
      setOcupado(false);
    }
  }

  async function testar() {
    setOcupado(true);
    try {
      const n = await testarPush();
      toast.success(
        n > 0 ? "Notificação de teste enviada." : "Nenhum dispositivo recebeu o teste.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar o teste.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Notificações neste dispositivo</DialogTitle>
          <DialogDescription>
            Receba avisos do instituto (lembrete de aula, recados) direto no
            aparelho, mesmo com o app fechado.
          </DialogDescription>
        </DialogHeader>

        {estado === null ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : !estado.suportado ? (
          <p className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
            Este navegador não suporta notificações. No iPhone, é preciso
            adicionar o app à tela de início e abrir por ali.
          </p>
        ) : !estado.configurado ? (
          <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-muted-foreground">
            As notificações ainda não foram configuradas no servidor (chaves
            VAPID). Assim que forem, esta opção fica disponível.
          </p>
        ) : estado.permissao === "denied" ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-muted-foreground">
            As notificações estão bloqueadas para este site. Libere nas
            configurações do navegador e tente de novo.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm">
              {estado.inscrito ? (
                <>
                  <Bell className="size-4 text-primary" />
                  <span>Ativadas neste dispositivo.</span>
                </>
              ) : (
                <>
                  <BellOff className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Desativadas neste dispositivo.</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {estado.inscrito ? (
                <>
                  <Button variant="outline" onClick={desativar} disabled={ocupado}>
                    {ocupado && <Loader2 className="size-4 animate-spin" />}
                    <BellOff className="size-4" />
                    Desativar
                  </Button>
                  <Button variant="ghost" onClick={testar} disabled={ocupado}>
                    <Send className="size-4" />
                    Enviar teste
                  </Button>
                </>
              ) : (
                <Button onClick={ativar} disabled={ocupado}>
                  {ocupado && <Loader2 className="size-4 animate-spin" />}
                  <Bell className="size-4" />
                  Ativar notificações
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
