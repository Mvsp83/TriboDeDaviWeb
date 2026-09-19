import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Check, HeartHandshake } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { gerarPixBrCode } from "@/lib/pixBrCode";
import { DOACAO, doacaoConfigurada } from "@/features/doacao/configDoacao";
import { registrarEvento } from "@/features/metricas/metricaApi";
import { PaginaSite, SecaoSite } from "@/components/site/PecasSite";
import { MarcaTribo } from "@/components/site/MarcaTribo";
import { cn } from "@/lib/utils";

// Doação por Pix. A página tem um trabalho só: fazer a pessoa concluir a
// doação. Por isso são dois passos lado a lado — escolher o valor e pagar —
// e nada além disso acima da dobra.

const SUGESTOES = DOACAO.sugestoes;

const IMPACTO = [
  { valor: "R$ 95", item: "um metro quadrado de tatame" },
  { valor: "R$ 180", item: "um quimono novo para um aluno" },
  { valor: "R$ 320", item: "faixa e graus de uma turma inteira" },
];

const GARANTIAS = [
  {
    titulo: "Sem taxas",
    texto: "O Pix cai direto na conta do instituto — 100% do valor chega ao projeto.",
  },
  {
    titulo: "Prestação de contas",
    texto: "Relatórios e documentos ficam publicados na página de Transparência.",
  },
  {
    titulo: "Recibo de doação",
    texto: "Pessoas físicas e empresas podem solicitar recibo à administração.",
  },
];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function DoacaoPage() {
  const configurada = doacaoConfigurada();
  const recebedor = DOACAO.nome;
  const cidade = SITE.contato.cidade || DOACAO.cidade;

  const [valor, setValor] = useState<number | null>(50);
  const [outro, setOutro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  // Valor efetivo: o chip escolhido ou o "outro valor" digitado.
  const valorEfetivo = useMemo(() => {
    if (valor != null) return valor;
    const n = Number(outro.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [valor, outro]);

  // Código Pix BR Code real (com o valor embutido), como na versão anterior.
  const codigo = useMemo(
    () =>
      configurada
        ? gerarPixBrCode({
            chave: DOACAO.chave,
            nome: DOACAO.nome,
            cidade: DOACAO.cidade,
            valor: valorEfetivo,
          })
        : "",
    [configurada, valorEfetivo],
  );

  useEffect(() => {
    if (!codigo) return;
    QRCode.toDataURL(codigo, { margin: 1, width: 440 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [codigo]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      registrarEvento("pix_copiado");
      toast.success("Código Pix copiado");
      setTimeout(() => setCopiado(false), 2400);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  const tituloPix = valorEfetivo ? `Doar ${brl(valorEfetivo)} por Pix` : "Doar por Pix";

  return (
    <PaginaSite
      etiqueta={
        <>
          <HeartHandshake className="size-3.5" />
          Doação
        </>
      }
      titulo={
        <>
          Doe em <span className="text-primary">um minuto</span>, mude uma
          história por anos
        </>
      }
      subtitulo="Sua doação mantém as aulas gratuitas para crianças e adolescentes. Pix direto na conta do instituto — rápido, seguro e sem taxas."
      tituloDocumento={`Doar — ${SITE.nome}`}
    >
      <div className="mx-auto grid max-w-5xl gap-0 border-b border-border md:grid-cols-[1.05fr_0.95fr]">
        {/* Passo 1 — valor */}
        <div className="border-b border-border px-4 py-10 md:border-b-0 md:border-r md:px-8 md:py-12">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Passo 1
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-tight">
            Escolha um valor
          </h2>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {SUGESTOES.map((v) => {
              const ativo = valor === v && !outro;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setValor(v);
                    setOutro("");
                  }}
                  aria-pressed={ativo}
                  className={cn(
                    "rounded-full border px-5 py-3 text-sm font-semibold",
                    "transition-[transform,background-color,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out-premium)]",
                    "hover:-translate-y-0.5",
                    ativo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground/80 hover:border-primary",
                  )}
                >
                  {brl(v)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setValor(null);
                setOutro("");
              }}
              aria-pressed={valor === null && !outro}
              className={cn(
                "rounded-full border px-5 py-3 text-sm font-semibold transition-colors duration-[var(--dur-fast)]",
                valor === null && !outro
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground/80 hover:border-primary",
              )}
            >
              Escolher no banco
            </button>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-[13px] font-semibold text-foreground/80">
              Ou digite outro valor
            </label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-4 font-display text-base text-muted-foreground">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="75,00"
                value={outro}
                onChange={(e) => {
                  setOutro(e.target.value);
                  setValor(null);
                }}
                className="w-full rounded-[10px] border border-input bg-input/40 py-3.5 pl-12 pr-4 text-base outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]"
              />
            </div>
          </div>

          <div className="mt-9 border-t border-border pt-7">
            <p className="mb-4 font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              O que esse valor vira
            </p>
            {IMPACTO.map((i) => (
              <div
                key={i.valor}
                className="revela flex items-center gap-3.5 border-b border-border/60 py-3"
              >
                <span className="min-w-[78px] font-display text-lg font-semibold text-primary">
                  {i.valor}
                </span>
                <span className="text-sm text-muted-foreground">{i.item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Passo 2 — QR e copia-e-cola */}
        <div className="bg-card/40 px-4 py-10 md:px-8 md:py-12">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Passo 2
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-tight text-primary">
            {tituloPix}
          </h2>

          <div className="mt-7 flex justify-center">
            <div className="anel-pix relative rounded-2xl bg-white p-3.5">
              {qr ? (
                <img src={qr} alt="QR Code do Pix" className="size-52 rounded-md" />
              ) : (
                <div className="size-52 animate-pulse rounded-md bg-neutral-200" />
              )}
              {/* Símbolo do instituto no miolo do QR (o nível de correção
                  de erro do QR tolera a oclusão central). */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-13 items-center justify-center rounded-xl border-[3px] border-black bg-white p-2">
                  <MarcaTribo className="w-6 text-black" />
                </span>
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-[13px] leading-relaxed text-muted-foreground">
            Abra o app do banco, escolha <strong className="text-foreground/80">Pix → Ler QR Code</strong>{" "}
            e aponte a câmera. Ou copie o código abaixo.
          </p>

          <div className="mt-5">
            <p className="max-h-16 overflow-hidden break-all rounded-[10px] border border-input bg-input/40 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {codigo}
            </p>
            <button
              type="button"
              onClick={copiar}
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-2.5 rounded-[10px] px-4 py-3.5",
                "font-display text-[15px] font-semibold uppercase tracking-[0.1em]",
                "transition-[background-color,transform] duration-[var(--dur-base)] ease-[var(--ease-out-premium)] hover:-translate-y-0.5",
                copiado
                  ? "bg-emerald-600 text-white"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copiado ? "Código copiado" : "Copiar código Pix"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Recebedor: <strong className="text-foreground/80">{recebedor}</strong> · {cidade}
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Precisa de recibo? Fale com a administração.
          </p>
        </div>
      </div>

      <SecaoSite className="!py-0">
        <div className="grid divide-y divide-border border-b border-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {GARANTIAS.map((g) => (
            <div key={g.titulo} className="revela px-4 py-7 md:px-7">
              <p className="font-display text-[15px] font-semibold uppercase tracking-wide text-primary">
                {g.titulo}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {g.texto}
              </p>
            </div>
          ))}
        </div>
      </SecaoSite>
    </PaginaSite>
  );
}
