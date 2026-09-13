import { BookOpen } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { PaginaPublica } from "@/components/PaginaPublica";

// Página "Nossa história" — o texto que antes ficava na home, agora numa tela
// própria acessível pelo menu, deixando a página inicial mais enxuta.
export function HistoriaPage() {
  const { historia } = SITE;
  useDocumentTitle(`Nossa história — ${SITE.nome}`);

  return (
    <PaginaPublica larguraMax="max-w-3xl">
      <section className="px-4 py-8 md:py-12">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold uppercase tracking-tight md:text-3xl">
          <BookOpen className="size-6 text-primary" />
          Nossa história
        </h1>

        {historia.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Em breve.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {historia.map((par, i) =>
              // Convenção do conteúdo: linhas iniciadas por "## " são subtítulos.
              par.startsWith("## ") ? (
                <h2
                  key={i}
                  className="pt-4 font-display text-lg font-semibold uppercase tracking-tight text-foreground md:text-xl"
                >
                  {par.slice(3)}
                </h2>
              ) : (
                <p
                  key={i}
                  className="text-justify text-pretty leading-relaxed text-muted-foreground"
                >
                  {par}
                </p>
              ),
            )}
          </div>
        )}
      </section>
    </PaginaPublica>
  );
}
