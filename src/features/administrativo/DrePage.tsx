import { DocumentosContabeisPage } from "@/features/administrativo/DocumentosContabeisPage";
import { CategoriaDocumento } from "@/types";

export function DrePage() {
  return (
    <DocumentosContabeisPage
      categoria={CategoriaDocumento.Dre}
      titulo="DRE"
      descricao="Demonstrativos de Resultado do Exercício enviados pela contabilidade a cada ano."
    />
  );
}
