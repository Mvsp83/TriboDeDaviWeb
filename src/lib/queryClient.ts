import { QueryClient } from "@tanstack/react-query";

// Cache retido por 7 dias (gcTime) para que o snapshot persistido em
// localStorage (ver main.tsx) sirva os dados offline. staleTime curto mantém
// os dados atualizados quando há conexão.
const SETE_DIAS = 1000 * 60 * 60 * 24 * 7;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: SETE_DIAS,
    },
  },
});
