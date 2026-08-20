import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/AuthContext";
import { queryClient } from "@/lib/queryClient";
import App from "@/App";
import "@/index.css";

// Persiste o cache do Query em localStorage para que os dados necessários à
// chamada (alunos, aulas, polos, presenças) fiquem disponíveis offline. Só
// essas chaves são gravadas — dados administrativos/financeiros não vão para
// o disco.
const CHAVES_OFFLINE = ["alunos", "aulas", "polos", "presencas"];
const SETE_DIAS = 1000 * 60 * 60 * 24 * 7;

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
        maxAge: SETE_DIAS,
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
