import { useState } from "react";
import { toast } from "sonner";
import { Mail, Send, Loader2, CheckCircle2 } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { useEnviarContato } from "@/features/contato/contatoApi";
import { ApiError } from "@/lib/api";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { PaginaPublica } from "@/components/PaginaPublica";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function FaleConoscoPage() {
  useDocumentTitle(`Fale Conosco — ${SITE.nome}`);
  const enviar = useEnviarContato();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [enviado, setEnviado] = useState(false);

  async function onEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return toast.warning("Informe seu nome.");
    if (!email.trim() && !telefone.trim())
      return toast.warning("Informe um e-mail ou telefone para retorno.");
    if (!mensagem.trim()) return toast.warning("Escreva sua mensagem.");

    try {
      await enviar.mutateAsync({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        website,
      });
      setEnviado(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente novamente.");
    }
  }

  return (
    <PaginaPublica larguraMax="max-w-xl">
      <section className="mx-auto max-w-xl px-4 pb-16 pt-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
          <Mail className="size-7 text-primary" />
          Fale Conosco
        </h1>
        <p className="mt-3 text-muted-foreground">
          Dúvidas, parcerias, apoio ou uma mensagem para a equipe? Escreva aqui —
          responderemos assim que possível.
        </p>

        <Card className="mt-6">
          <CardContent className="p-5">
            {enviado ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="size-12 text-primary" />
                <p className="text-lg font-semibold">Mensagem enviada!</p>
                <p className="text-sm text-muted-foreground">
                  Obrigado por escrever. A equipe do {SITE.nome} vai retornar em
                  breve pelo contato que você informou.
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setEnviado(false);
                    setNome("");
                    setEmail("");
                    setTelefone("");
                    setAssunto("");
                    setMensagem("");
                  }}
                >
                  Enviar outra mensagem
                </Button>
              </div>
            ) : (
              <form onSubmit={onEnviar} className="space-y-4">
                <div>
                  <Label className="mb-1.5">Seu nome *</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5">E-mail</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@email.com"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Telefone / WhatsApp</Label>
                    <Input
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Informe pelo menos um e-mail ou telefone para retorno.
                </p>
                <div>
                  <Label className="mb-1.5">Assunto</Label>
                  <Input
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    placeholder="Ex.: Matrícula, parceria, doação…"
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Mensagem *</Label>
                  <Textarea
                    rows={5}
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                  />
                </div>

                {/* Honeypot anti-spam: invisível para pessoas; bots preenchem. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="hidden"
                  aria-hidden="true"
                />

                <Button type="submit" className="w-full" disabled={enviar.isPending}>
                  {enviar.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Enviar mensagem
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {SITE.contato.email && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Prefere e-mail direto?{" "}
            <a
              href={`mailto:${SITE.contato.email}`}
              className="font-medium text-primary hover:underline"
            >
              {SITE.contato.email}
            </a>
          </p>
        )}
      </section>
    </PaginaPublica>
  );
}
