import { useCallback, useEffect, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { corpoDaChamada, ehErroDeConexao } from "@/features/chamada/chamadaApi";
import {
  assinarFila,
  chamadasPendentes,
  removerChamada,
} from "@/lib/offlineQueue";

// Evita duas sincronizações simultâneas (ex.: evento "online" + flush inicial).
let emAndamento = false;

function jaSalvaNoServidor(e: unknown): boolean {
  return (
    e instanceof ApiError &&
    typeof e.message === "string" &&
    e.message.toLowerCase().includes("já foram salvas")
  );
}

// Tenta enviar todas as chamadas da fila. Para no primeiro erro de conexão
// (segue offline). Remove itens já salvos no servidor e reporta erros de
// negócio para não travar a fila indefinidamente.
export async function sincronizarChamadas(
  qc: QueryClient,
): Promise<{ enviadas: number }> {
  if (emAndamento) return { enviadas: 0 };
  emAndamento = true;
  let enviadas = 0;
  try {
    for (const chamada of chamadasPendentes()) {
      try {
        await apiPost(ApiRotas.presencaBatchCreate, corpoDaChamada(chamada));
        removerChamada(chamada.aulaId);
        enviadas++;
      } catch (e) {
        if (ehErroDeConexao(e)) break; // sem internet: tenta de novo depois
        if (jaSalvaNoServidor(e)) {
          removerChamada(chamada.aulaId); // idempotência: já estava salva
          continue;
        }
        // Erro de negócio/validação: remove para não travar e avisa.
        removerChamada(chamada.aulaId);
        toast.error(
          e instanceof ApiError
            ? e.message
            : "Falha ao sincronizar uma chamada.",
        );
      }
    }
    if (enviadas > 0) {
      qc.invalidateQueries({ queryKey: ["aulas"] });
      qc.invalidateQueries({ queryKey: ["presencas"] });
      toast.success(
        enviadas === 1
          ? "1 chamada sincronizada."
          : `${enviadas} chamadas sincronizadas.`,
      );
    }
  } finally {
    emAndamento = false;
  }
  return { enviadas };
}

// Estado de conexão + fila offline para a UI, com sincronização automática ao
// voltar a internet.
export function useOfflineSync() {
  const qc = useQueryClient();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pendentes, setPendentes] = useState(() => chamadasPendentes().length);
  const [sincronizando, setSincronizando] = useState(false);

  const sincronizarAgora = useCallback(async () => {
    if (!navigator.onLine || chamadasPendentes().length === 0) return;
    setSincronizando(true);
    try {
      await sincronizarChamadas(qc);
    } finally {
      setSincronizando(false);
    }
  }, [qc]);

  useEffect(() => {
    const atualizarPendentes = () => setPendentes(chamadasPendentes().length);
    const cancelar = assinarFila(atualizarPendentes);

    const aoFicarOnline = () => {
      setOnline(true);
      void sincronizarAgora();
    };
    const aoFicarOffline = () => setOnline(false);

    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);

    // Flush inicial (app aberto já com internet e fila pendente).
    void sincronizarAgora();

    return () => {
      cancelar();
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
    };
  }, [sincronizarAgora]);

  return { online, pendentes, sincronizando, sincronizarAgora };
}
