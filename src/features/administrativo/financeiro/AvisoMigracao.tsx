import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Database, Download, Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  baixarCopiaLocal,
  importarParaApi,
  jaMigrou,
  lerCargaLocal,
  marcarMigrado,
} from "./migracaoFinanceiro";

// Aparece só para quem tem dados financeiros antigos guardados no navegador,
// oferecendo enviá-los para o servidor (onde entram no backup e passam a ser
// vistos por toda a administração).
export function AvisoMigracao() {
  const qc = useQueryClient();
  const [carga] = useState(() => (jaMigrou() ? null : lerCargaLocal()));
  const [oculto, setOculto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!carga || oculto) return null;

  async function enviar() {
    if (!carga) return;
    setEnviando(true);
    try {
      const r = await importarParaApi(carga);
      marcarMigrado();
      qc.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success(r.mensagem ?? "Dados enviados com sucesso!");
      setOculto(true);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar os dados. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium">Dados financeiros guardados neste navegador</p>
          <p className="text-sm text-muted-foreground">
            Encontramos <strong>{carga.contas.length} conta(s)</strong> e{" "}
            <strong>{carga.movimentacoes.length} lançamento(s)</strong> salvos apenas
            aqui. Envie para o servidor para que entrem no backup e fiquem visíveis
            para toda a administração.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={enviar} disabled={enviando}>
              {enviando && <Loader2 className="size-4 animate-spin" />}
              Enviar para o servidor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => baixarCopiaLocal(carga)}
              disabled={enviando}
            >
              <Download className="size-4" />
              Baixar cópia
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A cópia local só é apagada por você — nada é removido do navegador
            durante o envio.
          </p>
        </div>
        <button
          onClick={() => setOculto(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Fechar aviso"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
