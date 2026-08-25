import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Versão do portal web (exibida no "Sobre o Aplicativo").
const VERSAO_APP = "1.0.0";

// Crédito "Desenvolvido por eMeVe ©" — botão que abre o diálogo "Sobre o
// Aplicativo" (logo, versão e contato). Mesmo comportamento no login da equipe
// e no rodapé do site público.
export function SobreApp({ className }: { className?: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={className ?? "transition-colors hover:text-foreground"}
      >
        Desenvolvido por eMeVe ©
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">Sobre o Aplicativo</DialogTitle>
            <DialogDescription className="sr-only">
              Informações sobre o desenvolvimento do aplicativo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-1 text-center text-sm text-muted-foreground">
            <span>Desenvolvido por</span>
            <img src="/emeve.png" alt="eMeVe" className="h-20 w-auto" />
            <span>Versão {VERSAO_APP}</span>
            <div className="pt-1">
              <p>Dúvidas e sugestões</p>
              <a
                href="mailto:marcusviniciussp.dev@gmail.com"
                className="text-primary hover:underline"
              >
                marcusviniciussp.dev@gmail.com
              </a>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                Fechar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
