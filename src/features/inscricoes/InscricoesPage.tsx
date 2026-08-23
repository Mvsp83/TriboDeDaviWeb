import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList,
  Check,
  X,
  CircleAlert,
  Loader2,
  Pill,
  ChevronRight,
  Printer,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { usePolos } from "@/features/polos/polosApi";
import { ApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import { faixaInfo } from "@/features/alunos/faixa";
import {
  PARQ,
  type RespostasSaude,
  type RespostasFamiliar,
} from "@/features/matricula/questionarios";
import {
  useFilaInscricoes,
  useAprovarInscricao,
  useRecusarInscricao,
  useMatricularAno,
  STATUS_LABEL,
  StatusInscricao,
  type Inscricao,
} from "@/features/inscricoes/inscricoesApi";
import { imprimirFicha } from "@/features/inscricoes/fichaPdf";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PARENTESCOS = ["Pai", "Mãe", "Tio", "Tia", "Avô/Avó", "Outro"];

function parse<T>(json: string | null | undefined, vazio: T): T {
  if (!json) return vazio;
  try {
    return JSON.parse(json) as T;
  } catch {
    return vazio;
  }
}

function idade(iso: string): number | null {
  const n = new Date(iso);
  if (Number.isNaN(n.getTime())) return null;
  const hoje = new Date();
  let i = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) i--;
  return i;
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{rotulo}:</span>
      <span className="min-w-0 break-words font-medium">{valor}</span>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold">{titulo}</p>
      {children}
    </div>
  );
}

// ── Detalhe + revisão ─────────────────────────────────────────────────────
function DetalheInscricao({
  inscricao,
  onFechar,
}: {
  inscricao: Inscricao;
  onFechar: () => void;
}) {
  const { data: polos } = usePolos();
  const aprovar = useAprovarInscricao();
  const recusar = useRecusarInscricao();

  // Polo e turma são editáveis: é aqui que se corrige quem marcou errado.
  const [poloId, setPoloId] = useState(String(inscricao.poloId));
  const [turma, setTurma] = useState(String(inscricao.turma ?? inscricao.turmaAnterior ?? 1));
  const [observacao, setObservacao] = useState("");
  const [confirmandoRecusa, setConfirmandoRecusa] = useState(false);

  const saude = parse<Partial<RespostasSaude>>(inscricao.respostasSaudeJson, {});
  const familiar = parse<Partial<RespostasFamiliar>>(inscricao.respostasFamiliarJson, {});
  const simsNoParq = PARQ.filter((p) => saude.parq?.[p.id] === true);

  const pendente = inscricao.status === StatusInscricao.Pendente;
  const faixa = faixaInfo(inscricao.faixa);
  const anos = idade(inscricao.dataNascimento);

  async function confirmarAprovacao() {
    try {
      await aprovar.mutateAsync({
        id: inscricao.id,
        revisao: { poloId: Number(poloId), turma: Number(turma), observacao },
      });
      toast.success("Inscrição aprovada e aluno matriculado!");
      onFechar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao aprovar.");
    }
  }

  async function confirmarRecusa() {
    if (!observacao.trim()) {
      toast.warning("Informe o motivo da recusa.");
      return;
    }
    try {
      await recusar.mutateAsync({ id: inscricao.id, motivo: observacao });
      toast.success("Inscrição recusada.");
      onFechar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao recusar.");
    }
  }

  const ocupado = aprovar.isPending || recusar.isPending;

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{inscricao.nome}</DialogTitle>
          <DialogDescription>
            Enviada em {dataBR(inscricao.dataEnvio)} · {STATUS_LABEL[inscricao.status]}
          </DialogDescription>
        </DialogHeader>

        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => {
            if (!imprimirFicha(inscricao)) {
              toast.error("Permita pop-ups para gerar o PDF da ficha.");
            }
          }}
        >
          <Printer className="size-4" />
          Imprimir ficha
        </Button>

        {/* Alerta de saúde primeiro: é o que muda a conduta na aula. */}
        {(inscricao.temRestricaoMedica || inscricao.medicamentos) && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-warning">
              <CircleAlert className="size-4" />
              Atenção à saúde
            </p>
            {simsNoParq.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {simsNoParq.map((p) => (
                  <li key={p.id}>• {p.texto}</li>
                ))}
              </ul>
            )}
            {inscricao.medicamentos && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Pill className="mt-0.5 size-3.5 shrink-0" />
                <span>Medicamentos: {inscricao.medicamentos}</span>
              </p>
            )}
            {saude.aceitouTermoResponsabilidade && (
              <p className="mt-2 text-xs text-muted-foreground">
                O responsável aceitou o Termo de Responsabilidade (Anexo II).
              </p>
            )}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Secao titulo="Aluno">
            <Linha rotulo="Nascimento" valor={`${dataBR(inscricao.dataNascimento)}${anos != null ? ` (${anos} anos)` : ""}`} />
            <Linha rotulo="RG" valor={inscricao.rg} />
            <Linha rotulo="CPF" valor={inscricao.cpf} />
            <Linha rotulo="Faixa" valor={faixa.nome} />
            <Linha rotulo="Peso" valor={inscricao.peso ? `${inscricao.peso} kg` : null} />
            <Linha rotulo="Altura" valor={inscricao.altura ? `${inscricao.altura} m` : null} />
            <Linha rotulo="Escola" valor={inscricao.escola} />
            <Linha rotulo="Série" valor={inscricao.serie} />
            <Linha rotulo="Período" valor={inscricao.periodo} />
            <Linha
              rotulo="Já era aluno"
              valor={inscricao.jaEraAluno ? `Sim${inscricao.turmaAnterior ? ` (turma ${inscricao.turmaAnterior})` : ""}` : "Não"}
            />
          </Secao>

          <Secao titulo="Responsável">
            <Linha rotulo="Nome" valor={inscricao.nomeResponsavel} />
            <Linha
              rotulo="Parentesco"
              valor={inscricao.parentescoOutro || PARENTESCOS[inscricao.parentesco] || "-"}
            />
            <Linha rotulo="RG" valor={inscricao.rgResponsavel} />
            <Linha rotulo="CPF" valor={inscricao.cpfResponsavel} />
            <Linha rotulo="WhatsApp" valor={inscricao.whatsApp} />
            <Linha rotulo="Telefone 2" valor={inscricao.telefone2} />
            <Linha
              rotulo="Endereço"
              valor={[inscricao.rua, inscricao.numero, inscricao.complemento]
                .filter(Boolean)
                .join(", ")}
            />
            <Linha
              rotulo="Bairro"
              valor={[inscricao.bairro, inscricao.cidade].filter(Boolean).join(" - ")}
            />
          </Secao>
        </div>

        <Secao titulo="Questionário de aptidão (Lei 16.331/2014)">
          <ul className="space-y-1">
            {PARQ.map((p, i) => {
              const r = saude.parq?.[p.id];
              return (
                <li key={p.id} className="flex gap-2 text-xs">
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded px-1.5 font-semibold",
                      r === true
                        ? "bg-warning/20 text-warning"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {r === true ? "SIM" : r === false ? "não" : "—"}
                  </span>
                  <span className="text-muted-foreground">
                    {i + 1}. {p.texto}
                  </span>
                </li>
              );
            })}
          </ul>
        </Secao>

        {(saude.condicoes?.length ||
          saude.sintomas?.length ||
          saude.acompanhamentos?.length ||
          saude.condicaoOutra) && (
          <Secao titulo="Informações de saúde">
            <Linha rotulo="Condições" valor={[...(saude.condicoes ?? []), saude.condicaoOutra].filter(Boolean).join(", ")} />
            <Linha rotulo="Sintomas" valor={saude.sintomas?.join(", ")} />
            <Linha rotulo="Acompanhamento" valor={saude.acompanhamentos?.join(", ")} />
            <Linha rotulo="Objetivos" valor={saude.objetivos?.join(", ")} />
          </Secao>
        )}

        {(familiar.situacaoConjugal || familiar.motivos?.length) && (
          <Secao titulo="Pesquisa familiar">
            <Linha
              rotulo="Situação conjugal"
              valor={familiar.situacaoConjugalOutro || familiar.situacaoConjugal}
            />
            <Linha rotulo="Pessoas na casa" valor={familiar.pessoasNaCasa} />
            <Linha rotulo="Motivos" valor={familiar.motivos?.join(", ")} />
          </Secao>
        )}

        <Secao titulo="Termos aceitos">
          <div className="flex flex-wrap gap-1.5">
            {[
              ["Participação", inscricao.aceitouTermo],
              ["Comodato", inscricao.aceitouComodato],
              ["Imagem", inscricao.aceitouImagem],
              ["LGPD", inscricao.aceitouLgpd],
            ].map(([rotulo, ok]) => (
              <Badge key={rotulo as string} variant={ok ? "success" : "outline"}>
                {ok ? "✓" : "✗"} {rotulo as string}
              </Badge>
            ))}
          </div>
          <Linha rotulo="Assinatura" valor={inscricao.nomeAssinatura} />
          <Linha rotulo="Versão dos termos" valor={inscricao.versaoTermos} />
        </Secao>

        {pendente ? (
          <>
            <div className="rounded-md border border-border bg-secondary/30 p-3">
              <p className="mb-3 text-sm font-semibold">Confirme o destino</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5">Polo</Label>
                  <Select value={poloId} onValueChange={setPoloId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(polos ?? []).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5">Turma</Label>
                  <Select value={turma} onValueChange={setTurma}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Turma 1</SelectItem>
                      <SelectItem value="2">Turma 2</SelectItem>
                      <SelectItem value="3">Turma 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3">
                <Label className="mb-1.5">
                  Observação {confirmandoRecusa && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  placeholder={
                    confirmandoRecusa ? "Motivo da recusa" : "Opcional"
                  }
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              {confirmandoRecusa ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmandoRecusa(false)}
                    disabled={ocupado}
                  >
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={confirmarRecusa} disabled={ocupado}>
                    {recusar.isPending && <Loader2 className="size-4 animate-spin" />}
                    Confirmar recusa
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmandoRecusa(true)}
                    disabled={ocupado}
                  >
                    <X className="size-4" />
                    Recusar
                  </Button>
                  <Button onClick={confirmarAprovacao} disabled={ocupado}>
                    {aprovar.isPending && <Loader2 className="size-4 animate-spin" />}
                    <Check className="size-4" />
                    Aprovar e matricular
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        ) : (
          <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
            <p className="font-medium">{STATUS_LABEL[inscricao.status]}</p>
            {inscricao.revisadoPor && (
              <p className="text-muted-foreground">
                Por {inscricao.revisadoPor}
                {inscricao.dataRevisao ? ` em ${dataBR(inscricao.dataRevisao)}` : ""}
              </p>
            )}
            {inscricao.observacaoRevisao && (
              <p className="mt-1 text-muted-foreground">{inscricao.observacaoRevisao}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Página ────────────────────────────────────────────────────────────────
export function InscricoesPage() {
  const { sessao } = useAuth();
  const anoAtual = new Date().getFullYear();

  const [status, setStatus] = useState<string>("0");
  const [ano, setAno] = useState(String(anoAtual));
  const [aberta, setAberta] = useState<Inscricao | null>(null);
  const [confirmarMatricula, setConfirmarMatricula] = useState(false);

  const statusNum = status === "todas" ? null : Number(status);
  const { data: inscricoes, isLoading, isError } = useFilaInscricoes(statusNum, Number(ano));
  const matricularAno = useMatricularAno();

  async function executarMatriculaAno() {
    try {
      const r = await matricularAno.mutateAsync(Number(ano));
      toast.success(
        r.criadas > 0
          ? `${r.criadas} aluno(s) matriculado(s) em ${ano}. ${r.jaMatriculados} já estavam.`
          : `Todos os ${r.totalAlunos} alunos já estavam matriculados em ${ano}.`,
      );
      setConfirmarMatricula(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível matricular.");
    }
  }

  const anos = useMemo(
    () => [anoAtual, anoAtual - 1, anoAtual - 2].map(String),
    [anoAtual],
  );

  const lista = inscricoes ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <ClipboardList className="mt-0.5 size-4 shrink-0" />
        <p>
          Fichas enviadas pelo site. Confira os dados, <span className="font-medium text-foreground">corrija o polo e a turma se
          necessário</span> e aprove — o aluno é criado e matriculado no ano.
          {!sessao?.isAdministrador && " Você vê apenas as inscrições do seu polo."}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-40">
            <Label className="mb-1.5">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Pendentes</SelectItem>
                <SelectItem value="1">Aprovadas</SelectItem>
                <SelectItem value="2">Recusadas</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Label className="mb-1.5">Ano</Label>
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="ml-auto text-sm text-muted-foreground">
            {isLoading ? "Carregando..." : `${lista.length} inscrição(ões)`}
          </p>
          {/* Virada de ano: matricula em lote quem já é aluno mas ainda não tem
              matrícula no ano selecionado. */}
          <Button
            variant="outline"
            onClick={() => setConfirmarMatricula(true)}
            disabled={matricularAno.isPending}
          >
            {matricularAno.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Matricular alunos de {ano}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmarMatricula} onOpenChange={setConfirmarMatricula}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Matricular alunos de {ano}?</DialogTitle>
            <DialogDescription>
              Cria a matrícula de {ano} para{" "}
              {sessao?.isAdministrador ? "todos os alunos ativos" : "os alunos do seu polo"}{" "}
              que ainda não têm matrícula neste ano, usando o polo e a turma do
              cadastro atual. Quem já está matriculado não é afetado. Use isto na
              virada de ano para marcar quem segue no projeto.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarMatricula(false)} disabled={matricularAno.isPending}>
              Cancelar
            </Button>
            <Button onClick={executarMatriculaAno} disabled={matricularAno.isPending}>
              {matricularAno.isPending && <Loader2 className="size-4 animate-spin" />}
              <UserPlus className="size-4" />
              Matricular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            Erro ao carregar as inscrições.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && lista.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma inscrição com os filtros atuais.
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        lista.map((i) => (
          <Card
            key={i.id}
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => setAberta(i)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{i.nome}</p>
                  {i.temRestricaoMedica && (
                    <Badge variant="warning" className="gap-1">
                      <CircleAlert className="size-3" /> Saúde
                    </Badge>
                  )}
                  {i.jaEraAluno && <Badge variant="outline">Rematrícula</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {i.poloNome ?? "-"} · resp. {i.nomeResponsavel} · {i.whatsApp}
                </p>
                <p className="text-xs text-muted-foreground">
                  Enviada em {dataBR(i.dataEnvio)}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}

      {aberta && (
        <DetalheInscricao inscricao={aberta} onFechar={() => setAberta(null)} />
      )}
    </div>
  );
}
