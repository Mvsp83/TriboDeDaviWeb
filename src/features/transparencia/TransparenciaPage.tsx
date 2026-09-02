import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  HeartHandshake,
  ArrowRight,
  Users,
  MapPin,
  BarChart3,
  Wallet,
  FileText,
  Building2,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import {
  TRANSPARENCIA,
  temIdentificacao,
  temImpacto,
  temFinanceiro,
  type DocumentoPublico,
} from "@/features/transparencia/conteudoTransparencia";
import { SITE } from "@/features/site/conteudoSite";
import { ApiRotas } from "@/lib/apiRoutes";
import {
  useGovernancaPublica,
  ORGAO,
} from "@/features/governanca/governancaApi";
import { moeda } from "@/lib/format";
import { urlSegura } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { PaginaPublica } from "@/components/PaginaPublica";

// Balanço cadastrado (categoria Balanço do DocumentoContabil), exposto público.
interface BalancoPublico {
  id: string;
  nome: string;
  dataCriacao: string | null;
}

// Ano do balanço: do nome do arquivo ("Balanço 2025.pdf") e, na falta, da data
// de envio. 0 = sem ano identificável.
function anoDoBalanco(b: BalancoPublico): number {
  const m = /(20\d{2})/.exec(b.nome);
  if (m) return Number(m[1]);
  if (b.dataCriacao) return new Date(b.dataCriacao).getFullYear();
  return 0;
}

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
  const { intro, identificacao, impacto, financeiro, documentos, politicas } =
    TRANSPARENCIA;

  // Governança vem do cadastro (admin), por ano de vigência.
  const [anoGov, setAnoGov] = useState<number | undefined>(undefined);
  const { data: gov } = useGovernancaPublica(anoGov);
  const diretoria = (gov?.membros ?? []).filter((m) => m.orgao === ORGAO.diretoria);
  const conselho = (gov?.membros ?? []).filter((m) => m.orgao === ORGAO.conselho);
  const anoAtual = new Date().getFullYear();
  useDocumentTitle(`Transparência e impacto — ${SITE.nome}`);

  const totalReceitas = financeiro.receitas.reduce((s, r) => s + r.valor, 0);
  const totalDespesas = financeiro.despesas.reduce((s, d) => s + d.valor, 0);
  const maxFin = Math.max(totalReceitas, totalDespesas, 1);

  // Agrupa os documentos por ano (mais recente primeiro). Os sem ano vão para o
  // fim, sob "Outros documentos" — assim o histórico mostra continuidade.
  const documentosPorAno = useMemo(() => {
    const grupos = new Map<number, DocumentoPublico[]>();
    for (const d of documentos) {
      const ano = d.ano ?? 0;
      const lista = grupos.get(ano) ?? [];
      lista.push(d);
      grupos.set(ano, lista);
    }
    return [...grupos.entries()].sort(([a], [b]) => {
      if (a === 0) return 1; // "sem ano" sempre por último
      if (b === 0) return -1;
      return b - a; // anos em ordem decrescente
    });
  }, [documentos]);

  // Balanços cadastrados (público). fetch puro: página pública não pode ser
  // redirecionada ao /login se a API responder erro.
  const { data: balancos = [] } = useQuery({
    queryKey: ["balancos-publicos"],
    queryFn: async (): Promise<BalancoPublico[]> => {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const res = await fetch(`${base}${ApiRotas.balancosPublicos}`);
        if (!res.ok) return [];
        const json = await res.json();
        return (json?.data as BalancoPublico[]) ?? [];
      } catch {
        return [];
      }
    },
  });

  const balancosPorAno = useMemo(() => {
    const grupos = new Map<number, BalancoPublico[]>();
    for (const b of balancos) {
      const ano = anoDoBalanco(b);
      const lista = grupos.get(ano) ?? [];
      lista.push(b);
      grupos.set(ano, lista);
    }
    return [...grupos.entries()].sort(([a], [b]) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return b - a;
    });
  }, [balancos]);

  const baseApi = import.meta.env.VITE_API_BASE_URL || "";

  return (
    <PaginaPublica>
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

      {/* Documentos — agrupados por ano (histórico) */}
      {documentos.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
            <FileText className="size-6 text-primary" />
            Documentos
          </h2>
          <div className="mt-6 space-y-8">
            {documentosPorAno.map(([ano, itens]) => (
              <div key={ano}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {ano === 0 ? "Outros documentos" : ano}
                </h3>
                <ul className="flex flex-col gap-2">
                  {itens.map((d, i) => (
                    <li key={i}>
                      <a
                        href={urlSegura(d.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:border-primary/40 hover:text-foreground"
                      >
                        <FileText className="size-4 shrink-0 text-primary" />
                        <span className="truncate">{d.nome}</span>
                        {d.tipo && (
                          <span className="ml-auto shrink-0 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground">
                            {d.tipo}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Governança — do cadastro, por ano de vigência */}
      {(gov?.membros.length ?? 0) > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <Landmark className="size-6 text-primary" />
              Governança
            </h2>
            {(gov?.anos.length ?? 0) > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {gov!.anos.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAnoGov(a)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      a === gov!.ano
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Quem dirige e fiscaliza o instituto — gestão {gov?.ano}.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {diretoria.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold">Diretoria</p>
                <ul className="space-y-2.5">
                  {diretoria.map((m) => (
                    <li key={m.id} className="flex flex-wrap justify-between gap-x-4 text-sm">
                      <span className="font-medium">{m.nome}</span>
                      <span className="text-muted-foreground">{m.cargo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {conselho.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold">Conselho fiscal</p>
                <ul className="space-y-2.5">
                  {conselho.map((m) => (
                    <li key={m.id} className="flex flex-wrap justify-between gap-x-4 text-sm">
                      <span className="font-medium">{m.nome}</span>
                      <span className="text-muted-foreground">{m.cargo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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

      {/* Políticas institucionais */}
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
          <ShieldCheck className="size-6 text-primary" />
          Políticas
        </h2>
        <ul className="mt-6 flex flex-col gap-2">
          {/* Política de Privacidade: página própria do site. */}
          <li>
            <Link
              to="/politica-privacidade"
              className="inline-flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:border-primary/40 hover:text-foreground"
            >
              <ShieldCheck className="size-4 shrink-0 text-primary" />
              Política de Privacidade
            </Link>
          </li>
          {politicas.codigoEtica && (
            <li>
              <a
                href={urlSegura(politicas.codigoEtica)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:border-primary/40 hover:text-foreground"
              >
                <FileText className="size-4 shrink-0 text-primary" />
                Código de Ética
              </a>
            </li>
          )}
        </ul>
      </section>

      {/* Balanços por ano (cadastrados na contabilidade) */}
      {balancos.length > 0 && (
        <section className="border-t border-border bg-secondary/20">
          <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
              <Landmark className="size-6 text-primary" />
              Balanços por ano
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Balanços patrimoniais cadastrados, do mais recente ao mais antigo.
            </p>
            <div className="mt-6 space-y-8">
              {balancosPorAno.map(([ano, itens]) => (
                <div key={ano}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {ano === 0 ? "Sem ano" : ano}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {itens.map((b) => (
                      <li key={b.id}>
                        <a
                          href={`${baseApi}${ApiRotas.balancoPublicoDownload(b.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm hover:border-primary/40 hover:text-foreground"
                        >
                          <FileText className="size-4 shrink-0 text-primary" />
                          <span className="truncate">{b.nome}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
    </PaginaPublica>
  );
}
