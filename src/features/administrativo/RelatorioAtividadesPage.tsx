import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { DocumentosContabeisPage } from "@/features/administrativo/DocumentosContabeisPage";
import { Button } from "@/components/ui/button";
import { CategoriaDocumento } from "@/types";

export function RelatorioAtividadesPage() {
  const navigate = useNavigate();

  return (
    <DocumentosContabeisPage
      categoria={CategoriaDocumento.RelatorioAtividades}
      titulo="Relatório de Atividades"
      descricao="Relatórios anuais montados pelo instituto. Armazene e baixe as versões de cada ano."
      acoesExtras={
        // Modelo editável: reusa o layout, troca texto e fotos, gera o PDF.
        <Button
          variant="outline"
          onClick={() =>
            navigate("/administrativo/contabilidade/relatorio-atividades/modelo")
          }
          title="Monta o relatório a partir de um modelo editável (texto + fotos)"
        >
          <FileText className="size-4" />
          Montar pelo modelo
        </Button>
      }
    />
  );
}
