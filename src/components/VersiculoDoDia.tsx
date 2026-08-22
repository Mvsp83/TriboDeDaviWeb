import { BookOpen } from "lucide-react";
import { versiculoDoDia } from "@/lib/versiculos";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Card do "versículo do dia" — determinístico pela data (ver versiculoDoDia).
// Reutilizado no dashboard, no portal do responsável e no site público.
export function VersiculoDoDia({ className }: { className?: string }) {
  const versiculo = versiculoDoDia();

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardContent className="flex gap-3 p-5">
        <BookOpen className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Versículo do dia
          </p>
          <p className="mt-1 text-pretty leading-relaxed">
            &ldquo;{versiculo.texto}&rdquo;
          </p>
          <p className="mt-1.5 text-sm font-medium text-muted-foreground">
            {versiculo.referencia}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
