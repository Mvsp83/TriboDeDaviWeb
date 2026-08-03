import { Sparkles } from "lucide-react";
import { DocumentosContabeisPage } from "@/features/administrativo/DocumentosContabeisPage";
import { Button } from "@/components/ui/button";
import { CategoriaDocumento } from "@/types";

export function RelatorioAtividadesPage() {
  return (
    <DocumentosContabeisPage
      categoria={CategoriaDocumento.RelatorioAtividades}
      titulo="Relatório de Atividades"
      descricao="Relatórios anuais montados pelo instituto. Armazene e baixe as versões de cada ano."
      acoesExtras={
        // Geração assistida por IA a partir do relatório anterior — fase futura.
        <Button variant="outline" disabled title="Em breve">
          <Sparkles className="size-4" />
          Gerar novo com IA
        </Button>
      }
    />
  );
}
