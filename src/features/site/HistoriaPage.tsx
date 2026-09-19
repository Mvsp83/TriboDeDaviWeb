import { SITE } from "@/features/site/conteudoSite";
import { PaginaSite } from "@/components/site/PecasSite";
import { FotoSite } from "@/components/site/FotoSite";
import { BotaoSite } from "@/components/site/ElementosSite";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

// Nossa história. O texto vem de conteudoSite (linhas "## " viram títulos).
// A leitura ganha uma trilha lateral fixa com os capítulos: em um texto longo,
// saber onde se está reduz a sensação de parede de texto.
export function HistoriaPage() {
  useDocumentTitle(`Nossa história — ${SITE.nome}`);
  const fundacao = SITE.numeros.desde || 2013;
  const anoAtual = new Date().getFullYear();

  const blocos = SITE.historia.map((p) => ({
    ehTitulo: p.startsWith("## "),
    texto: p.startsWith("## ") ? p.slice(3) : p,
  }));
  const capitulos = blocos.filter((b) => b.ehTitulo).map((b) => b.texto);
  const idDe = (t: string) =>
    "cap-" + t.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-");

  let n = 0;

  return (
    <PaginaSite
      titulo="Nossa história"
      etiqueta={`${fundacao} — ${anoAtual}`}
      subtitulo="Um sonho que virou missão — e, uma década depois, centenas de vidas."
      tituloDocumento={`Nossa história — ${SITE.nome}`}
    >
      {/* Capa em foto larga: a história começa com uma imagem, não com texto. */}
      <div className="relative h-[240px] border-b border-border md:h-[340px]">
        <FotoSite
          src="/historia.jpg"
          descricao={`foto de arquivo — primeira turma, ${fundacao}`}
          alt="Primeira turma do Instituto"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,var(--color-background)_4%,transparent_60%)]" />
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-[210px_1fr] md:px-8 md:py-16">
        {/* Trilha de capítulos — some no mobile, onde o scroll já é curto. */}
        <nav className="hidden md:block">
          <div className="sticky top-28">
            <p className="mb-4 font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Nesta página
            </p>
            {capitulos.map((c) => (
              <a
                key={c}
                href={`#${idDe(c)}`}
                className="block border-l-2 border-border py-2 pl-3.5 text-[13px] leading-snug text-muted-foreground transition-[color,border-color,padding] duration-[var(--dur-fast)] hover:border-primary hover:pl-5 hover:text-primary"
              >
                {c}
              </a>
            ))}
          </div>
        </nav>

        <article>
          {blocos.map((b, i) =>
            b.ehTitulo ? (
              <div key={i} className="revela scroll-mt-28" id={idDe(b.texto)}>
                <div className="mt-10 flex items-center gap-3.5 first:mt-0">
                  <span className="font-display text-sm font-semibold tabular-nums text-brand-red">
                    {String((n += 1)).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-2xl font-semibold uppercase leading-tight text-primary md:text-[1.7rem]">
                    {b.texto}
                  </h2>
                </div>
                <div className="revela-regua mt-1.5 h-0.5 bg-secondary" />
              </div>
            ) : (
              <p
                key={i}
                className="revela mt-4 text-pretty leading-[1.78] text-muted-foreground md:text-[1.02rem]"
              >
                {b.texto}
              </p>
            ),
          )}

          <div className="revela mt-12 rounded-2xl border border-border bg-card p-8">
            <p className="text-pretty font-display text-xl font-medium leading-snug md:text-2xl">
              “Esporte, fé e cidadania transformando vidas.”
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <BotaoSite to="/doar">Apoiar o projeto</BotaoSite>
              <BotaoSite to="/galeria" variante="contorno">
                Ver a galeria
              </BotaoSite>
            </div>
          </div>
        </article>
      </div>
    </PaginaSite>
  );
}
