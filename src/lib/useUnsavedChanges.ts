import { useEffect } from "react";

// Avisa antes de fechar/recarregar a aba quando há alterações não salvas.
// (A confirmação na navegação interna é tratada no próprio editor.)
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
