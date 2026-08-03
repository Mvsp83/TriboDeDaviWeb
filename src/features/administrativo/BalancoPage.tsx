import { DocumentosContabeisPage } from "@/features/administrativo/DocumentosContabeisPage";
import { CategoriaDocumento } from "@/types";

export function BalancoPage() {
  return (
    <DocumentosContabeisPage
      categoria={CategoriaDocumento.Balanco}
      titulo="Balanço"
      descricao="Balanços patrimoniais enviados pela contabilidade a cada ano."
    />
  );
}
