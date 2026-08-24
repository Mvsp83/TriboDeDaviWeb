import { useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Users,
  X,
  QrCode,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAulas } from "@/features/aulas/aulasApi";
import { useAlunos } from "@/features/alunos/alunosApi";
import { usePolos } from "@/features/polos/polosApi";
import {
  useAtualizarPresenca,
  usePresencasDaAula,
  useSalvarChamada,
  type MarcaChamada,
} from "@/features/chamada/chamadaApi";
import { faixaInfo } from "@/features/alunos/faixa";
import { chamadaPendenteDaAula } from "@/lib/offlineQueue";
import { dataBR, horaCurta } from "@/lib/format";
import type { Aluno, Aula, Presenca } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AvisarFaltasDialog } from "@/features/chamada/AvisarFaltasDialog";
import { LeitorQrDialog } from "@/features/chamada/LeitorQrDialog";
import { OcorrenciasDialog } from "@/features/ocorrencias/OcorrenciasDialog";

function mensagemErro(e: unknown, padrao: string): string {
  return e instanceof Error && e.message ? e.message : padrao;
}

export function ChamadaAulaPage() {
  const { aulaId: aulaIdParam } = useParams();
  const aulaId = Number(aulaIdParam);

  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const podeEditar = sessao?.isProfessor ?? false;

  const { data: aulas, isLoading: carregandoAulas } = useAulas(admin);
  const { data: polos } = usePolos();
  const aula = useMemo(
    () => (aulas ?? []).find((a) => a.id === aulaId),
    [aulas, aulaId],
  );

  const nomePolo = useMemo(() => {
    const p = (polos ?? []).find((x) => x.id === aula?.poloId);
    return p?.nome ?? "-";
  }, [polos, aula]);

  if (carregandoAulas) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!aula) {
    return (
      <div className="space-y-4">
        <VoltarLink />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aula não encontrada.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <VoltarLink />
      <CabecalhoAula aula={aula} nomePolo={nomePolo} />

      {aula.presencaSalva ? (
        <ChamadaSalva aula={aula} podeEditar={podeEditar} />
      ) : (
        <ChamadaPendente aula={aula} admin={admin} podeEditar={podeEditar} />
      )}
    </div>
  );
}

function VoltarLink() {
  const navigate = useNavigate();
  const location = useLocation();
  // Volta para a origem (Aulas ou lista de Chamada). location.key é "default"
  // quando não há histórico interno (link direto/recarga) — aí cai em /aulas.
  const voltar = () =>
    location.key !== "default" ? navigate(-1) : navigate("/aulas");

  return (
    <button
      type="button"
      onClick={voltar}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Voltar
    </button>
  );
}

function CabecalhoAula({ aula, nomePolo }: { aula: Aula; nomePolo: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight tabular-nums">
          {dataBR(aula.data)}
        </h1>
        {aula.presencaSalva ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="size-3.5" /> Salva
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <Clock className="size-3.5" /> Pendente
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <Badge variant="outline">Turma {aula.turma}</Badge>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <CalendarDays className="size-3.5" />
          {horaCurta(aula.horaInicio)}–{horaCurta(aula.horaFim)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" /> {nomePolo}
        </span>
      </div>
    </div>
  );
}

// ── Aula pendente: registra o lote inteiro (batch) ────────────────────────
function ChamadaPendente({
  aula,
  admin,
  podeEditar,
}: {
  aula: Aula;
  admin: boolean;
  podeEditar: boolean;
}) {
  const navigate = useNavigate();
  const { data: alunos, isLoading } = useAlunos(admin);
  const salvar = useSalvarChamada();
  const [marcadas, setMarcadas] = useState<Record<number, boolean>>({});
  const [confirmando, setConfirmando] = useState(false);
  const [alunoOcorrencias, setAlunoOcorrencias] = useState<{ id: number; nome: string } | null>(null);
  // Ausentes da chamada recém-salva, para oferecer o aviso aos responsáveis.
  const [avisarAusentes, setAvisarAusentes] = useState<Aluno[] | null>(null);
  const [lendoQr, setLendoQr] = useState(false);

  // Chamada já salva neste aparelho, aguardando internet (fila offline).
  const pendenteLocal = chamadaPendenteDaAula(aula.id);

  const roster = useMemo(
    () =>
      (alunos ?? [])
        .filter((a) => a.poloId === aula.poloId && a.turma === aula.turma)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [alunos, aula],
  );

  const presentes = roster.filter((a) => marcadas[a.id]).length;

  const marcarTodos = (valor: boolean) =>
    setMarcadas(
      valor ? Object.fromEntries(roster.map((a) => [a.id, true])) : {},
    );

  const confirmarSalvar = () => {
    const marcas: MarcaChamada[] = roster.map((a) => ({
      alunoId: a.id,
      nomeAluno: a.nome,
      estaPresente: !!marcadas[a.id],
    }));
    salvar.mutate(
      { aulaId: aula.id, poloId: aula.poloId, data: aula.data, marcas },
      {
        onSuccess: ({ enfileirada }) => {
          toast.success(
            enfileirada
              ? "Chamada salva no aparelho. Será enviada quando houver internet."
              : "Chamada salva com sucesso.",
          );
          // Com faltas, oferece avisar os responsáveis antes de sair da tela.
          const ausentes = roster.filter((a) => !marcadas[a.id]);
          if (ausentes.length > 0) setAvisarAusentes(ausentes);
          else navigate("/chamada");
        },
        onError: (e) =>
          toast.error(mensagemErro(e, "Não foi possível salvar a chamada.")),
        onSettled: () => setConfirmando(false),
      },
    );
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  // Já registrada offline: mostra as marcas enfileiradas em modo leitura, sem
  // permitir reenvio (evita chamada duplicada na fila).
  if (pendenteLocal) {
    const presentesFila = pendenteLocal.marcas.filter((m) => m.estaPresente).length;
    const ordenadas = [...pendenteLocal.marcas].sort((a, b) =>
      a.nomeAluno.localeCompare(b.nomeAluno, "pt-BR"),
    );
    return (
      <div className="space-y-3">
        <AvisoSomenteLeitura texto="Chamada salva neste aparelho, aguardando internet para sincronizar. Ela será enviada automaticamente quando a conexão voltar." />
        <p className="text-sm text-muted-foreground">
          <Users className="mr-1 inline size-4" />
          {presentesFila} de {ordenadas.length} presentes
        </p>
        <ListaAlunos>
          {ordenadas.map((m) => (
            <LinhaAluno
              key={m.alunoId}
              nome={m.nomeAluno}
              presente={m.estaPresente}
              editavel={false}
            />
          ))}
        </ListaAlunos>
      </div>
    );
  }

  if (roster.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nenhum aluno cadastrado neste polo e turma.
        </CardContent>
      </Card>
    );
  }

  if (!podeEditar) {
    return (
      <div className="space-y-3">
        <AvisoSomenteLeitura texto="Aula ainda pendente. Somente o professor do polo pode registrar as presenças." />
        <ListaAlunos>
          {roster.map((a) => (
            <LinhaAluno
              key={a.id}
              nome={a.nome}
              faixa={a.faixa}
              presente={false}
              editavel={false}
            />
          ))}
        </ListaAlunos>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <Users className="mr-1 inline size-4" />
          {presentes} de {roster.length} presentes
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLendoQr(true)}>
            <QrCode className="size-4" />
            Ler QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => marcarTodos(true)}>
            Marcar todos
          </Button>
          <Button variant="ghost" size="sm" onClick={() => marcarTodos(false)}>
            Limpar
          </Button>
        </div>
      </div>

      <ListaAlunos>
        {roster.map((a) => (
          <LinhaAluno
            key={a.id}
            nome={a.nome}
            faixa={a.faixa}
            presente={!!marcadas[a.id]}
            editavel
            onToggle={() =>
              setMarcadas((m) => ({ ...m, [a.id]: !m[a.id] }))
            }
            onOcorrencia={() => setAlunoOcorrencias({ id: a.id, nome: a.nome })}
          />
        ))}
      </ListaAlunos>

      {/* Barra fixa de ação */}
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <Button
          className="w-full"
          disabled={salvar.isPending}
          onClick={() => setConfirmando(true)}
        >
          {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar chamada ({presentes}/{roster.length})
        </Button>
      </div>

      <ConfirmDialog
        aberto={confirmando}
        onOpenChange={setConfirmando}
        titulo="Salvar chamada?"
        descricao={
          <>
            Serão registradas <strong>{presentes} presenças</strong> e{" "}
            <strong>{roster.length - presentes} faltas</strong>. Após salvar, a
            aula fica travada e ajustes são feitos aluno a aluno.
          </>
        }
        confirmarLabel="Salvar"
        destrutivo={false}
        carregando={salvar.isPending}
        onConfirmar={confirmarSalvar}
      />

      <LeitorQrDialog
        aberto={lendoQr}
        onOpenChange={setLendoQr}
        roster={roster.map((a) => ({ id: a.id, nome: a.nome }))}
        jaPresente={(id) => !!marcadas[id]}
        onPresente={(id) => setMarcadas((m) => ({ ...m, [id]: true }))}
      />

      <OcorrenciasDialog
        alunoId={alunoOcorrencias?.id ?? null}
        alunoNome={alunoOcorrencias?.nome ?? ""}
        aberto={alunoOcorrencias !== null}
        onOpenChange={(o) => !o && setAlunoOcorrencias(null)}
      />

      <AvisarFaltasDialog
        aberto={avisarAusentes !== null}
        onOpenChange={(v) => {
          if (!v) {
            setAvisarAusentes(null);
            navigate("/chamada");
          }
        }}
        ausentes={avisarAusentes ?? []}
        dataAula={aula.data}
        onConcluir={() => {
          setAvisarAusentes(null);
          navigate("/chamada");
        }}
      />
    </div>
  );
}

// ── Aula já salva: ajustes registro a registro (update) ───────────────────
function ChamadaSalva({
  aula,
  podeEditar,
}: {
  aula: Aula;
  podeEditar: boolean;
}) {
  const { data: presencas, isLoading } = usePresencasDaAula(aula.id);
  const atualizar = useAtualizarPresenca();
  // Espelho otimista: mostra o novo valor enquanto o PUT roda.
  const [override, setOverride] = useState<Record<number, boolean>>({});
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  const linhas = useMemo(
    () =>
      [...(presencas ?? [])].sort((a, b) =>
        a.nomeAluno.localeCompare(b.nomeAluno, "pt-BR"),
      ),
    [presencas],
  );

  const valorAtual = (p: Presenca) => override[p.id] ?? p.estaPresente;
  const presentes = linhas.filter(valorAtual).length;

  const alternar = (p: Presenca) => {
    const novo = !valorAtual(p);
    setOverride((o) => ({ ...o, [p.id]: novo }));
    setSalvandoId(p.id);
    atualizar.mutate(
      { ...p, estaPresente: novo },
      {
        onSuccess: () => toast.success("Presença atualizada."),
        onError: (e) => {
          setOverride((o) => {
            const n = { ...o };
            delete n[p.id];
            return n;
          });
          toast.error(mensagemErro(e, "Não foi possível atualizar."));
        },
        onSettled: () => setSalvandoId(null),
      },
    );
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  if (linhas.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nenhuma presença registrada para esta aula.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <Users className="mr-1 inline size-4" />
          {presentes} de {linhas.length} presentes
        </p>
      </div>

      {!podeEditar && (
        <AvisoSomenteLeitura texto="Somente leitura — apenas o professor do polo pode alterar as presenças." />
      )}

      <ListaAlunos>
        {linhas.map((p) => (
          <LinhaAluno
            key={p.id}
            nome={p.nomeAluno}
            presente={valorAtual(p)}
            editavel={podeEditar}
            salvando={salvandoId === p.id}
            onToggle={() => alternar(p)}
          />
        ))}
      </ListaAlunos>
    </div>
  );
}

// ── Componentes de apresentação ───────────────────────────────────────────
function ListaAlunos({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="divide-y divide-border p-0">{children}</CardContent>
    </Card>
  );
}

function AvisoSomenteLeitura({ texto }: { texto: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
      {texto}
    </div>
  );
}

function LinhaAluno({
  nome,
  faixa,
  presente,
  editavel,
  salvando = false,
  onToggle,
  onOcorrencia,
}: {
  nome: string;
  faixa?: number;
  presente: boolean;
  editavel: boolean;
  salvando?: boolean;
  onToggle?: () => void;
  onOcorrencia?: () => void;
}) {
  const info = faixa != null ? faixaInfo(faixa) : null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{nome}</span>
        {info && (
          <span
            className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: info.cor, color: info.texto }}
          >
            {info.nome}
          </span>
        )}
      </div>

      {onOcorrencia && (
        <button
          type="button"
          onClick={onOcorrencia}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          title="Comportamento e recados (aparecem no portal da família)"
          aria-label="Comportamento e recados"
        >
          <MessageSquare className="size-4" />
        </button>
      )}

      <button
        type="button"
        disabled={!editavel || salvando}
        onClick={onToggle}
        className={[
          "inline-flex h-8 w-28 shrink-0 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
          presente
            ? "bg-success/15 text-success"
            : "bg-secondary text-muted-foreground",
          editavel && !salvando ? "cursor-pointer hover:opacity-80" : "",
          !editavel ? "cursor-default" : "",
        ].join(" ")}
      >
        {salvando ? (
          <Loader2 className="size-4 animate-spin" />
        ) : presente ? (
          <>
            <Check className="size-4" /> Presente
          </>
        ) : (
          <>
            <X className="size-4" /> Ausente
          </>
        )}
      </button>
    </div>
  );
}
