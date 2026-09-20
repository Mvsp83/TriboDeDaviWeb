import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import type { LinkFaq } from "@/features/site/conteudoSite";
import { MolduraFaixa } from "@/components/MolduraFaixa";
import { ApiRotas } from "@/lib/apiRoutes";
import { PaginaSite, SecaoSite, ItemAcordeao } from "@/components/site/PecasSite";
import { BotaoSite } from "@/components/site/ElementosSite";

// Informações. Duas coisas que as famílias procuram: onde treinar e as dúvidas
// mais comuns. Polos vêm primeiro — é a pergunta mais frequente de todas.
// Visual do novo site; os dados são os reais do repo: polos do cadastro
// (endpoint público) e FAQ de conteudoSite (SITE.informacoes).

const idCategoria = (i: number) => `cat-${i}`;

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

function horarioDaTurma(hs: HorarioTurmaPub[]): string {
  return hs
    .map((h) => {
      const hora = h.horaInicio
        ? `${h.horaInicio}${h.horaFim ? `–${h.horaFim}` : ""}`
        : "horário a definir";
      return `${DIA_CURTO[h.diaSemana]} ${hora}`;
    })
    .join(" · ");
}

function usePolosPublicos() {
  // fetch puro (sem o interceptor do axios) — página pública não pode ser
  // redirecionada ao /login se a API responder 401/erro.
  return useQuery({
    queryKey: ["polos-publicos"],
    queryFn: async (): Promise<PoloPub[]> => {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const res = await fetch(`${base}${ApiRotas.polosPublicos}`);
        if (!res.ok) return [];
        const json = await res.json();
        const lista = (json?.data as PoloPub[]) ?? [];
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
}

function CardPolo({ p, i }: { p: PoloPub; i: number }) {
  const enderecoCompleto = [p.endereco, p.bairro, p.cidade]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
  const consultaMapa = [
    enderecoCompleto,
    /blumenau/i.test(enderecoCompleto) ? "SC" : "Blumenau, SC",
  ]
    .filter(Boolean)
    .join(", ");
  const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consultaMapa)}`;

  return (
    <div
      className={`revela-${(i % 3) + 1} rounded-2xl border border-border bg-card p-5 transition-[transform,border-color] duration-[var(--dur-base)] ease-[var(--ease-out-premium)] hover:-translate-y-1 hover:border-primary`}
    >
      <div className="flex items-center gap-2">
        <MapPin className="size-4 shrink-0 text-primary" />
        <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
          {p.nome}
        </h3>
      </div>

      {enderecoCompleto && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
          {enderecoCompleto}
        </p>
      )}
      {enderecoCompleto && (
        <a
          href={mapaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-[gap] duration-[var(--dur-fast)] hover:gap-3"
        >
          Ver no mapa
          <ArrowRight className="size-3.5" />
        </a>
      )}
      {p.informacoes && (
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {p.informacoes}
        </p>
      )}

      {p.horarios.length > 0 && (
        <div className="mt-3.5 flex flex-col gap-1 border-t border-border pt-3">
          {agruparPorTurma(p.horarios).map(([turma, hs]) => (
            <span
              key={turma}
              className="text-[13px] leading-relaxed text-muted-foreground"
            >
              <strong className="font-semibold text-foreground/80">
                Turma {turma}:
              </strong>{" "}
              {horarioDaTurma(hs)}
            </span>
          ))}
        </div>
      )}

      {p.professores.length > 0 && (
        <div className="mt-3.5 border-t border-border pt-3">
          <p className="mb-2 font-display text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Professores
          </p>
          <div className="flex flex-wrap gap-3">
            {p.professores.map((prof, k) => (
              <div key={k} className="flex w-16 flex-col items-center gap-1 text-center">
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
  );
}

// Link da resposta do FAQ (interno ou externo), no botão do site.
function LinkResposta({ link }: { link: LinkFaq }) {
  const classe =
    "mt-3.5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out-premium)] hover:-translate-y-0.5";
  const conteudo = (
    <>
      {link.label}
      <ArrowRight className="size-3.5" />
    </>
  );
  return link.externo ? (
    <a href={link.para} target="_blank" rel="noopener noreferrer" className={classe}>
      {conteudo}
    </a>
  ) : (
    <Link to={link.para} className={classe}>
      {conteudo}
    </Link>
  );
}

export function InformacoesPage() {
  const { informacoes } = SITE;
  const categorias = informacoes.categorias.filter((c) => c.perguntas.length > 0);
  const { data: polos = [], isLoading } = usePolosPublicos();

  // Âncora #enderecos ("Conheça os polos"/Davizinho): rola até a lista de polos.
  const location = useLocation();
  useEffect(() => {
    if (location.hash !== "#enderecos") return;
    requestAnimationFrame(() =>
      document
        .getElementById("enderecos")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [location]);

  return (
    <PaginaSite
      titulo="Perguntas frequentes"
      subtitulo={
        informacoes.intro ||
        "Reunimos aqui as principais dúvidas sobre o Instituto, as aulas, a inscrição e o acompanhamento dos alunos."
      }
      tituloDocumento={`Informações — ${SITE.nome}`}
      capa={
        categorias.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categorias.map((c, i) => (
              <a
                key={c.titulo}
                href={`#${idCategoria(i)}`}
                className="rounded-full border border-border px-4 py-2 text-[13px] text-muted-foreground transition-[transform,border-color,color] duration-[var(--dur-fast)] hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                {c.titulo}
              </a>
            ))}
          </div>
        )
      }
    >
      {/* Polos e horários (dados do cadastro) */}
      <section id="enderecos" className="scroll-mt-24 border-b border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-14">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-tight md:text-3xl">
            Polos e horários
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Escolha o polo mais próximo da sua casa.
          </p>

          {isLoading ? (
            <p className="mt-7 text-sm text-muted-foreground">Carregando…</p>
          ) : polos.length === 0 ? (
            <p className="mt-7 text-sm text-muted-foreground">
              Os polos aparecerão aqui assim que forem cadastrados.
            </p>
          ) : (
            <div className="mt-7 grid gap-3.5 md:grid-cols-2">
              {polos.map((p, i) => (
                <CardPolo key={p.nome} p={p} i={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ por categoria */}
      <SecaoSite>
        {categorias.map((cat, ci) => (
          <div key={ci} id={idCategoria(ci)} className="mb-9 scroll-mt-24">
            <h2 className="mb-3.5 font-display text-xl font-semibold uppercase tracking-tight text-primary md:text-2xl">
              {cat.titulo}
            </h2>
            {cat.perguntas.map((q, qi) => (
              <ItemAcordeao
                key={qi}
                pergunta={q.pergunta}
                aberturaInicial={ci === 0 && qi === 0}
              >
                <p className="whitespace-pre-line md:text-justify md:hyphens-auto">
                  {q.resposta}
                </p>
                {q.link && <LinkResposta link={q.link} />}
              </ItemAcordeao>
            ))}
          </div>
        ))}

        <div className="revela flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-[linear-gradient(115deg,var(--color-card)_55%,color-mix(in_oklab,var(--color-primary)_10%,var(--color-card))_100%)] px-7 py-6">
          <p className="font-display text-xl font-medium uppercase tracking-tight">
            Quer participar do projeto?
          </p>
          <BotaoSite to="/matricula">Fazer inscrição</BotaoSite>
        </div>
      </SecaoSite>
    </PaginaSite>
  );
}
