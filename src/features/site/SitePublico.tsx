import { Link } from "react-router-dom";
import { HeartHandshake, ArrowRight, ArrowUpRight } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { useEstatisticasSite } from "@/features/site/siteApi";
import { registrarEvento } from "@/features/metricas/metricaApi";
import { VersiculoDoDia } from "@/components/VersiculoDoDia";
import { CabecalhoSite } from "@/components/site/CabecalhoSite";
import { RodapeSite } from "@/components/site/RodapeSite";
import { MarcaTribo } from "@/components/site/MarcaTribo";
import { FotoSite } from "@/components/site/FotoSite";
import {
  TrilhaFaixas,
  LetreiroValores,
  BotaoSite,
} from "@/components/site/ElementosSite";
import { BotaoVoltarAoTopo } from "@/components/BotaoVoltarAoTopo";
import { useContador } from "@/lib/useContador";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

// Um número do herói: conta de 0 até o valor quando entra em tela.
function NumeroHeroi({
  alvo,
  antes,
  depois,
  destaque,
}: {
  alvo: number;
  antes?: string;
  depois: string;
  destaque?: boolean;
}) {
  const { ref, valor } = useContador(alvo);
  return (
    <div
      ref={ref}
      className="relative px-8 py-8 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-brand-red data-[destaque=true]:before:bg-primary"
      data-destaque={destaque}
    >
      {antes && (
        <div className="font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {antes}
        </div>
      )}
      <div
        className={`font-display text-5xl font-bold leading-none tabular-nums md:text-6xl ${
          destaque ? "text-primary" : "text-foreground"
        }`}
      >
        {valor}
      </div>
      <div className="mt-1 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {depois}
      </div>
    </div>
  );
}

// Site público do instituto: apresenta o projeto, recebe doações e dá acesso
// ao portal. É a página que qualquer pessoa vê ao abrir o endereço.
export function SitePublico() {
  const { numeros, historia, pilares } = SITE;
  const anoAtual = new Date().getFullYear();
  const fundacao = numeros.desde || 2013;
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

      {/* ── Herói ──────────────────────────────────────────────────────────
          Foto de fundo com parallax (o fundo sobe enquanto a página desce),
          dois véus de gradiente para garantir contraste do texto sobre
          qualquer foto, e o filete dourado→vermelho da marca na lateral. */}
      <section
        id="conteudo"
        tabIndex={-1}
        className="relative flex min-h-[560px] items-end overflow-hidden outline-none md:min-h-[640px]"
      >
        <div className="absolute inset-0">
          <div className="parallax-heroi absolute -inset-[8%]">
            <FotoSite
              src="/heroi.jpg"
              descricao="foto do treino — plano aberto no tatame"
              alt="Crianças treinando jiu-jitsu no tatame do Instituto"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-background)_8%,color-mix(in_oklab,var(--color-background)_92%,transparent)_44%,transparent_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--color-background)_0%,transparent_42%)]" />
        </div>

        <div className="absolute left-0 top-24 hidden h-60 w-1.5 origin-top bg-gradient-to-b from-primary to-brand-red md:block" />

        <div className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-24 md:px-8">
          <span className="entra-curto inline-flex bg-primary px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
            Projeto social cristão · Jiu-jitsu · Desde {fundacao}
          </span>
          <h1 className="entra atraso-1 mt-5 max-w-3xl text-balance font-display text-5xl font-bold uppercase leading-[0.96] md:text-7xl">
            Jiu-Jitsu que transforma{" "}
            <span className="text-brand-red">vidas</span>, Propósito que
            transforma <span className="text-primary">histórias</span>
          </h1>
          <p className="entra atraso-2 mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            Aulas 100% gratuitas para crianças, adolescentes e adultos em{" "}
            {SITE.contato.cidade || "Blumenau/SC"}. Disciplina, respeito e
            acolhimento — dentro e fora do tatame.
          </p>
          <div className="entra atraso-3 mt-9 flex flex-wrap gap-3">
            <BotaoSite to="/matricula">
              Quero me inscrever
              <ArrowRight className="size-4" />
            </BotaoSite>
            <BotaoSite to="/informacoes#enderecos" variante="contorno">
              Conheça os polos
            </BotaoSite>
          </div>
        </div>
      </section>

      {/* ── Números ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <NumeroHeroi
          alvo={totalAlunos}
          antes="Atualmente são"
          depois="alunos atendidos"
          destaque
        />
        <NumeroHeroi alvo={totalPolos} antes="Em" depois="polos" />
        <NumeroHeroi
          alvo={anoAtual - fundacao}
          antes="Há mais de"
          depois="anos transformando histórias"
        />
      </div>

      {/* ── Faixas ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-20">
        <TrilhaFaixas />
      </section>

      {/* ── Pilares ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-8 md:pb-20">
        <h2 className="font-display text-2xl font-semibold uppercase tracking-tight md:text-3xl">
          O que fazemos
        </h2>
        <div className="revela-regua mt-2 h-[3px] w-20 bg-brand-red" />
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {pilares.map((p, i) => (
            <div
              key={p.titulo}
              className={`revela-${
                (i % 3) + 1
              } group rounded-xl border border-border bg-card p-6 transition-[transform,border-color,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-premium)] hover:-translate-y-1.5 hover:border-primary`}
            >
              <div className="font-display text-4xl font-bold leading-none text-secondary">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold uppercase tracking-tight text-primary">
                {p.titulo}
              </h3>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
                {p.texto}
              </p>
            </div>
          ))}
        </div>
      </section>

      <LetreiroValores />

      {/* ── Versículo ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 md:py-20">
        <VersiculoDoDia className="revela" />
      </section>

      {/* ── História ─────────────────────────────────────────────────────── */}
      {historia.length > 0 && (
        <section className="grid border-y border-border md:grid-cols-2">
          <div className="relative min-h-[280px] md:min-h-[420px]">
            <FotoSite
              src="/historia.jpg"
              descricao="foto de arquivo — primeira turma"
              alt="Primeira turma do Instituto Tribo de Davi"
              posicaoLegenda="centro"
            />
          </div>
          <div className="revela flex flex-col justify-center px-4 py-14 md:px-12 md:py-16">
            <span className="font-mono text-xs tracking-[0.16em] text-primary">
              {fundacao} → hoje
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold uppercase leading-tight tracking-tight md:text-4xl">
              Um sonho que virou missão
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Nascemos em {SITE.contato.cidade || "Blumenau/SC"} com a missão de
              abrir oportunidades pelo esporte, pela cultura e pela assistência
              social. Mais de uma década depois, centenas de alunos já passaram
              pelos nossos tatames.
            </p>
            <Link
              to="/historia"
              className="mt-7 inline-flex w-fit items-center gap-2 border-b-2 border-primary pb-1.5 font-display text-sm font-semibold uppercase tracking-[0.12em] transition-[gap,color] duration-[var(--dur-fast)] hover:gap-4 hover:text-primary"
            >
              Conheça nossa história
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Doação ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[linear-gradient(115deg,var(--color-background)_52%,color-mix(in_oklab,var(--color-brand-red)_16%,var(--color-background))_100%)]">
        <MarcaTribo className="marca-flutua pointer-events-none absolute -right-16 top-1/2 hidden w-[380px] -translate-y-1/2 text-primary opacity-10 md:block" />
        <div className="revela relative mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
          <h2 className="max-w-2xl font-display text-3xl font-bold uppercase leading-[1.02] md:text-5xl">
            Ajude-nos a continuar{" "}
            <span className="text-primary">transformando vidas</span>
          </h2>
          <p className="mt-5 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            O instituto se mantém através de doações. Cada contribuição amplia o
            número de crianças que conseguimos atender.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BotaoSite to="/doar" onClick={() => registrarEvento("doar_click")}>
              <HeartHandshake className="size-5" />
              Doar por Pix
            </BotaoSite>
            <BotaoSite to="/transparencia" variante="contorno">
              Ver transparência
            </BotaoSite>
          </div>
        </div>
      </section>

      <RodapeSite />

      {/* Fica acima do assistente flutuante (bottom-4). */}
      <BotaoVoltarAoTopo className="bottom-20" />
    </div>
  );
}
