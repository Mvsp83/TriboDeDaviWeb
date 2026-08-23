import { Link } from "react-router-dom";
import {
  HeartHandshake,
  LogIn,
  ArrowLeft,
  ArrowRight,
  Users,
  MapPin,
  BarChart3,
  Wallet,
  FileText,
  Building2,
  ShieldCheck,
} from "lucide-react";
import {
  TRANSPARENCIA,
  temIdentificacao,
  temImpacto,
  temFinanceiro,
} from "@/features/transparencia/conteudoTransparencia";
import { SITE } from "@/features/site/conteudoSite";
import { moeda } from "@/lib/format";
import { Button } from "@/components/ui/button";

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold tabular-nums text-primary md:text-4xl">
        {valor}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{rotulo}</div>
    </div>
  );
}

// Barra proporcional simples (espelha a do Relatório de Impacto interno), sem
// dependência de biblioteca de gráfico.
function Distribuicao({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { nome: string; quantidade: number }[];
}) {
  if (itens.length === 0) return null;
  const total = itens.reduce((s, i) => s + i.quantidade, 0);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-3 text-sm font-semibold">{titulo}</p>
      <div className="space-y-2.5">
        {itens.map((i) => {
          const pct = total > 0 ? Math.round((i.quantidade * 100) / total) : 0;
          return (
            <div key={i.nome}>
              <div className="flex justify-between text-sm">
                <span className="truncate">{i.nome}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {i.quantidade} ({pct}%)
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Página pública de transparência e impacto: mostra o alcance do projeto e
// para onde vão os recursos, voltada a doadores, parceiros e editais. Não usa
// dados ao vivo — o conteúdo é curado em conteudoTransparencia.ts.
export function TransparenciaPage() {
  const { intro, identificacao, impacto, financeiro, documentos } = TRANSPARENCIA;
  const anoAtual = new Date().getFullYear();

  const totalReceitas = financeiro.receitas.reduce((s, r) => s + r.valor, 0);
  const totalDespesas = financeiro.despesas.reduce((s, d) => s + d.valor, 0);
  const maxFin = Math.max(totalReceitas, totalDespesas, 1);

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Topo */}
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src="/logo.png" alt={SITE.nome} className="h-10 w-auto md:h-12" />
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Voltar ao site
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">
              <LogIn className="size-4" />
              Acesso da equipe
            </Link>
          </Button>
        </div>
      </header>

      {/* Herói */}
      <section className="mx-auto max-w-5xl px-4 pb-10 pt-4 md:pb-14 md:pt-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            Transparência e impacto
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            De onde vêm e para onde vão os recursos
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground md:text-lg">
            {intro}
          </p>
        </div>
      </section>

      {/* Números de impacto */}
      {temImpacto() && (
        <section className="border-y border-border bg-secondary/30">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Nossos números em {impacto.ano}
            </p>
            <div className="flex flex-wrap items-start justify-center gap-10 md:gap-16">
              {impacto.atendidos > 0 && (
                <Numero valor={String(impacto.atendidos)} rotulo="crianças e adolescentes" />
              )}
              {impacto.polos > 0 && (
                <Numero valor={String(impacto.polos)} rotulo="polos em funcionamento" />
              )}
              {impacto.aulas > 0 && (
                <Numero valor={String(impacto.aulas)} rotulo="aulas realizadas" />
              )}
              {impacto.frequenciaMedia > 0 && (
                <Numero valor={`${impacto.frequenciaMedia}%`} rotulo="frequência média" />
              )}
            </div>

            {/* Alcance territorial e escolar */}
            {(impacto.bairros > 0 || impacto.escolas > 0) && (
              <div className="mx-auto mt-8 flex max-w-md flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
                {impacto.bairros > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-primary" />
                    {impacto.bairros} bairros alcançados
                  </span>
                )}
                {impacto.escolas > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4 text-primary" />
                    {impacto.escolas} escolas de origem
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Distribuições */}
      {(impacto.faixasEtarias.length > 0 || impacto.graduacoes.length > 0) && (
        <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
            <BarChart3 className="size-6 text-primary" />
            Quem atendemos
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Distribuicao titulo="Faixa etária" itens={impacto.faixasEtarias} />
            <Distribuicao titulo="Graduação (faixa)" itens={impacto.graduacoes} />
          </div>
        </section>
      )}

      {/* Transparência financeira */}
      {temFinanceiro() && (
        <section className="border-t border-border bg-secondary/20">
          <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <Wallet className="size-6 text-primary" />
              Transparência financeira
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Exercício de {financeiro.ano}
            </p>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {financeiro.receitas.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Receitas</h3>
                    <span className="font-semibold tabular-nums text-success">
                      {moeda(totalReceitas)}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {financeiro.receitas.map((r) => (
                      <li key={r.categoria}>
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{r.categoria}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {moeda(r.valor)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-success"
                            style={{ width: `${(r.valor * 100) / maxFin}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {financeiro.despesas.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Despesas</h3>
                    <span className="font-semibold tabular-nums text-destructive">
                      {moeda(totalDespesas)}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {financeiro.despesas.map((d) => (
                      <li key={d.categoria}>
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{d.categoria}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {moeda(d.valor)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-destructive"
                            style={{ width: `${(d.valor * 100) / maxFin}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {financeiro.observacao && (
              <p className="mt-6 text-sm text-muted-foreground">{financeiro.observacao}</p>
            )}
          </div>
        </section>
      )}

      {/* Documentos */}
      {documentos.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
            <FileText className="size-6 text-primary" />
            Documentos
          </h2>
          <ul className="mt-6 flex flex-col gap-2">
            {documentos.map((d, i) => (
              <li key={i}>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:border-primary/40 hover:text-foreground"
                >
                  <FileText className="size-4 shrink-0 text-primary" />
                  {d.nome}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Identificação legal */}
      {temIdentificacao() && (
        <section className="border-t border-border bg-secondary/20">
          <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <Building2 className="size-6 text-primary" />
              Identificação
            </h2>
            <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              {identificacao.razaoSocial && (
                <div>
                  <dt className="text-muted-foreground">Razão social</dt>
                  <dd className="mt-0.5 font-medium">{identificacao.razaoSocial}</dd>
                </div>
              )}
              {identificacao.cnpj && (
                <div>
                  <dt className="text-muted-foreground">CNPJ</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">{identificacao.cnpj}</dd>
                </div>
              )}
              {identificacao.endereco && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Endereço</dt>
                  <dd className="mt-0.5 font-medium">{identificacao.endereco}</dd>
                </div>
              )}
              {identificacao.presidente && (
                <div>
                  <dt className="text-muted-foreground">Responsável legal</dt>
                  <dd className="mt-0.5 font-medium">{identificacao.presidente}</dd>
                </div>
              )}
              {identificacao.fundacao > 0 && (
                <div>
                  <dt className="text-muted-foreground">Em atividade desde</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">
                    {identificacao.fundacao} ({anoAtual - identificacao.fundacao} anos)
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      )}

      {/* Doação */}
      <section className="mx-auto max-w-5xl px-4 py-14 md:py-20">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-10">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Cada doação vira aula gratuita
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Sua contribuição paga quimono, faixa, tatame e o transporte das
            crianças — e você acompanha por aqui o resultado dela.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/doar">
                <HeartHandshake className="size-5" />
                Doar por Pix
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">
                <Users className="size-5" />
                Conhecer o projeto
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground">
          <span>
            © {anoAtual} {SITE.nome}
          </span>
          <div className="flex items-center gap-x-6">
            <Link to="/" className="hover:text-foreground">
              Site
            </Link>
            <Link to="/doar" className="hover:text-foreground">
              Doar
            </Link>
            <Link to="/login" className="hover:text-foreground">
              Acesso da equipe
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
