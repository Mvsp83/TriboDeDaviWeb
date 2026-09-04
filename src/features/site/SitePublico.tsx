import { Link } from "react-router-dom";
import {
  HeartHandshake,
  LogIn,
  ArrowRight,
  Users,
  BookOpen,
} from "lucide-react";
import { SITE, temInformacoes } from "@/features/site/conteudoSite";
import { VersiculoDoDia } from "@/components/VersiculoDoDia";
import { SobreApp } from "@/components/SobreApp";
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

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  if (!valor) return null;
  return (
    <div className="text-center">
      <div className="text-3xl font-bold tabular-nums text-primary md:text-4xl">
        {valor}
      </div>
      <div className="text-sm text-muted-foreground">{rotulo}</div>
    </div>
  );
}

// Site público do instituto: apresenta o projeto, recebe doações e dá acesso
// ao portal. É a página que qualquer pessoa vê ao abrir o endereço.
export function SitePublico() {
  const { numeros, historia } = SITE;
  const anoAtual = new Date().getFullYear();
  useDocumentTitle(`${SITE.nome} — Jiu-jitsu gratuito para crianças`);

  // Links de navegação — só aparecem para seções que têm conteúdo.
  // "Prestação de contas" saiu do menu: o assunto vive em Transparência.
  const secoes = [
    { id: "historia", label: "História", on: historia.length > 0 },
  ].filter((s) => s.on);

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Pular para o conteúdo — visível só ao navegar por teclado. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      {/* Topo */}
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-5">
        <img src="/logo.png" alt={SITE.nome} className="h-14 w-auto md:h-20" />

        {/* Menu e acessos no mesmo grupo, alinhados à direita e na mesma linha. */}
        <div className="flex flex-1 flex-wrap items-center justify-center-safe gap-x-3 gap-y-2 md:flex-nowrap">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground md:flex-nowrap md:whitespace-nowrap">
            {secoes.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="transition-colors hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
            <Link
              to="/galeria"
              className="transition-colors hover:text-foreground"
            >
              Galeria
            </Link>
            <Link
              to="/loja"
              className="transition-colors hover:text-foreground"
            >
              Loja
            </Link>
            {temInformacoes() && (
              <Link
                to="/informacoes"
                className="transition-colors hover:text-foreground"
              >
                Informações
              </Link>
            )}
            <Link
              to="/transparencia"
              className="transition-colors hover:text-foreground"
            >
              Transparência
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {/* Famílias: acompanham o aluno com código + nascimento. */}
            <Button asChild size="sm">
              <Link to="/responsavel">
                <Users className="size-4" />
                Área do Responsável
              </Link>
            </Button>
            {/* Equipe: login com senha (admin/professor/supervisor). */}
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">
                <LogIn className="size-4" />
                Acesso da equipe
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Herói */}
      <section
        id="conteudo"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 pb-14 pt-6 outline-none md:pb-20 md:pt-10"
      >
        <div className="max-w-2xl">
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {SITE.chamada}
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground md:text-lg">
            {SITE.subChamada}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/doar">
                <HeartHandshake className="size-5" />
                Fazer uma doação
              </Link>
            </Button>
          </div>
        </div>

        {/* Faixas: centralizadas na seção. */}
        <div className="mt-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

      {/* Números */}
      {(numeros.alunos > 0 || numeros.polos > 0 || numeros.desde > 0) && (
        <section className="border-y border-border bg-secondary/30">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-10 px-4 py-8 md:gap-20">
            <Numero valor={numeros.alunos} rotulo="crianças atendidas" />
            <Numero valor={numeros.polos} rotulo="polos" />
            {numeros.desde > 0 && (
              <Numero
                valor={anoAtual - numeros.desde}
                rotulo="anos de projeto"
              />
            )}
          </div>
        </section>
      )}

      {/* Versículo do dia */}
      <section className="mx-auto max-w-3xl px-4 pt-12 md:pt-16">
        <VersiculoDoDia />
      </section>

      {/* Pilares */}
      <section className="mx-auto max-w-5xl px-4 py-14 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
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
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
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
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
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

      {/* Rodapé: só a linha e os dizeres. */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-xs text-muted-foreground">
          <span>
            © {anoAtual} {SITE.nome}
          </span>
          <SobreApp className="font-medium transition-colors hover:text-foreground" />
          <div className="flex items-center gap-x-6">
            <Link to="/responsavel" className="hover:text-foreground">
              Área do Responsável
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Acesso da equipe
            </Link>
          </div>
        </div>
      </footer>

      {/* Fica acima do assistente flutuante (bottom-4). */}
      <BotaoVoltarAoTopo className="bottom-20" />
    </div>
  );
}
