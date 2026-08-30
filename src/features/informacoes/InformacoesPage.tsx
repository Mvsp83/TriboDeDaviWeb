import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Info,
  ChevronDown,
  MapPin,
  Clock,
  UserRound,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import type { LinkFaq } from "@/features/site/conteudoSite";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { PaginaPublica } from "@/components/PaginaPublica";

// Âncora estável por índice — não depende do texto do título (editável).
const idCategoria = (i: number) => `cat-${i}`;

// Botão de link da resposta: leva à parte certa do site (rota interna) ou a um
// endereço externo.
function LinkResposta({ link }: { link: LinkFaq }) {
  const conteudo = (
    <>
      {link.label}
      <ArrowRight className="size-4" />
    </>
  );
  return (
    <Button asChild variant="outline" size="sm" className="mt-3">
      {link.externo ? (
        <a href={link.para} target="_blank" rel="noopener noreferrer">
          {conteudo}
        </a>
      ) : (
        <Link to={link.para}>{conteudo}</Link>
      )}
    </Button>
  );
}

// Página pública de Informações em formato de FAQ: perguntas por assunto que
// abrem a resposta ao clicar e apontam para a parte certa do site. Conteúdo
// curado em conteudoSite.ts.
export function InformacoesPage() {
  useDocumentTitle(`Informações — ${SITE.nome}`);
  const { informacoes, polos } = SITE;

  const categorias = informacoes.categorias.filter(
    (c) => c.perguntas.length > 0,
  );
  const temPolos = polos.length > 0;

  // Perguntas abertas, por chave "categoria-pergunta". Várias podem ficar abertas.
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const alternar = (chave: string) =>
    setAbertas((atual) => {
      const proxima = new Set(atual);
      if (proxima.has(chave)) proxima.delete(chave);
      else proxima.add(chave);
      return proxima;
    });

  const secoes = [
    ...categorias.map((c, i) => ({ id: idCategoria(i), label: c.titulo })),
    ...(temPolos ? [{ id: "polos", label: "Polos e endereços" }] : []),
  ];

  return (
    <PaginaPublica larguraMax="max-w-4xl">
      {/* Título + intro */}
      <section className="mx-auto max-w-4xl px-4 pb-6 pt-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
          <Info className="size-7 text-primary" />
          Perguntas frequentes
        </h1>
        {informacoes.intro && (
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {informacoes.intro}
          </p>
        )}

        {/* Índice das categorias */}
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

      {/* FAQ por categoria */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        {secoes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Em breve — as informações do projeto aparecerão aqui.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {categorias.map((cat, ci) => (
              <div key={ci} id={idCategoria(ci)} className="scroll-mt-6">
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {cat.titulo}
                </h2>
                <div className="mt-4 flex flex-col gap-2">
                  {cat.perguntas.map((p, qi) => {
                    const chave = `${ci}-${qi}`;
                    const aberta = abertas.has(chave);
                    return (
                      <div
                        key={qi}
                        className="overflow-hidden rounded-xl border border-border bg-card"
                      >
                        <button
                          type="button"
                          onClick={() => alternar(chave)}
                          aria-expanded={aberta}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium hover:text-primary"
                        >
                          <span>{p.pergunta}</span>
                          <ChevronDown
                            className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                              aberta ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {aberta && (
                          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                            <p className="whitespace-pre-line">{p.resposta}</p>
                            {p.link && <LinkResposta link={p.link} />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {temPolos && (
              <div id="polos" className="scroll-mt-6">
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                  Polos e endereços
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {polos.map((polo) => (
                    <div
                      key={polo.nome}
                      className="rounded-xl border border-border bg-card p-5"
                    >
                      <h3 className="flex items-center gap-2 font-semibold">
                        <MapPin className="size-4 text-primary" />
                        {polo.nome}
                      </h3>
                      {polo.endereco && (
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {polo.endereco}
                        </p>
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
          <p className="font-medium">Quer participar do projeto?</p>
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
