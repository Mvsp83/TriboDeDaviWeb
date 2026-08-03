import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Espaço reservado para módulos ainda não construídos. Passe `descricao` para
// explicar o que virá; sem ela, usa o texto padrão de migração.
export function PlaceholderPage({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Construction className="size-7" />
        </div>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {descricao ??
            "Este módulo ainda será migrado para o novo portal. A fatia inicial cobre Login, Dashboard e Alunos."}
        </p>
      </CardContent>
    </Card>
  );
}
