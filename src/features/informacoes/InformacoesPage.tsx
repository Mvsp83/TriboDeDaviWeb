import { Link } from "react-router-dom";
import {
  Info,
  MapPin,
  Clock,
  UserRound,
  ClipboardList,
} from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { PaginaPublica } from "@/components/PaginaPublica";

// Um id de âncora estável a partir do índice — evita depender do texto do
// título (que o instituto pode editar).
const idTopico = (i: number) => `topico-${i}`;

// Página pública de Informações: reúne, em divisões por assunto, tudo o que a
// família precisa saber (regras, uniforme, frequência...) e os polos com
// endereços/horários. Conteúdo curado em conteudoSite.ts.
export function InformacoesPage() {
  useDocumentTitle(`Informações — ${SITE.nome}`);
  const { informacoes, polos } = SITE;

  const topicos = informacoes.topicos.filter((t) => t.itens.length > 0);
  const temPolos = polos.length > 0;

  // Sub-navegação das divisões: cada tópico + a seção de polos.
  const secoes = [
    ...topicos.map((t, i) => ({ id: idTopico(i), label: t.titulo })),
    ...(temPolos ? [{ id: "polos", label: "Polos e endereços" }] : []),
  ];

  return (
    <PaginaPublica larguraMax="max-w-4xl">
      {/* Título + intro */}
      <section className="mx-auto max-w-4xl px-4 pb-6 pt-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
          <Info className="size-7 text-primary" />
          Informações
        </h1>
        {informacoes.intro && (
          <p className="mt-3 max-w-2xl text-muted-foreground">{informacoes.intro}</p>
        )}

        {/* Índice das divisões */}
        {secoes.length > 1 && (
          <nav className="mt-6 flex flex-wrap gap-2">
            {secoes.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </nav>
        )}
      </section>

      {/* Divisões por assunto */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        {secoes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Em breve — as informações do projeto aparecerão aqui.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {topicos.map((t, i) => (
              <div key={i} id={idTopico(i)} className="scroll-mt-6">
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {t.titulo}
                </h2>
                <ul className="mt-4 flex flex-col gap-2">
                  {t.itens.map((item, j) => (
                    <li key={j} className="flex gap-2 text-muted-foreground">
                      <span className="mt-0.5 text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {temPolos && (
              <div id="polos" className="scroll-mt-6">
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                  Polos e endereços
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {polos.map((polo) => (
                    <div key={polo.nome} className="rounded-xl border border-border bg-card p-5">
                      <h3 className="flex items-center gap-2 font-semibold">
                        <MapPin className="size-4 text-primary" />
                        {polo.nome}
                      </h3>
                      {polo.endereco && (
                        <p className="mt-1.5 text-sm text-muted-foreground">{polo.endereco}</p>
                      )}
                      {polo.horarios && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="size-3.5" />
                          {polo.horarios}
                        </p>
                      )}
                      {polo.responsavel && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <UserRound className="size-3.5" />
                          {polo.responsavel}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Chamada de inscrição */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="font-medium">Quer que seu filho participe?</p>
          <Button asChild>
            <Link to="/matricula">
              <ClipboardList className="size-4" />
              Fazer inscrição
            </Link>
          </Button>
        </div>
      </section>

    </PaginaPublica>
  );
}
