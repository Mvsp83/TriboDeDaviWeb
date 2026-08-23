import { useEffect } from "react";

// Ajusta o <title> da aba conforme a página. Num SPA o título não muda sozinho
// ao navegar; um título específico ajuda leitores de tela (que o anunciam na
// troca de rota) e a partilha/SEO das páginas públicas. Restaura o anterior ao
// sair, para não "vazar" o título de uma tela para outra.
export function useDocumentTitle(titulo: string): void {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo;
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
