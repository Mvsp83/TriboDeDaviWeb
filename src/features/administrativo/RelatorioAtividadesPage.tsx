import { useState } from "react";
import { Sparkles } from "lucide-react";
import { DocumentosContabeisPage } from "@/features/administrativo/DocumentosContabeisPage";
import { GerarRascunhoDialog } from "@/features/administrativo/GerarRascunhoDialog";
import { Button } from "@/components/ui/button";
import { CategoriaDocumento } from "@/types";

export function RelatorioAtividadesPage() {
  const [gerando, setGerando] = useState(false);

  return (
    <>
      <DocumentosContabeisPage
        categoria={CategoriaDocumento.RelatorioAtividades}
        titulo="Relatório de Atividades"
        descricao="Relatórios anuais montados pelo instituto. Armazene e baixe as versões de cada ano."
        acoesExtras={
          // Rascunho automático a partir dos dados do sistema (sem IA/custo).
          <Button
            variant="outline"
            onClick={() => setGerando(true)}
            title="Monta um rascunho a partir dos dados do sistema"
          >
            <Sparkles className="size-4" />
            Gerar rascunho
          </Button>
        }
      />
      <GerarRascunhoDialog aberto={gerando} onOpenChange={setGerando} />
    </>
  );
}
