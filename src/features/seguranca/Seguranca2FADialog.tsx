import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { ApiError } from "@/lib/api";
import type { Setup2FA } from "@/features/auth/authApi";
import {
  useConfirmar2FA,
  useDesativar2FA,
  useIniciar2FA,
  useStatus2FA,
} from "@/features/seguranca/seguranca2faApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function apenasDigitos(v: string) {
  return v.replace(/\D/g, "").slice(0, 6);
}

export function Seguranca2FADialog({
  aberto,
  onOpenChange,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const status = useStatus2FA(aberto);
  const iniciar = useIniciar2FA();
  const confirmar = useConfirmar2FA();
  const desativar = useDesativar2FA();

  const [setup, setSetup] = useState<Setup2FA | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");

  // Ao fechar, zera o estado transitório (secret/QR não devem sobreviver).
  useEffect(() => {
    if (!aberto) {
      setSetup(null);
      setQr(null);
      setCodigo("");
    }
  }, [aberto]);

  // Gera o QR a partir da URI otpauth quando um setup é iniciado.
  useEffect(() => {
    if (!setup?.uri) return;
    let cancelado = false;
    QRCode.toDataURL(setup.uri, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelado) setQr(url);
      })
      .catch(() => {
        if (!cancelado) setQr(null);
      });
    return () => {
      cancelado = true;
    };
  }, [setup]);

  const ativo = status.data?.ativo ?? false;

  async function iniciarAtivacao() {
    try {
      const dados = await iniciar.mutateAsync();
      setSetup(dados);
      setCodigo("");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao iniciar o 2FA.",
      );
    }
  }

  async function confirmarAtivacao() {
    try {
      await confirmar.mutateAsync(codigo);
      toast.success("2FA ativado. Ele será pedido nos próximos logins.");
      setSetup(null);
      setQr(null);
      setCodigo("");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Código inválido.",
      );
    }
  }

  async function confirmarDesativacao() {
    try {
      await desativar.mutateAsync(codigo);
      toast.success("2FA desativado.");
      setCodigo("");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Código inválido.",
      );
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Verificação em duas etapas</DialogTitle>
          <DialogDescription>
            Uma camada extra de segurança: além da senha, o login pede um código
            do app autenticador (Google Authenticator, Authy…).
          </DialogDescription>
        </DialogHeader>

        {status.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : ativo ? (
          // ── 2FA ativo: opção de desativar (exige um código) ──────────────
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
              <ShieldCheck className="size-4 text-primary" />
              O 2FA está <strong>ativo</strong> nesta conta.
            </div>
            <Label htmlFor="codigo-off">
              Para desativar, informe um código atual
            </Label>
            <Input
              id="codigo-off"
              value={codigo}
              onChange={(e) => setCodigo(apenasDigitos(e.target.value))}
              placeholder="000000"
              inputMode="numeric"
              className="text-center text-lg tracking-[0.4em]"
            />
            <Button
              variant="destructive"
              onClick={confirmarDesativacao}
              disabled={codigo.length < 6 || desativar.isPending}
            >
              {desativar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldOff className="size-4" />
              )}
              Desativar 2FA
            </Button>
          </div>
        ) : setup ? (
          // ── Ativando: mostra QR + secret + confirma o primeiro código ────
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR no app autenticador:
            </p>
            {qr ? (
              <img
                src={qr}
                alt="QR Code do 2FA"
                className="rounded-md border border-border bg-white p-2"
                width={200}
                height={200}
              />
            ) : (
              <div className="flex size-[200px] items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Ou digite a chave manualmente:
              <br />
              <code className="break-all font-mono text-[11px]">
                {setup.secret}
              </code>
            </p>
            <div className="w-full space-y-2">
              <Label htmlFor="codigo-on">Código gerado pelo app</Label>
              <Input
                id="codigo-on"
                value={codigo}
                onChange={(e) => setCodigo(apenasDigitos(e.target.value))}
                placeholder="000000"
                inputMode="numeric"
                className="text-center text-lg tracking-[0.4em]"
              />
              <Button
                className="w-full"
                onClick={confirmarAtivacao}
                disabled={codigo.length < 6 || confirmar.isPending}
              >
                {confirmar.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Confirmar e ativar
              </Button>
            </div>
          </div>
        ) : (
          // ── Inativo: botão para começar ──────────────────────────────────
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              O 2FA está desativado. Recomendado para contas de administrador.
            </p>
            <Button onClick={iniciarAtivacao} disabled={iniciar.isPending}>
              {iniciar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Ativar 2FA
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
