import { useCallback, useEffect, useState } from "react";
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
  MessageSquarePlus,
  CloudOff,
  Flame,
  Star,
  Trophy,
  Award,
  Zap,
  Sparkles,
  Lock,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  acessar,
  autorizarImagem,
  clearRespToken,
  obterPainel,
  justificarFalta,
  enfileirarJustificativa,
  lerFilaJustificativas,
  sincronizarJustificativas,
  ehErroDeRede,
  type PainelResponsavel,
  type PresencaItem,
} from "@/features/responsavel/responsavelApi";
import {
  calcularSelos,
  proximoSelo,
  presencasDoAno,
  anosComPresenca,
  resumoDoAno,
  type Selo,
  type ResumoFrequencia,
} from "@/features/responsavel/conquistas";
import { faixaInfo } from "@/features/alunos/faixa";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { VersiculoDoDia } from "@/components/VersiculoDoDia";
import { LogoLockup } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

// Ícone lucide de cada selo (a lógica de conquistas não conhece a UI).
const ICONE_SELO = {
  medal: Medal,
  flame: Flame,
  star: Star,
  trophy: Trophy,
  award: Award,
  zap: Zap,
} as const;

function SeloCard({ selo }: { selo: Selo }) {
  const Icone = ICONE_SELO[selo.icone];
  const pct = selo.meta > 0 ? Math.min(100, Math.round((selo.atual * 100) / selo.meta)) : 0;
  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center ${
        selo.conquistado
          ? "border-primary/40 bg-primary/5"
          : "border-dashed border-border opacity-70"
      }`}
    >
      <div
        className={`flex size-11 items-center justify-center rounded-full ${
          selo.conquistado ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
        }`}
      >
        {selo.conquistado ? <Icone className="size-6" /> : <Lock className="size-4" />}
      </div>
      <div className="text-xs font-semibold leading-tight">{selo.nome}</div>
      <div className="text-[11px] leading-tight text-muted-foreground">{selo.descricao}</div>
      {!selo.conquistado && (
        <div className="mt-0.5 w-full">
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
            {selo.atual}/{selo.meta}
          </div>
        </div>
      )}
    </div>
  );
}

// Card de conquistas do aluno: selos por presença/sequência/assiduidade.
// Recebe já escopado ao ano selecionado (os índices reiniciam a cada ciclo).
function ConquistasCard({
  resumo,
  presencas,
}: {
  resumo: ResumoFrequencia;
  presencas: PresencaItem[];
}) {
  const selos = calcularSelos(resumo, presencas);
  const conquistados = selos.filter((s) => s.conquistado);
  const proximo = proximoSelo(selos);

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Sparkles className="size-4" /> Conquistas
        </h2>
        {conquistados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cada aula presente aproxima o primeiro selo. Bora não faltar! 🥋
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {conquistados.length} selo{conquistados.length > 1 ? "s" : ""} conquistado
            {conquistados.length > 1 ? "s" : ""}.
            {proximo && ` Falta pouco para "${proximo.nome}".`}
          </p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {selos.map((s) => (
            <SeloCard key={s.id} selo={s} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ResponsavelPortal() {
  useDocumentTitle("Portal do Responsável — Instituto Tribo de Davi");
  const [codigo, setCodigo] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [painel, setPainel] = useState<PainelResponsavel | null>(null);
  // Ano do ciclo em exibição (índices reiniciam por ano).
  const [anoSel, setAnoSel] = useState(new Date().getFullYear());
  // Ids das faltas com justificativa aguardando envio (fila offline).
  const [pendentes, setPendentes] = useState<Set<number>>(new Set());

  const atualizarPendentes = useCallback(() => {
    setPendentes(new Set(lerFilaJustificativas().map((j) => j.presencaId)));
  }, []);

  // Recarrega o painel e, antes, tenta esvaziar a fila offline. Chamado no
  // login, ao voltar a conexão e após justificar.
  const recarregar = useCallback(async () => {
    const enviados = await sincronizarJustificativas();
    if (enviados.length > 0) {
      toast.success(
        enviados.length === 1
          ? "Justificativa pendente enviada."
          : `${enviados.length} justificativas pendentes enviadas.`,
      );
    }
    setPainel(await obterPainel());
    atualizarPendentes();
  }, [atualizarPendentes]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!codigo.trim() || !nascimento) {
      setErro("Preencha o código e a data de nascimento.");
      return;
    }
    setCarregando(true);

    // 1) Valida as credenciais. Só um erro AQUI significa código/data errados.
    try {
      await acessar(codigo.trim().toUpperCase(), nascimento);
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status
          ? "Código ou data de nascimento incorretos."
          : "Erro ao conectar. Tente novamente em instantes.",
      );
      setCarregando(false);
      return;
    }

    // 2) Credenciais OK: carrega o painel. Uma falha aqui NÃO é culpa do código —
    // não pode aparecer como "credenciais incorretas".
    try {
      await recarregar();
    } catch {
      clearRespToken();
      setErro("Entrada confirmada, mas houve um erro ao carregar seus dados. Tente novamente em instantes.");
    } finally {
      setCarregando(false);
    }
  }

  // Ao voltar a conexão, reenvia a fila e atualiza o painel (só com sessão ativa).
  useEffect(() => {
    if (!painel) return;
    const aoVoltarOnline = () => {
      recarregar().catch(() => {
        /* segue offline; a fila permanece para a próxima tentativa */
      });
    };
    window.addEventListener("online", aoVoltarOnline);
    return () => window.removeEventListener("online", aoVoltarOnline);
  }, [painel, recarregar]);

  function sair() {
    clearRespToken();
    setPainel(null);
    setCodigo("");
    setNascimento("");
  }

  // Justificar falta
  const [faltaAlvo, setFaltaAlvo] = useState<PresencaItem | null>(null);
  const [textoJustif, setTextoJustif] = useState("");
  const [salvandoJustif, setSalvandoJustif] = useState(false);

  function abrirJustificar(falta: PresencaItem) {
    setFaltaAlvo(falta);
    setTextoJustif(falta.justificativa ?? "");
  }

  async function enviarJustificativa() {
    if (!faltaAlvo) return;
    const texto = textoJustif.trim();
    if (!texto) {
      toast.warning("Escreva o motivo da falta.");
      return;
    }
    setSalvandoJustif(true);
    try {
      await justificarFalta(faltaAlvo.id, texto);
      toast.success("Falta justificada.");
      setFaltaAlvo(null);
      setPainel(await obterPainel());
      atualizarPendentes();
    } catch (err) {
      // Sem rede: guarda para reenviar depois, em vez de perder o que a família
      // escreveu. Erro de regra (validação) volta como aviso normal.
      if (ehErroDeRede(err)) {
        enfileirarJustificativa({
          presencaId: faltaAlvo.id,
          justificativa: texto,
          em: new Date().toISOString(),
        });
        atualizarPendentes();
        setFaltaAlvo(null);
        toast.message("Sem conexão agora — a justificativa será enviada assim que a internet voltar.");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Não foi possível justificar.");
      }
    } finally {
      setSalvandoJustif(false);
    }
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

  const { aluno, graduacoes, avisos, eventos } = painel;

  // Índices reiniciam por ano (ciclo anual): frequência, presenças e conquistas
  // contam só o ano selecionado. O seletor mostra os anos com registro.
  const anos = anosComPresenca(painel.presencas, new Date().getFullYear());
  const presencas = presencasDoAno(painel.presencas, anoSel);
  const frequencia = resumoDoAno(presencas);

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

        {/* Frequência (do ano selecionado) */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Frequência em {anoSel}
              </h2>
              {anos.length > 1 && (
                <div className="flex gap-1">
                  {anos.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAnoSel(a)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums transition-colors ${
                        a === anoSel
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {frequencia.totalAulas === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma aula registrada em {anoSel} ainda.
              </p>
            ) : (
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
                    {frequencia.totalAulas - frequencia.presencas}
                  </div>
                  <div className="text-xs text-muted-foreground">Faltas</div>
                </div>
              </div>
            )}
            {presencas.length > 0 && (
              <div className="mt-4 flex flex-col divide-y divide-border/60">
                {presencas.slice(0, 10).map((p) => {
                  const pendente = pendentes.has(p.id);
                  const justificada = Boolean(p.justificadaEm) || Boolean(p.justificativa);
                  return (
                    <div key={p.id} className="py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="tabular-nums text-muted-foreground">
                          {dataBR(p.data)}
                        </span>
                        {p.presente ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="size-4" /> Presente
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-destructive">
                              <XCircle className="size-4" /> Falta
                            </span>
                            {pendente ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                                <CloudOff className="size-3" /> Envio pendente
                              </span>
                            ) : justificada ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground"
                                onClick={() => abrirJustificar(p)}
                              >
                                Justificada · editar
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => abrirJustificar(p)}
                              >
                                <MessageSquarePlus className="size-3.5" />
                                Justificar
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Texto da justificativa (enviada ou aguardando envio). */}
                      {!p.presente && (justificada || pendente) && p.justificativa && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          “{p.justificativa}”
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conquistas (gamificação da frequência) — do ano selecionado */}
        <ConquistasCard resumo={frequencia} presencas={presencas} />

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

      {/* Justificar falta */}
      <Dialog open={faltaAlvo !== null} onOpenChange={(v) => !v && setFaltaAlvo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Justificar falta</DialogTitle>
            <DialogDescription>
              {faltaAlvo && `Falta do dia ${dataBR(faltaAlvo.data)}.`} Conte ao
              professor o motivo — por exemplo, uma consulta médica ou um
              compromisso de família.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={textoJustif}
            onChange={(e) => setTextoJustif(e.target.value)}
            placeholder="Ex.: Estava doente, com atestado."
            rows={4}
            maxLength={500}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaltaAlvo(null)} disabled={salvandoJustif}>
              Cancelar
            </Button>
            <Button onClick={enviarJustificativa} disabled={salvandoJustif}>
              {salvandoJustif && <Loader2 className="size-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
