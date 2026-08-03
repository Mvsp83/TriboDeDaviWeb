import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ImportacaoPage() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Construction className="size-7" />
        </div>
        <h2 className="text-lg font-semibold">Importação</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Esta funcionalidade está em desenvolvimento.
        </p>
      </CardContent>
    </Card>
  );
}
