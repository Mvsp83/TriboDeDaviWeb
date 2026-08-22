import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  LogIn,
  LogOut,
  CalendarDays,
  Medal,
  Megaphone,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Camera,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  acessar,
  autorizarImagem,
  clearRespToken,
  obterPainel,
  type PainelResponsavel,
} from "@/features/responsavel/responsavelApi";
import { faixaInfo } from "@/features/alunos/faixa";
import { VersiculoDoDia } from "@/components/VersiculoDoDia";
import { LogoLockup } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function FaixaBadge({ faixa }: { faixa: number }) {
  const info = faixaInfo(faixa);
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: info.cor, color: info.texto, borderColor: "rgba(0,0,0,0.15)" }}
    >
      {info.nome}
    </span>
  );
}

function dataBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function ResponsavelPortal() {
  const [codigo, setCodigo] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [painel, setPainel] = useState<PainelResponsavel | null>(null);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!codigo.trim() || !nascimento) {
      setErro("Preencha o código e a data de nascimento.");
      return;
    }
    setCarregando(true);
    try {
      await acessar(codigo.trim().toUpperCase(), nascimento);
      setPainel(await obterPainel());
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status
          ? "Código ou data de nascimento incorretos."
          : "Erro ao conectar. Tente novamente em instantes.",
      );
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    clearRespToken();
    setPainel(null);
    setCodigo("");
    setNascimento("");
  }

  const [salvandoImagem, setSalvandoImagem] = useState(false);
  async function alternarImagem(autoriza: boolean) {
    setSalvandoImagem(true);
    try {
      await autorizarImagem(autoriza);
      setPainel(await obterPainel());
      toast.success(
        autoriza ? "Uso de imagem autorizado." : "Autorização de imagem revogada.",
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível salvar.",
      );
    } finally {
      setSalvandoImagem(false);
    }
  }

  if (!painel) {
    return (
      <div className="relative flex min-h-svh items-center justify-center bg-background p-4">
        <Link
          to="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao início
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <LogoLockup className="h-20" />
            <p className="text-sm text-muted-foreground">
              Portal do Responsável
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
            <form onSubmit={entrar} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="codigo">Código de acesso</Label>
                <Input
                  id="codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ex.: ABCD2345"
                  autoComplete="off"
                  disabled={carregando}
                  className="text-center text-lg tracking-[0.2em]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="nascimento">
                  Data de nascimento do aluno
                </Label>
                <Input
                  id="nascimento"
                  type="date"
                  value={nascimento}
                  onChange={(e) => setNascimento(e.target.value)}
                  disabled={carregando}
                />
              </div>

              {erro && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {erro}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={carregando}>
                {carregando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Acessar
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                O código é fornecido pelo professor do polo.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const { aluno, frequencia, presencas, graduacoes, avisos, eventos } = painel;

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <LogoLockup className="h-10" />
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={sair}>
          <LogOut className="size-4" />
          Sair
        </Button>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        <VersiculoDoDia />

        {/* Aluno */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-5">
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{aluno.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {aluno.polo || "—"} · Turma {aluno.turma}
              </p>
            </div>
            <FaixaBadge faixa={aluno.faixa} />
          </CardContent>
        </Card>

        {/* Frequência */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Frequência
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold">{frequencia.percentual}%</div>
                <div className="text-xs text-muted-foreground">Presença</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {frequencia.presencas}
                </div>
                <div className="text-xs text-muted-foreground">Presenças</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {frequencia.faltas}
                </div>
                <div className="text-xs text-muted-foreground">Faltas</div>
              </div>
            </div>
            {presencas.length > 0 && (
              <div className="mt-4 flex flex-col gap-1">
                {presencas.slice(0, 10).map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border/60 py-1.5 text-sm last:border-0"
                  >
                    <span className="tabular-nums text-muted-foreground">
                      {dataBR(p.data)}
                    </span>
                    {p.presente ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="size-4" /> Presente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <XCircle className="size-4" /> Falta
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graduação */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Medal className="size-4" /> Graduações
            </h2>
            {graduacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma graduação registrada ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {graduacoes.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="tabular-nums text-muted-foreground">
                      {dataBR(g.data)}
                    </span>
                    <FaixaBadge faixa={g.faixaAnterior} />
                    <span className="text-muted-foreground">→</span>
                    <FaixaBadge faixa={g.faixaNova} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avisos */}
        {avisos.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Megaphone className="size-4" /> Avisos
              </h2>
              <div className="flex flex-col gap-3">
                {avisos.map((a, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    {a.titulo && (
                      <p className="text-sm font-medium">{a.titulo}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{a.mensagem}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dataBR(a.data)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendário */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <CalendarDays className="size-4" /> Calendário
            </h2>
            {eventos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum evento cadastrado para este ano.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {eventos.map((ev, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="w-24 shrink-0 tabular-nums text-muted-foreground">
                      {dataBR(ev.data)}
                      {ev.dataFim ? ` – ${dataBR(ev.dataFim)}` : ""}
                    </span>
                    <span className="font-medium">{ev.titulo}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uso de imagem — consentimento self-service */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Camera className="size-4" /> Uso de imagem e voz
            </h2>
            <p className="text-sm">
              {aluno.autorizaImagem === true
                ? `Você autorizou o uso da imagem e voz de ${aluno.nome} nos canais do instituto.`
                : aluno.autorizaImagem === false
                  ? "Você não autorizou o uso da imagem e voz."
                  : "Você ainda não definiu a autorização de uso de imagem."}
            </p>
            {aluno.autorizaImagemEm && (
              <p className="mt-1 text-xs text-muted-foreground">
                Atualizado em {dataBR(aluno.autorizaImagemEm)}.
              </p>
            )}
            <div className="mt-3 flex gap-2">
              {aluno.autorizaImagem !== true && (
                <Button
                  size="sm"
                  onClick={() => alternarImagem(true)}
                  disabled={salvandoImagem}
                >
                  {salvandoImagem && <Loader2 className="size-4 animate-spin" />}
                  Autorizar
                </Button>
              )}
              {aluno.autorizaImagem !== false && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alternarImagem(false)}
                  disabled={salvandoImagem}
                >
                  {salvandoImagem && <Loader2 className="size-4 animate-spin" />}
                  Não autorizar
                </Button>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Sem sua autorização, o instituto não publica a imagem do seu filho
              nos canais oficiais. Você pode mudar essa escolha quando quiser.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
