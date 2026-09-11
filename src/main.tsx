import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { registerSW } from "virtual:pwa-register";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/AuthContext";
import { queryClient } from "@/lib/queryClient";
import App from "@/App";
import "@/index.css";

// Service worker (PWA): registra na inicialização e, além da checagem que o
// navegador já faz a cada carga, revalida de hora em hora enquanto a aba fica
// aberta. Com registerType "autoUpdate", achar uma versão nova troca o SW e
// recarrega sozinho — evita que a família fique presa numa versão antiga em
// cache. Sem UI de aviso (autoUpdate cuida de tudo).
const UMA_HORA = 60 * 60 * 1000;
registerSW({
  immediate: true,
  onRegisteredSW(_url, registro) {
    if (registro) setInterval(() => registro.update(), UMA_HORA);
  },
});

// Persiste o cache do Query em localStorage para que os dados necessários à
// chamada (alunos, aulas, polos, presenças) fiquem disponíveis offline. Só
// essas chaves são gravadas — dados administrativos/financeiros não vão para
// o disco.
const CHAVES_OFFLINE = ["alunos", "aulas", "polos", "presencas"];
// LGPD (minimização): o snapshot offline — que inclui dados de menores — expira
// em 48 h. Cobre o uso real (abrir online e usar sem internet na aula no mesmo
// dia ou no dia seguinte); passado o prazo, é descartado e refeito com rede.
const MAX_IDADE_CACHE = 1000 * 60 * 60 * 48;

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "tribo-query-cache",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: MAX_IDADE_CACHE,
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            q.state.status === "success" &&
            CHAVES_OFFLINE.includes(String(q.queryKey[0])),
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
);
