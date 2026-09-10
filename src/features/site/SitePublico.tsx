import { Link } from "react-router-dom";
import { HeartHandshake, ArrowRight, BookOpen } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { useEstatisticasSite } from "@/features/site/siteApi";
import { VersiculoDoDia } from "@/components/VersiculoDoDia";
import { CabecalhoSite } from "@/components/site/CabecalhoSite";
import { RodapeSite } from "@/components/site/RodapeSite";
import { MarcaTribo } from "@/components/site/MarcaTribo";
import { BotaoVoltarAoTopo } from "@/components/BotaoVoltarAoTopo";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";

// Faixas do jiu-jitsu infantil, com cores mais vivas para o herói do site.
// `ponta` = cor do friso (onde ficam os graus); a preta tem ponta vermelha,
// como a faixa preta real.
const FAIXAS: { nome: string; cor: string; ponta?: string }[] = [
  { nome: "Branca", cor: "#fbfbfa" },
  { nome: "Cinza", cor: "#9aa1ac" },
  { nome: "Amarela", cor: "#ffd60a" },
  { nome: "Laranja", cor: "#ff7a1a" },
  { nome: "Verde", cor: "#17c34a" },
  { nome: "Azul", cor: "#2563ff" },
  { nome: "Roxa", cor: "#9327ff" },
  { nome: "Marrom", cor: "#7a3d15" },
  { nome: "Preta", cor: "#161618", ponta: "#e11d2a" },
];

// Uma faixa "realista": barra com brilho de couro, friso (ponta) e 4 graus.
// Tudo em CSS, sem imagens.
function FaixaBelt({
  nome,
  cor,
  ponta = "#141416",
}: {
  nome: string;
  cor: string;
  ponta?: string;
}) {
  const relevo = (c: string) =>
    `linear-gradient(180deg, color-mix(in srgb, ${c} 78%, #fff) 0%, ${c} 46%, color-mix(in srgb, ${c} 82%, #000) 100%)`;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative h-6 w-full overflow-hidden rounded-[3px] shadow-md ring-1 ring-black/25"
        style={{ background: relevo(cor) }}
      >
        {/* Friso com os 4 graus */}
        <div
          className="absolute inset-y-0 right-1.5 flex w-[30%] items-center justify-evenly px-1"
          style={{ background: relevo(ponta) }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-full w-[2px] rounded-[1px] bg-white/90"
            />
          ))}
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{nome}</span>
    </div>
  );
}

// Site público do instituto: apresenta o projeto, recebe doações e dá acesso
// ao portal. É a página que qualquer pessoa vê ao abrir o endereço.
export function SitePublico() {
  const { numeros, historia } = SITE;
  const anoAtual = new Date().getFullYear();
  useDocumentTitle(`${SITE.nome} — Jiu-jitsu gratuito para crianças`);

  // Números reais do banco (crianças atendidas e polos); cai no valor estático
  // de conteudoSite enquanto carrega ou se a API não responder.
  const { data: estatisticas } = useEstatisticasSite();
  const totalAlunos = estatisticas?.alunos ?? numeros.alunos;
  const totalPolos = estatisticas?.polos ?? numeros.polos;

  return (
    <div className="site-publico min-h-svh bg-background text-foreground">
      {/* Pular para o conteúdo — visível só ao navegar por teclado. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <CabecalhoSite />

      {/* Herói */}
      <section
        id="conteudo"
        tabIndex={-1}
        className="relative overflow-hidden outline-none"
        style={{
          background:
            "linear-gradient(115deg, var(--color-background) 58%, color-mix(in oklab, var(--color-brand-red) 14%, var(--color-background)) 100%)",
        }}
      >
        {/* Barra diagonal dourado → vermelho da faixa */}
        <div className="absolute left-0 top-20 hidden h-56 w-1.5 bg-gradient-to-b from-primary to-brand-red md:block" />

        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:py-16">
          <div className="animate-page-enter">
            <span className="inline-flex bg-primary px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
              Projeto social cristão · Jiu-jitsu · Desde {numeros.desde || 2013}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold uppercase leading-[0.98] md:text-6xl lg:text-7xl">
              {SITE.chamada}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
              {SITE.subChamada}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/doar">
                  <HeartHandshake className="size-5" />
                  Fazer uma doação
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/informacoes">Conheça os polos</Link>
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <div className="border-l-4 border-primary bg-card px-4 py-3">
                <div className="font-display text-3xl font-bold leading-none text-primary">
                  {totalAlunos}
                </div>
                <div className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
                  alunos atendidos
                </div>
              </div>
              <div className="border-l-4 border-brand-red bg-card px-4 py-3">
                <div className="font-display text-3xl font-bold leading-none">
                  {totalPolos}
                </div>
                <div className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
                  polos
                </div>
              </div>
              {numeros.desde > 0 && (
                <div className="border-l-4 border-brand-red bg-card px-4 py-3">
                  <div className="font-display text-3xl font-bold leading-none">
                    +{anoAtual - numeros.desde}
                  </div>
                  <div className="font-display text-[11px] uppercase tracking-wider text-muted-foreground">
                    anos
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Símbolo do instituto como marca central (desktop) */}
          <div className="relative hidden min-h-[360px] items-center justify-center md:flex">
            <div
              className="absolute size-[420px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(225,29,42,0.28), rgba(245,197,24,0.10) 45%, transparent 70%)",
              }}
            />
            <MarcaTribo className="marca-flutua relative w-[320px] text-primary" />
          </div>
        </div>

        {/* Faixas: da branca à preta */}
        <div className="mx-auto max-w-5xl px-4 pb-14 text-center md:pb-20">
          <p className="mb-3 font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Da faixa branca à preta
          </p>
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-9 sm:gap-x-1.5">
            {FAIXAS.map((f) => (
              <FaixaBelt
                key={f.nome}
                nome={f.nome}
                cor={f.cor}
                ponta={f.ponta}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Versículo do dia */}
      <section className="mx-auto max-w-3xl px-4 pt-12 md:pt-16">
        <VersiculoDoDia />
      </section>

      {/* Pilares */}
      <section className="mx-auto max-w-5xl px-4 py-14 md:py-20">
        <h2 className="font-display text-2xl font-semibold uppercase tracking-tight md:text-3xl">
          O que o projeto faz
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {SITE.pilares.map((p) => (
            <div
              key={p.titulo}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-semibold">{p.titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* História */}
      {historia.length > 0 && (
        <section id="historia" className="scroll-mt-6 border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
            <h2 className="flex items-center gap-2 font-display text-2xl font-semibold uppercase tracking-tight md:text-3xl">
              <BookOpen className="size-6 text-primary" />
              Nossa história
            </h2>
            <div className="mt-6 space-y-4">
              {historia.map((par, i) => (
                <p
                  key={i}
                  className="text-justify text-pretty leading-relaxed text-muted-foreground"
                >
                  {par}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Doação — no fundo mais claro, em destaque */}
      <section className="border-t border-border bg-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-14 md:py-20">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-10">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-tight md:text-3xl">
              Ajude a manter as aulas gratuitas
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              O instituto se mantém com doações. Sua contribuição paga quimono,
              faixa, tatame e o transporte das crianças para as competições — e é
              por Pix, sem taxas.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/doar">
                <HeartHandshake className="size-5" />
                Doar por Pix
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <RodapeSite />

      {/* Fica acima do assistente flutuante (bottom-4). */}
      <BotaoVoltarAoTopo className="bottom-20" />
    </div>
  );
}
