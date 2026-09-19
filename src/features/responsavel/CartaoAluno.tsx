import { FaixaBelt, FAIXAS } from "@/components/site/ElementosSite";
import { FotoSite } from "@/components/site/FotoSite";

// Cabeçalho da Área do Aluno: foto, nome, polo/turma, código de acesso e a
// faixa atual desenhada de verdade (com graus e brilho). A faixa é o que o
// aluno quer ver primeiro — por isso ela tem o mesmo peso visual do nome.

export function CartaoAluno({
  nome,
  polo,
  turma,
  codigo,
  foto,
  indiceFaixa,
  graus = 0,
  indiceProxima,
}: {
  nome: string;
  polo?: string;
  turma?: string;
  codigo?: string;
  foto?: string;
  /** Posição em FAIXAS (0 = branca). */
  indiceFaixa: number;
  graus?: number;
  /**
   * Posição da PRÓXIMA faixa em FAIXAS. Passe quando a progressão não é linear
   * (adulto pula cores: Branca → Azul). `null` = não há próxima (já é preta).
   * Omitido = usa a próxima cor linear (comportamento padrão infantil).
   */
  indiceProxima?: number | null;
}) {
  const faixa = FAIXAS[Math.max(0, Math.min(FAIXAS.length - 1, indiceFaixa))];
  const proxima =
    indiceProxima === undefined
      ? FAIXAS[indiceFaixa + 1]
      : indiceProxima == null
        ? undefined
        : FAIXAS[indiceProxima];

  return (
    <div className="entra overflow-hidden rounded-2xl border border-border bg-[linear-gradient(115deg,var(--color-card)_55%,color-mix(in_oklab,var(--color-primary)_8%,var(--color-card))_100%)]">
      <div className="flex flex-wrap items-center gap-5 p-6 md:flex-nowrap">
        <div
          className="size-19 shrink-0 overflow-hidden rounded-full border-2"
          style={{ borderColor: faixa.cor }}
        >
          <FotoSite src={foto} descricao="foto" alt={nome} posicaoLegenda="centro" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted-foreground">Oi!</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold uppercase leading-tight md:text-3xl">
            {nome}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {[polo, turma].filter(Boolean).join(" · ")}
            {codigo && (
              <>
                {" · código "}
                <span className="font-mono text-primary">{codigo}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-2 md:w-auto md:items-end">
          <span className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Faixa atual
          </span>
          <div className="w-40">
            <FaixaBelt nome={faixa.nome} cor={faixa.cor} ponta={faixa.ponta} />
          </div>
          {graus > 0 && (
            <span className="text-xs text-muted-foreground">
              {graus} {graus === 1 ? "grau" : "graus"}
            </span>
          )}
        </div>
      </div>

      {proxima && (
        <div className="flex items-center gap-2.5 border-t border-border px-6 py-3 text-[13px] text-muted-foreground">
          Próxima faixa:
          <span
            className="inline-block h-3.5 w-16 rounded-[3px]"
            style={{ background: proxima.cor }}
          />
          <span className="text-foreground/80">{proxima.nome}</span>
        </div>
      )}
    </div>
  );
}
