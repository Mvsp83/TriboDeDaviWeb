import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import {
  TRANSPARENCIA,
  temIdentificacao,
  temImpacto,
  temFinanceiro,
  type DocumentoPublico,
} from "@/features/transparencia/conteudoTransparencia";
import { SITE } from "@/features/site/conteudoSite";
import { useEstatisticasSite } from "@/features/site/siteApi";
import { ApiRotas } from "@/lib/apiRoutes";
import { useGovernancaPublica, ORGAO } from "@/features/governanca/governancaApi";
import { moeda } from "@/lib/format";
import { urlSegura } from "@/lib/utils";
import {
  PaginaSite,
  SecaoSite,
  BarraProporcao,
  LinkDocumento,
} from "@/components/site/PecasSite";
import { BotaoSite } from "@/components/site/ElementosSite";
import { useContador } from "@/lib/useContador";
import { cn } from "@/lib/utils";

// Balanço cadastrado (categoria Balanço do DocumentoContabil), exposto público.
interface BalancoPublico {
  id: string;
  nome: string;
  dataCriacao: string | null;
}

function anoDoBalanco(b: BalancoPublico): number {
  const m = /(20\d{2})/.exec(b.nome);
  if (m) return Number(m[1]);
  if (b.dataCriacao) return new Date(b.dataCriacao).getFullYear();
  return 0;
}

// Número grande que conta ao entrar em tela (sufixo opcional, ex.: "%").
function NumeroImpacto({
  alvo,
  rotulo,
  sufixo = "",
}: {
  alvo: number;
  rotulo: string;
  sufixo?: string;
}) {
  const { ref, valor } = useContador(alvo);
  return (
    <div ref={ref} className="px-4 py-7 text-center md:px-6">
      <div className="font-display text-4xl font-bold leading-none tabular-nums text-primary md:text-5xl">
        {valor.toLocaleString("pt-BR")}
        {sufixo}
      </div>
      <div className="mt-2 text-[13px] text-muted-foreground">{rotulo}</div>
    </div>
  );
}

// Página pública de transparência e impacto, no visual novo. Dados reais do
// repo: conteúdo curado (conteudoTransparencia) + estatísticas ao vivo +
// governança do cadastro + balanços cadastrados.
export function TransparenciaPage() {
  const { intro, identificacao, impacto, financeiro, documentos, politicas } =
    TRANSPARENCIA;

  const [anoGov, setAnoGov] = useState<number | undefined>(undefined);
  const { data: gov } = useGovernancaPublica(anoGov);
  const diretoria = (gov?.membros ?? []).filter((m) => m.orgao === ORGAO.diretoria);
  const conselho = (gov?.membros ?? []).filter((m) => m.orgao === ORGAO.conselho);
  const anoAtual = new Date().getFullYear();

  const { data: estatisticas } = useEstatisticasSite();
  const atendidos = estatisticas?.alunos ?? impacto.atendidos;
  const polos = estatisticas?.polos ?? impacto.polos;

  const totalReceitas = financeiro.receitas.reduce((s, r) => s + r.valor, 0);
  const totalDespesas = financeiro.despesas.reduce((s, d) => s + d.valor, 0);
  const maxFin = Math.max(totalReceitas, totalDespesas, 1);

  const documentosPorAno = useMemo(() => {
    const grupos = new Map<number, DocumentoPublico[]>();
    for (const d of documentos) {
      const ano = d.ano ?? 0;
      const lista = grupos.get(ano) ?? [];
      lista.push(d);
      grupos.set(ano, lista);
    }
    return [...grupos.entries()].sort(([a], [b]) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return b - a;
    });
  }, [documentos]);

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

  // Números de impacto disponíveis (só os > 0 entram).
  const numeros: { alvo: number; rotulo: string; sufixo?: string }[] = [
    atendidos > 0 && { alvo: atendidos, rotulo: "crianças e adolescentes" },
    polos > 0 && { alvo: polos, rotulo: "polos em funcionamento" },
    impacto.aulas > 0 && { alvo: impacto.aulas, rotulo: "aulas realizadas" },
    impacto.frequenciaMedia > 0 && {
      alvo: impacto.frequenciaMedia,
      rotulo: "frequência média",
      sufixo: "%",
    },
    impacto.bairros > 0 && { alvo: impacto.bairros, rotulo: "bairros alcançados" },
    impacto.escolas > 0 && { alvo: impacto.escolas, rotulo: "escolas de origem" },
  ].filter(Boolean) as { alvo: number; rotulo: string; sufixo?: string }[];

  const distribuicoes = [
    { titulo: "Faixa etária", itens: impacto.faixasEtarias },
    { titulo: "Graduação (faixa)", itens: impacto.graduacoes },
  ].filter((b) => b.itens.length > 0);

  return (
    <PaginaSite
      etiqueta={
        <>
          <ShieldCheck className="size-3.5" />
          Transparência e impacto
        </>
      }
      titulo={
        <>
          De onde vêm e <span className="text-primary">para onde vão</span> os recursos
        </>
      }
      subtitulo={intro}
      tituloDocumento={`Transparência e impacto — ${SITE.nome}`}
    >
      {/* Impacto */}
      {temImpacto() && numeros.length > 0 && (
        <div className="grid grid-cols-2 divide-x divide-y divide-border border-b border-border bg-card/40 md:grid-cols-4 md:divide-y-0">
          {numeros.map((n) => (
            <NumeroImpacto key={n.rotulo} alvo={n.alvo} rotulo={n.rotulo} sufixo={n.sufixo} />
          ))}
        </div>
      )}

      {/* Quem atendemos */}
      {distribuicoes.length > 0 && (
        <SecaoSite titulo="Quem atendemos">
          <div className="grid gap-5 md:grid-cols-2">
            {distribuicoes.map((b) => {
              const total = b.itens.reduce((s, i) => s + i.quantidade, 0) || 1;
              return (
                <div key={b.titulo} className="rounded-2xl border border-border bg-card p-6">
                  <p className="mb-5 font-display text-[13px] uppercase tracking-[0.14em] text-muted-foreground">
                    {b.titulo}
                  </p>
                  {b.itens.map((d) => {
                    const pct = Math.round((d.quantidade * 100) / total);
                    return (
                      <BarraProporcao
                        key={d.nome}
                        rotulo={d.nome}
                        valor={`${d.quantidade} (${pct}%)`}
                        porcentagem={pct}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </SecaoSite>
      )}

      {/* Financeiro */}
      {temFinanceiro() && (
        <SecaoSite
          titulo="Financeiro"
          acessorio={
            <span className="font-mono text-xs text-muted-foreground">
              exercício de {financeiro.ano}
            </span>
          }
        >
          <div className="grid gap-9 md:grid-cols-2">
            {[
              {
                titulo: "Receitas",
                itens: financeiro.receitas,
                total: totalReceitas,
                cor: "var(--color-success, #22c55e)",
                classeTotal: "text-success",
              },
              {
                titulo: "Despesas",
                itens: financeiro.despesas,
                total: totalDespesas,
                cor: "var(--color-destructive)",
                classeTotal: "text-destructive",
              },
            ]
              .filter((col) => col.itens.length > 0)
              .map((col) => (
                <div key={col.titulo}>
                  <div className="flex items-baseline justify-between border-b border-border pb-3">
                    <h3 className="font-display text-lg font-semibold uppercase tracking-wide">
                      {col.titulo}
                    </h3>
                    <span
                      className={cn(
                        "font-display text-xl font-semibold tabular-nums",
                        col.classeTotal,
                      )}
                    >
                      {moeda(col.total)}
                    </span>
                  </div>
                  <div className="mt-4">
                    {col.itens.map((l) => (
                      <BarraProporcao
                        key={l.categoria}
                        rotulo={l.categoria}
                        valor={moeda(l.valor)}
                        porcentagem={(l.valor * 100) / maxFin}
                        cor={col.cor}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
          {financeiro.observacao && (
            <p className="mt-6 text-sm text-muted-foreground">{financeiro.observacao}</p>
          )}
        </SecaoSite>
      )}

      {/* Documentos + governança */}
      <div className="grid border-t border-border md:grid-cols-2">
        <div className="border-b border-border px-4 py-10 md:border-b-0 md:border-r md:px-8 md:py-12">
          <h2 className="mb-5 font-display text-2xl font-semibold uppercase tracking-tight">
            Documentos
          </h2>
          {documentos.length === 0 && balancos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum documento publicado ainda.
            </p>
          ) : (
            <>
              {documentosPorAno.map(([ano, itens]) => (
                <div key={`doc-${ano}`} className="mb-6">
                  <p className="mb-2.5 font-mono text-xs tracking-[0.14em] text-primary">
                    {ano === 0 ? "Outros documentos" : ano}
                  </p>
                  {itens.map((d, i) => (
                    <LinkDocumento
                      key={i}
                      nome={d.nome}
                      href={urlSegura(d.url) ?? "#"}
                      tipo={d.tipo ?? "PDF"}
                    />
                  ))}
                </div>
              ))}
              {balancosPorAno.map(([ano, itens]) => (
                <div key={`bal-${ano}`} className="mb-6">
                  <p className="mb-2.5 font-mono text-xs tracking-[0.14em] text-primary">
                    Balanço {ano === 0 ? "" : ano}
                  </p>
                  {itens.map((b) => (
                    <LinkDocumento
                      key={b.id}
                      nome={b.nome}
                      href={`${baseApi}${ApiRotas.balancoPublicoDownload(b.id)}`}
                    />
                  ))}
                </div>
              ))}
              {/* Políticas institucionais */}
              <div className="mt-2">
                <p className="mb-2.5 font-mono text-xs tracking-[0.14em] text-primary">
                  Políticas
                </p>
                <LinkDocumento nome="Política de Privacidade" href="/politica-privacidade" tipo="PÁGINA" />
                {politicas.codigoEtica && (
                  <LinkDocumento nome="Código de Ética" href={urlSegura(politicas.codigoEtica) ?? "#"} />
                )}
              </div>
            </>
          )}
        </div>

        <div className="bg-card/40 px-4 py-10 md:px-8 md:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-tight">
              Governança
            </h2>
            {(gov?.anos.length ?? 0) > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {gov!.anos.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAnoGov(a)}
                    aria-pressed={a === gov!.ano}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors duration-[var(--dur-fast)]",
                      a === gov!.ano
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mb-5 mt-2 text-[13px] text-muted-foreground">
            Quem dirige e fiscaliza o instituto{gov?.ano ? ` — gestão ${gov.ano}` : ""}.
          </p>

          {(gov?.membros.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              A composição será publicada em breve.
            </p>
          ) : (
            [
              { titulo: "Diretoria", membros: diretoria },
              { titulo: "Conselho fiscal", membros: conselho },
            ]
              .filter((g) => g.membros.length > 0)
              .map((grupo) => (
                <div
                  key={grupo.titulo}
                  className="mb-3.5 rounded-2xl border border-border bg-card p-5"
                >
                  <p className="mb-3 font-display text-[13px] uppercase tracking-[0.14em] text-primary">
                    {grupo.titulo}
                  </p>
                  {grupo.membros.map((m) => (
                    <div key={m.id} className="flex justify-between gap-3 py-1.5 text-sm">
                      <span className="font-semibold">{m.nome}</span>
                      <span className="text-muted-foreground">{m.cargo}</span>
                    </div>
                  ))}
                </div>
              ))
          )}

          {/* Identificação legal */}
          {temIdentificacao() && (
            <div className="mt-7">
              <p className="mb-3 font-display text-[13px] uppercase tracking-[0.14em] text-muted-foreground">
                Identificação
              </p>
              {[
                identificacao.razaoSocial && { rotulo: "Razão social", valor: identificacao.razaoSocial },
                identificacao.cnpj && { rotulo: "CNPJ", valor: identificacao.cnpj },
                identificacao.endereco && { rotulo: "Endereço", valor: identificacao.endereco },
                identificacao.presidente && { rotulo: "Responsável legal", valor: identificacao.presidente },
                identificacao.fundacao > 0 && {
                  rotulo: "Em atividade desde",
                  valor: `${identificacao.fundacao} (${anoAtual - identificacao.fundacao} anos)`,
                },
              ]
                .filter(Boolean)
                .map((i) => {
                  const item = i as { rotulo: string; valor: string };
                  return (
                    <div
                      key={item.rotulo}
                      className="flex justify-between gap-3 border-b border-border/60 py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">{item.rotulo}</span>
                      <span className="text-right font-semibold">{item.valor}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Chamada final */}
      <section className="border-t border-border bg-[linear-gradient(115deg,var(--color-background)_55%,color-mix(in_oklab,var(--color-brand-red)_15%,var(--color-background))_100%)]">
        <div className="revela mx-auto max-w-5xl px-4 py-14 md:px-8 md:py-20">
          <h2 className="max-w-2xl font-display text-3xl font-bold uppercase leading-[1.02] md:text-4xl">
            Cada doação vira <span className="text-primary">aula gratuita</span>
          </h2>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Sua contribuição paga quimono, faixa e tatame — e você acompanha o
            resultado por aqui.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <BotaoSite to="/doar">Doar por Pix</BotaoSite>
            <BotaoSite to="/historia" variante="contorno">
              Conhecer o projeto
            </BotaoSite>
          </div>
        </div>
      </section>
    </PaginaSite>
  );
}
