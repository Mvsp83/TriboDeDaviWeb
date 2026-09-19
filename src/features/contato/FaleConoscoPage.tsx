import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { useEnviarContato } from "@/features/contato/contatoApi";
import { PaginaSite, CampoSite, classeCampo } from "@/components/site/PecasSite";
import { MarcaTribo } from "@/components/site/MarcaTribo";
import { cn } from "@/lib/utils";

// Fale conosco. Duas colunas: à esquerda os canais diretos (quem prefere
// WhatsApp ou e-mail não precisa preencher nada), à direita o formulário.

// `website` é honeypot: fica escondido; se um bot preencher, a API descarta.
const vazio = { nome: "", email: "", telefone: "", assunto: "", mensagem: "", website: "" };

export function FaleConoscoPage() {
  const [form, setForm] = useState(vazio);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const enviarMut = useEnviarContato();

  const campo =
    (k: keyof typeof vazio) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const canais = [
    { rotulo: "E-mail", valor: SITE.contato.email, href: `mailto:${SITE.contato.email}` },
    {
      rotulo: "Instagram",
      valor: SITE.contato.instagram,
      href: `https://instagram.com/${(SITE.contato.instagram ?? "").replace("@", "")}`,
    },
    { rotulo: "Cidade", valor: SITE.contato.cidade, href: undefined },
  ].filter((c) => !!c.valor);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.mensagem.trim()) {
      toast.error("Preencha seu nome e a mensagem.");
      return;
    }
    if (!form.email.trim() && !form.telefone.trim()) {
      toast.error("Informe um e-mail ou telefone para retorno.");
      return;
    }
    setEnviando(true);
    try {
      await enviarMut.mutateAsync(form);
      setEnviado(true);
    } catch {
      toast.error("Não foi possível enviar agora. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PaginaSite
      titulo="Fale conosco"
      subtitulo="Dúvidas, parcerias, apoio ou uma mensagem para a equipe? Escreva — respondemos assim que possível."
      tituloDocumento={`Fale conosco — ${SITE.nome}`}
    >
      <div className="mx-auto grid max-w-5xl md:grid-cols-[0.85fr_1.15fr]">
        {/* Canais diretos */}
        <div className="relative overflow-hidden border-b border-border bg-[linear-gradient(160deg,var(--color-card)_55%,color-mix(in_oklab,var(--color-brand-red)_14%,var(--color-card))_100%)] px-4 py-10 md:border-b-0 md:border-r md:px-8 md:py-14">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Canais diretos
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {canais.map((c) => {
              const conteudo = (
                <>
                  <span className="min-w-[76px] font-display text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {c.rotulo}
                  </span>
                  <span className="min-w-0 break-words text-sm font-semibold">
                    {c.valor}
                  </span>
                </>
              );
              return c.href ? (
                <a
                  key={c.rotulo}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-4 transition-[transform,border-color] duration-[var(--dur-base)] ease-[var(--ease-out-premium)] hover:translate-x-1 hover:border-primary"
                >
                  {conteudo}
                </a>
              ) : (
                <div
                  key={c.rotulo}
                  className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-4"
                >
                  {conteudo}
                </div>
              );
            })}
          </div>
          <MarcaTribo className="marca-flutua mt-10 hidden w-20 text-primary opacity-20 md:block" />
        </div>

        {/* Formulário */}
        <div className="px-4 py-10 md:px-8 md:py-14">
          {enviado ? (
            <div className="entra-curto flex flex-col items-center gap-3.5 rounded-2xl border border-border bg-card px-6 py-16 text-center">
              <span className="flex size-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
                <CheckCircle2 className="size-7 text-emerald-500" />
              </span>
              <p className="font-display text-2xl font-semibold uppercase tracking-tight">
                Mensagem enviada
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Obrigado por escrever. A equipe do Instituto vai retornar em
                breve pelo contato que você informou.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEnviado(false);
                  setForm(vazio);
                }}
                className="mt-2 rounded-lg border border-border px-5 py-3 font-display text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors duration-[var(--dur-fast)] hover:border-primary hover:bg-secondary"
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} className="flex flex-col gap-4.5">
              {/* Honeypot: invisível para humanos; bots que preenchem são
                  descartados pela API. Fora do fluxo de tabulação e da leitura. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={campo("website")}
                className="hidden"
              />
              <CampoSite rotulo="Seu nome" obrigatorio>
                <input
                  className={classeCampo}
                  value={form.nome}
                  onChange={campo("nome")}
                  placeholder="Como devemos te chamar"
                />
              </CampoSite>

              <div className="grid gap-4 sm:grid-cols-2">
                <CampoSite rotulo="E-mail">
                  <input
                    type="email"
                    className={classeCampo}
                    value={form.email}
                    onChange={campo("email")}
                    placeholder="voce@email.com"
                  />
                </CampoSite>
                <CampoSite rotulo="Telefone / WhatsApp">
                  <input
                    className={classeCampo}
                    value={form.telefone}
                    onChange={campo("telefone")}
                    placeholder="(47) 90000-0000"
                  />
                </CampoSite>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">
                Informe pelo menos um e-mail ou telefone para retorno.
              </p>

              <CampoSite rotulo="Assunto">
                <input
                  className={classeCampo}
                  value={form.assunto}
                  onChange={campo("assunto")}
                  placeholder="Matrícula, parceria, doação…"
                />
              </CampoSite>

              <CampoSite rotulo="Mensagem" obrigatorio>
                <textarea
                  rows={5}
                  className={cn(classeCampo, "resize-y leading-relaxed")}
                  value={form.mensagem}
                  onChange={campo("mensagem")}
                  placeholder="Escreva aqui"
                />
              </CampoSite>

              <button
                type="submit"
                disabled={enviando}
                className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-primary px-4 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.1em] text-primary-foreground transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-premium)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_var(--color-primary)] disabled:pointer-events-none disabled:opacity-60"
              >
                {enviando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {enviando ? "Enviando…" : "Enviar mensagem"}
              </button>
            </form>
          )}
        </div>
      </div>
    </PaginaSite>
  );
}
