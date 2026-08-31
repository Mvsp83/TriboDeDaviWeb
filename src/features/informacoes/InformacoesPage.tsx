import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Info, ChevronDown, MapPin, ClipboardList, ArrowRight } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import type { LinkFaq } from "@/features/site/conteudoSite";
import { MolduraFaixa } from "@/components/MolduraFaixa";
import { ApiRotas } from "@/lib/apiRoutes";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { PaginaPublica } from "@/components/PaginaPublica";

// Âncora estável por índice — não depende do texto do título (editável).
const idCategoria = (i: number) => `cat-${i}`;

// Reconhece a categoria de polos pelo título (para injetar a lista dinâmica).
const ehCategoriaPolos = (titulo: string) =>
  titulo.toLowerCase().startsWith("polos");

// ── Polos do cadastro (dinâmico, endpoint público) ───────────────────────────
interface HorarioTurmaPub {
  turma: number;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}
interface ProfessorPub {
  nome: string | null;
  faixa: number | null;
  foto: string;
}
interface PoloPub {
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  informacoes: string;
  horarios: HorarioTurmaPub[];
  professores: ProfessorPub[];
}

const DIA_CURTO: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

function agruparPorTurma(horarios: HorarioTurmaPub[]) {
  const mapa = new Map<number, HorarioTurmaPub[]>();
  for (const h of [...horarios].sort((a, b) => a.diaSemana - b.diaSemana)) {
    const lista = mapa.get(h.turma) ?? [];
    lista.push(h);
    mapa.set(h.turma, lista);
  }
  return [...mapa.entries()].sort(([a], [b]) => a - b);
}

function PolosCadastrados() {
  // fetch puro (sem o interceptor do axios) — página pública não pode ser
  // redirecionada ao /login se a API responder 401/erro.
  const { data: polos = [], isLoading } = useQuery({
    queryKey: ["polos-publicos"],
    queryFn: async (): Promise<PoloPub[]> => {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const res = await fetch(`${base}${ApiRotas.polosPublicos}`);
        if (!res.ok) return [];
        const json = await res.json();
        const lista = (json?.data as PoloPub[]) ?? [];
        // Garante os arrays mesmo com API antiga (sem o campo professores).
        return lista.map((p) => ({
          ...p,
          horarios: p.horarios ?? [],
          professores: p.professores ?? [],
        }));
      } catch {
        return [];
      }
    },
  });

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (polos.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Os polos aparecerão aqui assim que forem cadastrados.
      </p>
    );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {polos.map((p) => (
        <div key={p.nome} className="rounded-lg border border-border bg-background p-4">
          <h4 className="flex items-center gap-1.5 font-semibold text-foreground">
            <MapPin className="size-4 shrink-0 text-primary" />
            {p.nome}
          </h4>
          {(p.endereco || p.bairro || p.cidade) && (
            <p className="mt-1 text-xs">
              {[p.endereco, p.bairro, p.cidade].filter(Boolean).join(", ")}
            </p>
          )}
          {p.informacoes && <p className="mt-1 text-xs">{p.informacoes}</p>}
          {p.horarios.length > 0 && (
            <div className="mt-2 space-y-0.5 border-t border-border pt-2 text-xs">
              {agruparPorTurma(p.horarios).map(([turma, hs]) => (
                <p key={turma}>
                  <span className="font-medium text-foreground">Turma {turma}:</span>{" "}
                  {hs
                    .map((h) => {
                      const hora = h.horaInicio
                        ? `${h.horaInicio}${h.horaFim ? `–${h.horaFim}` : ""}`
                        : "horário a definir";
                      return `${DIA_CURTO[h.diaSemana]} ${hora}`;
                    })
                    .join(" · ")}
                </p>
              ))}
            </div>
          )}
          {p.professores.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-foreground">Professores</p>
              <div className="flex flex-wrap gap-3">
                {p.professores.map((prof, i) => (
                  <div key={i} className="flex w-16 flex-col items-center gap-1 text-center">
                    <MolduraFaixa
                      foto={prof.foto}
                      faixa={prof.faixa}
                      tamanho={64}
                      alt={prof.nome ?? "Professor"}
                    />
                    {prof.nome && (
                      <span className="w-full truncate text-[11px] leading-tight text-muted-foreground">
                        {prof.nome}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Botão de link da resposta: leva à parte certa do site ou a um endereço externo.
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

// Página pública de Informações em formato de FAQ. A categoria de polos ganha,
// no fim, uma pergunta com a lista dos polos cadastrados (dados do cadastro).
export function InformacoesPage() {
  useDocumentTitle(`Informações — ${SITE.nome}`);
  const { informacoes } = SITE;

  const categorias = informacoes.categorias.filter(
    (c) => c.perguntas.length > 0,
  );

  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const alternar = (chave: string) =>
    setAbertas((atual) => {
      const proxima = new Set(atual);
      if (proxima.has(chave)) proxima.delete(chave);
      else proxima.add(chave);
      return proxima;
    });

  const secoes = categorias.map((c, i) => ({
    id: idCategoria(i),
    label: c.titulo,
  }));

  function ItemPergunta({
    chave,
    pergunta,
    children,
  }: {
    chave: string;
    pergunta: string;
    children: React.ReactNode;
  }) {
    const aberta = abertas.has(chave);
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <button
          type="button"
          onClick={() => alternar(chave)}
          aria-expanded={aberta}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium hover:text-primary"
        >
          <span>{pergunta}</span>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${
              aberta ? "rotate-180" : ""
            }`}
          />
        </button>
        {aberta && (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            {children}
          </div>
        )}
      </div>
    );
  }

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
        {categorias.length === 0 ? (
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
                  {cat.perguntas.map((p, qi) => (
                    <ItemPergunta key={qi} chave={`${ci}-${qi}`} pergunta={p.pergunta}>
                      <p className="whitespace-pre-line">{p.resposta}</p>
                      {p.link && <LinkResposta link={p.link} />}
                    </ItemPergunta>
                  ))}

                  {/* Lista dinâmica dos polos, na categoria de polos. */}
                  {ehCategoriaPolos(cat.titulo) && (
                    <ItemPergunta
                      chave={`polos-${ci}`}
                      pergunta="Quais são os polos e seus endereços?"
                    >
                      <PolosCadastrados />
                    </ItemPergunta>
                  )}
                </div>
              </div>
            ))}
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
