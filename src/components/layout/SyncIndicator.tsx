import { CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useOfflineSync } from "@/lib/offlineSync";
import { Badge } from "@/components/ui/badge";

// Mostra o estado offline e a fila de chamadas aguardando sincronização.
// Some quando está online e não há nada pendente.
export function SyncIndicator() {
  const { online, pendentes, sincronizando, sincronizarAgora } = useOfflineSync();

  if (online && pendentes === 0 && !sincronizando) return null;

  if (!online) {
    return (
      <Badge variant="warning" className="gap-1.5">
        <CloudOff className="size-3.5" />
        Offline{pendentes > 0 ? ` · ${pendentes}` : ""}
      </Badge>
    );
  }

  if (sincronizando) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Loader2 className="size-3.5 animate-spin" />
        Sincronizando…
      </Badge>
    );
  }

  // Online com pendências — permite forçar a sincronização.
  return (
    <button
      type="button"
      onClick={() => void sincronizarAgora()}
      className="inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-2 py-1 text-xs font-medium text-warning transition-colors hover:bg-warning/25"
    >
      <RefreshCw className="size-3.5" />
      Sincronizar ({pendentes})
    </button>
  );
}
