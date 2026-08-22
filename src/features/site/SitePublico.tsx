import { Link } from "react-router-dom";
import {
  HeartHandshake,
  LogIn,
  MapPin,
  Clock,
  Mail,
  AtSign,
  MessageCircle,
  ClipboardList,
  ArrowRight,
  Users,
  BookOpen,
  Camera,
  Receipt,
  Info,
  FileText,
  UserRound,
} from "lucide-react";
import { SITE, temContato } from "@/features/site/conteudoSite";
import { OPCOES_FAIXA_BASE } from "@/features/alunos/faixa";
import { VersiculoDoDia } from "@/components/VersiculoDoDia";
import { Button } from "@/components/ui/button";

// Cores das faixas para a régua de progressão do herói. Espelha o sistema de
// faixas do jiu-jitsu infantil usado no portal.
const CORES_FAIXA = [
  "#f5f5f4", "#9ca3af", "#facc15", "#fb923c",
  "#22c55e", "#3b82f6", "#a855f7", "#78350f", "#18181b",
];

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
  const { contato, numeros, polos, historia, fotos, prestacaoContas, informacoes } = SITE;
  const anoAtual = new Date().getFullYear();

  const temPrestacao =
    Boolean(prestacaoContas.texto) || prestacaoContas.documentos.length > 0;
  const temInformacoes = informacoes.regras.length > 0 || polos.length > 0;

  // Links de navegação — só aparecem para seções que têm conteúdo.
  const secoes = [
    { id: "historia", label: "História", on: historia.length > 0 },
    { id: "fotos", label: "Fotos", on: true },
    { id: "prestacao", label: "Prestação de contas", on: temPrestacao },
    { id: "informacoes", label: "Informações", on: temInformacoes },
  ].filter((s) => s.on);

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Topo */}
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <img src="/logo.png" alt={SITE.nome} className="h-10 w-auto md:h-12" />

        <nav className="order-3 flex w-full flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground md:order-2 md:w-auto">
          {secoes.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="transition-colors hover:text-foreground">
              {s.label}
            </a>
          ))}
        </nav>

        <div className="order-2 flex items-center gap-2 md:order-3">
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
      </header>

      {/* Herói */}
      <section className="mx-auto max-w-5xl px-4 pb-14 pt-6 md:pb-20 md:pt-10">
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
            <Button asChild variant="outline" size="lg">
              <Link to="/matricula">
                <ClipboardList className="size-5" />
                Fazer inscrição
              </Link>
            </Button>
          </div>

          {/* Régua de faixas: a progressão do aluno, em uma linha. */}
          <div className="mt-10">
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {CORES_FAIXA.map((cor, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: cor }} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Da faixa branca à preta —{" "}
              {OPCOES_FAIXA_BASE.map((f) => f.nome).join(" · ")}
            </p>
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
              <Numero valor={anoAtual - numeros.desde} rotulo="anos de projeto" />
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
            <div key={p.titulo} className="rounded-xl border border-border bg-card p-5">
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
                <p key={i} className="text-pretty leading-relaxed text-muted-foreground">
                  {par}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fotos */}
      <section id="fotos" className="scroll-mt-6 border-t border-border bg-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-14 md:py-20">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
            <Camera className="size-6 text-primary" />
            Momentos no tatame
          </h2>
          {fotos.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
              {fotos.map((f, i) => (
                <figure key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                  <img
                    src={f.url}
                    alt={f.legenda ?? "Foto do Instituto Tribo de Davi"}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  {f.legenda && (
                    <figcaption className="p-2 text-xs text-muted-foreground">
                      {f.legenda}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-muted-foreground">
              Em breve — fotos das aulas, eventos e graduações do projeto.
            </p>
          )}
        </div>
      </section>

      {/* Prestação de contas */}
      {temPrestacao && (
        <section id="prestacao" className="scroll-mt-6 border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <Receipt className="size-6 text-primary" />
              Prestação de contas
            </h2>
            {prestacaoContas.texto && (
              <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                {prestacaoContas.texto}
              </p>
            )}
            {prestacaoContas.documentos.length > 0 ? (
              <ul className="mt-6 flex flex-col gap-2">
                {prestacaoContas.documentos.map((d, i) => (
                  <li key={i}>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:border-primary/40 hover:text-foreground"
                    >
                      <FileText className="size-4 text-primary" />
                      {d.nome}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Os relatórios serão publicados aqui em breve.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Informações: regras gerais + polos/endereços/responsáveis */}
      {temInformacoes && (
        <section id="informacoes" className="scroll-mt-6 border-t border-border bg-secondary/20">
          <div className="mx-auto max-w-5xl px-4 py-14 md:py-20">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <Info className="size-6 text-primary" />
              Informações
            </h2>

            {informacoes.regras.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold">Regras gerais</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {informacoes.regras.map((r, i) => (
                    <li key={i} className="flex gap-2 text-muted-foreground">
                      <span className="mt-0.5 text-primary">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {polos.length > 0 && (
              <div className="mt-10">
                <h3 className="font-semibold">Polos e endereços</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {polos.map((polo) => (
                    <div key={polo.nome} className="rounded-xl border border-border bg-card p-5">
                      <h4 className="flex items-center gap-2 font-semibold">
                        <MapPin className="size-4 text-primary" />
                        {polo.nome}
                      </h4>
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
        </section>
      )}

      {/* Doação */}
      <section className="mx-auto max-w-5xl px-4 py-14 md:py-20">
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
      </section>

      {/* Rodapé */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <img src="/logo.png" alt={SITE.nome} className="h-10 w-auto" />
              {contato.cidade && (
                <p className="mt-3 text-sm text-muted-foreground">{contato.cidade}</p>
              )}
            </div>

            {temContato() && (
              <div className="flex flex-col gap-2 text-sm">
                {contato.whatsapp && (
                  <a
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    href={`https://wa.me/55${contato.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                )}
                {contato.email && (
                  <a
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    href={`mailto:${contato.email}`}
                  >
                    <Mail className="size-4" /> {contato.email}
                  </a>
                )}
                {contato.instagram && (
                  <a
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    href={`https://instagram.com/${contato.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <AtSign className="size-4" /> @{contato.instagram}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border pt-6 text-xs text-muted-foreground">
            <span>
              © {anoAtual} {SITE.nome}
            </span>
            <span>
              Desenvolvido por{" "}
              <a
                href="mailto:marcusviniciussp.dev@gmail.com"
                className="font-medium hover:text-foreground"
              >
                eMeVe ©
              </a>
            </span>
            <div className="flex items-center gap-x-6">
              <Link to="/responsavel" className="hover:text-foreground">
                Área do Responsável
              </Link>
              <Link to="/login" className="hover:text-foreground">
                Acesso da equipe
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
