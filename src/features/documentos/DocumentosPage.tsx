import { FileText, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// No portal Blazor os arquivos ficavam no disco do próprio servidor
// (App_Data/documentos) — algo que não faz parte da API REST. Num SPA não há
// onde persistir os uploads, então esta tela depende de um endpoint de
// documentos ser adicionado à API antes de ser reconstruída.
export function DocumentosPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <FileText className="size-7" />
          </div>
          <h2 className="text-lg font-semibold">Modelos de Documentos</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Upload e download de documentos oficiais da ONG.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-5 text-sm">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">
              Pendente de endpoint na API
            </p>
            <p>
              No portal anterior os arquivos ficavam no disco do próprio
              servidor do portal, fora da API REST. Como este é um aplicativo de
              front-end (SPA), o armazenamento precisa ser exposto pela API
              (ex.: <code>upload</code>, <code>listar</code>,{" "}
              <code>download</code> e <code>excluir</code>) para que a tela seja
              reconstruída com segurança e os documentos fiquem disponíveis para
              todos os usuários.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
