import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Inbox, MessageSquarePlus, Send } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useUsuarios } from "@/features/usuarios/usuariosApi";
import { ROLE_LABEL } from "@/types";
import { dataHora } from "@/lib/format";
import { toApiError } from "@/lib/api";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIA_LABEL,
  STATUS,
  STATUS_LABEL,
  useAlterarStatusSolicitacao,
  useCriarSolicitacao,
  useResponderSolicitacao,
  useSolicitacao,
  useSolicitacoes,
  type Solicitacao,
} from "@/features/solicitacoes/solicitacoesApi";

function statusVariant(status: number): "warning" | "success" | "secondary" {
  if (status === STATUS.Aberta) return "warning";
  if (status === STATUS.Resolvida) return "success";
  return "secondary";
}

// ── Diálogo: nova solicitação ────────────────────────────────────────────────

function NovaSolicitacaoDialog({
  aberto,
  onFechar,
  podeMirarProfessor,
}: {
  aberto: boolean;
  onFechar: () => void;
  podeMirarProfessor: boolean;
}) {
  const [assunto, setAssunto] = useState("");
  const [categoria, setCategoria] = useState("0");
  const [texto, setTexto] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const criar = useCriarSolicitacao();

  // Só admin/supervisor precisa listar professores para direcionar.
  const usuarios = useUsuarios(podeMirarProfessor);
  const professores = useMemo(
    () => (usuarios.data ?? []).filter((u) => u.role === 2),
    [usuarios.data],
  );

  function limpar() {
    setAssunto("");
    setCategoria("0");
    setTexto("");
    setDestinatario("");
  }

  async function enviar() {
    if (!assunto.trim() || !texto.trim()) {
      toast.error("Preencha o assunto e a mensagem.");
      return;
    }
    const prof = professores.find((p) => p.login === destinatario);
    try {
      await criar.mutateAsync({
        assunto: assunto.trim(),
        categoria: Number(categoria),
        texto: texto.trim(),
        ...(podeMirarProfessor && prof
          ? {
              destinatarioLogin: prof.login,
              poloId: prof.poloId ?? null,
              poloNome: prof.poloNome ?? "",
            }
          : {}),
      });
      toast.success("Solicitação enviada.");
      limpar();
      onFechar();
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova solicitação</DialogTitle>
          <DialogDescription>
            {podeMirarProfessor
              ? "Envie para a equipe ou direcione a um professor de um polo."
              : "Sua solicitação vai para a administração."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex.: Preciso de quimonos no polo"
              maxLength={150}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_LABEL).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {podeMirarProfessor && (
              <div className="space-y-1.5">
                <Label>Professor (opcional)</Label>
                <Select value={destinatario} onValueChange={setDestinatario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toda a equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map((p) => (
                      <SelectItem key={p.login} value={p.login}>
                        {p.login}
                        {p.poloNome ? ` — ${p.poloNome}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="texto">Mensagem</Label>
            <Textarea
              id="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Descreva o que você precisa."
              rows={5}
              maxLength={2000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={enviar} disabled={criar.isPending}>
            <Send className="size-4" />
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Diálogo: detalhe + conversa ──────────────────────────────────────────────

function DetalheDialog({
  id,
  onFechar,
  podeGerir,
  loginAtual,
}: {
  id: number | null;
  onFechar: () => void;
  podeGerir: boolean;
  loginAtual: string;
}) {
  const { data: s, isLoading } = useSolicitacao(id);
  const [resposta, setResposta] = useState("");
  const responder = useResponderSolicitacao();
  const alterarStatus = useAlterarStatusSolicitacao();

  const podeMudarStatus = s && (podeGerir || s.criadoPorLogin === loginAtual);

  async function enviarResposta() {
    if (!s || !resposta.trim()) return;
    try {
      await responder.mutateAsync({ id: s.id, texto: resposta.trim() });
      setResposta("");
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  async function mudarStatus(status: number) {
    if (!s) return;
    try {
      await alterarStatus.mutateAsync({ id: s.id, status });
      toast.success("Status atualizado.");
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  return (
    <Dialog open={id != null} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        {isLoading || !s ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Carregando…
          </p>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="pr-6">{s.assunto}</DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="outline">{CATEGORIA_LABEL[s.categoria]}</Badge>
                  <Badge variant={statusVariant(s.status)}>
                    {STATUS_LABEL[s.status]}
                  </Badge>
                  {s.poloNome && (
                    <span className="text-xs text-muted-foreground">
                      {s.poloNome}
                    </span>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            {/* Conversa */}
            <div className="-mx-1 flex-1 space-y-3 overflow-y-auto px-1 py-1">
              {s.mensagens.map((m) => {
                const meu = m.autorLogin === loginAtual;
                return (
                  <div
                    key={m.id}
                    className={`rounded-lg border border-border p-3 text-sm ${
                      meu ? "bg-primary/5" : "bg-card"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {m.autorLogin}
                        <span className="ml-1 font-normal text-muted-foreground">
                          · {ROLE_LABEL[m.autorRole] ?? "—"}
                        </span>
                      </span>
                      <span>{dataHora(m.dataEnvio)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.texto}</p>
                  </div>
                );
              })}
            </div>

            {/* Resposta */}
            {s.status !== STATUS.Resolvida && (
              <div className="space-y-2">
                <Textarea
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  placeholder="Escreva uma resposta…"
                  rows={2}
                  maxLength={2000}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={enviarResposta}
                    disabled={responder.isPending || !resposta.trim()}
                  >
                    <Send className="size-4" />
                    Responder
                  </Button>
                </div>
              </div>
            )}

            {podeMudarStatus && (
              <DialogFooter className="border-t border-border pt-3 sm:justify-start">
                <span className="mr-1 self-center text-xs text-muted-foreground">
                  Status:
                </span>
                {s.status !== STATUS.EmAndamento && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => mudarStatus(STATUS.EmAndamento)}
                    disabled={alterarStatus.isPending}
                  >
                    Em andamento
                  </Button>
                )}
                {s.status !== STATUS.Resolvida ? (
                  <Button
                    size="sm"
                    onClick={() => mudarStatus(STATUS.Resolvida)}
                    disabled={alterarStatus.isPending}
                  >
                    Marcar resolvida
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => mudarStatus(STATUS.Aberta)}
                    disabled={alterarStatus.isPending}
                  >
                    Reabrir
                  </Button>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────

export function SolicitacoesPage() {
  useDocumentTitle("Solicitações internas");
  const { sessao } = useAuth();
  const podeGerir =
    Boolean(sessao?.isAdministrador) || sessao?.role === "Supervisor";
  const loginAtual = sessao?.login ?? "";

  const { data: solicitacoes = [], isLoading } = useSolicitacoes();
  const [nova, setNova] = useState(false);
  const [detalheId, setDetalheId] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Solicitações internas
          </h1>
          <p className="text-sm text-muted-foreground">
            {podeGerir
              ? "Pedidos da equipe e mensagens para os professores."
              : "Envie pedidos para a administração e acompanhe as respostas."}
          </p>
        </div>
        <Button onClick={() => setNova(true)}>
          <MessageSquarePlus className="size-4" />
          Nova
        </Button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Carregando…
        </p>
      ) : solicitacoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <Inbox className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma solicitação por aqui ainda.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {solicitacoes.map((s: Solicitacao) => (
            <li key={s.id}>
              <button
                onClick={() => setDetalheId(s.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left hover:border-primary/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{s.assunto}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>{CATEGORIA_LABEL[s.categoria]}</span>
                    <span>·</span>
                    <span>{s.criadoPorLogin}</span>
                    {s.poloNome && (
                      <>
                        <span>·</span>
                        <span>{s.poloNome}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{dataHora(s.dataAtualizacao)}</span>
                  </div>
                </div>
                <Badge variant={statusVariant(s.status)}>
                  {STATUS_LABEL[s.status]}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      <NovaSolicitacaoDialog
        aberto={nova}
        onFechar={() => setNova(false)}
        podeMirarProfessor={podeGerir}
      />
      <DetalheDialog
        id={detalheId}
        onFechar={() => setDetalheId(null)}
        podeGerir={podeGerir}
        loginAtual={loginAtual}
      />
    </div>
  );
}
