import { DocumentosContabeisPage } from "@/features/administrativo/DocumentosContabeisPage";
import { CategoriaDocumento } from "@/types";

// Modelos de documentos oficiais da ONG (estatuto, atas, formulários, etc.).
// Reutiliza o gerenciador de documentos do Drive, apontando para a categoria
// "Modelos" (subpasta criada automaticamente pela API no primeiro upload).
export function DocumentosPage() {
  return (
    <DocumentosContabeisPage
      categoria={CategoriaDocumento.Modelos}
      titulo="Modelos de Documentos"
      descricao="Documentos oficiais da ONG — envie, baixe e organize os arquivos."
    />
  );
}
