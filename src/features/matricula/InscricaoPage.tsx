import { useState } from "react";
import { Users, User } from "lucide-react";
import { MatriculaPage } from "@/features/matricula/MatriculaPage";
import { MatriculaAdultoPage } from "@/features/matricula/MatriculaAdultoPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { PaginaPublica } from "@/components/PaginaPublica";

type Publico = "crianca" | "adulto";

// Ponto de entrada da inscrição: primeiro escolhe o público; depois renderiza a
// ficha certa. A ficha infantil (MatriculaPage) fica intacta; a de adultos é
// uma página própria.
export function InscricaoPage() {
  const [publico, setPublico] = useState<Publico | null>(null);
  useDocumentTitle("Inscrição — Instituto Tribo de Davi");

  if (publico === "crianca") return <MatriculaPage />;
  if (publico === "adulto")
    return <MatriculaAdultoPage onVoltar={() => setPublico(null)} />;

  return (
    <PaginaPublica larguraMax="max-w-lg">
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-center text-2xl font-bold tracking-tight">
          Fazer inscrição
        </h1>
        <p className="mt-2 text-center text-muted-foreground">
          Para quem é a inscrição?
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPublico("crianca")}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40"
          >
            <Users className="size-8 text-primary" />
            <span className="font-semibold">Criança ou adolescente</span>
            <span className="text-sm text-muted-foreground">
              Ficha com responsável, escola e dados da família.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPublico("adulto")}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/50 hover:bg-secondary/40"
          >
            <User className="size-8 text-primary" />
            <span className="font-semibold">Adulto</span>
            <span className="text-sm text-muted-foreground">
              Ficha própria, sem responsável.
            </span>
          </button>
        </div>

      </div>
    </PaginaPublica>
  );
}
