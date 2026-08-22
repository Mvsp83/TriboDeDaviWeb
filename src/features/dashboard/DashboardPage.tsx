import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { VersiculoDoDia } from "@/components/VersiculoDoDia";
import {
  Users,
  MapPin,
  Cake,
  CalendarDays,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ClipboardCheck,
  ChevronRight,
  AlertTriangle,
  MessageCircle,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useDashboard, type DashboardData } from "@/features/dashboard/dashboardApi";
import { useDashboardLayout } from "@/features/dashboard/dashboardConfigApi";
import { useAulas } from "@/features/aulas/aulasApi";
import { useAlunosEmRisco, REGRA_EVASAO } from "@/features/dashboard/evasaoApi";
import { usePolos } from "@/features/polos/polosApi";
import { useAlunos } from "@/features/alunos/alunosApi";
import { linkWhatsApp, mensagemAusencias } from "@/lib/avisoResponsavel";
import { useInscricoesPendentes } from "@/features/inscricoes/inscricoesApi";
import { dataBR } from "@/lib/format";
import type { Aniversariante } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function StatCard({
  icon: Icon,
  valor,
  label,
  cor,
  carregando,
}: {
  icon: LucideIcon;
  valor: number;
  label: string;
  cor: string;
  carregando: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${cor}1f`, color: cor }}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          {carregando ? (
            <Skeleton className="h-8 w-14" />
          ) : (
            <div className="text-2xl font-bold tabular-nums">{valor}</div>
          )}
          <div className="truncate text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AniversariantesTabela({
  aniversariantes,
  mesAtual,
}: {
  aniversariantes: Aniversariante[];
  mesAtual: string;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Cake className="size-5 text-primary" />
          <h2 className="font-semibold capitalize">Aniversariantes de {mesAtual}</h2>
        </div>
        {aniversariantes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhum aniversariante neste mês.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Comemorado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aniversariantes.map((a, i) => (
                <TableRow key={`${a.nome}-${i}`}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {new Date(a.dataNascimento).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    {a.jaComemorado ? (
                      <span className="inline-flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="size-4" /> Sim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-warning">
                        <XCircle className="size-4" /> Não
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Atalho para a chamada com contagem de aulas pendentes. É o widget mais útil
// para o professor no celular — leva direto à lista de Chamada.
function ChamadaWidget() {
  const navigate = useNavigate();
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const professor = sessao?.isProfessor ?? false;
  const { data: aulas, isLoading } = useAulas(admin);
  const pendentes = (aulas ?? []).filter((a) => !a.presencaSalva).length;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#f5c5181f", color: "#f5c518" }}
        >
          <ClipboardCheck className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground">Chamada</div>
          <div className="font-semibold">
            {isLoading
              ? "Carregando…"
              : pendentes === 0
                ? "Nenhuma chamada pendente"
                : `${pendentes} aula(s) com chamada pendente`}
          </div>
        </div>
        <Button className="shrink-0" onClick={() => navigate("/chamada")}>
          {professor ? "Fazer chamada" : "Ver chamadas"}
          <ChevronRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Alunos que vêm faltando seguido — o professor age antes de perder a criança.
function EvasaoWidget() {
  const { sessao } = useAuth();
  const { data: risco, isLoading, isError } = useAlunosEmRisco();
  const { data: polos } = usePolos();
  const { data: alunos } = useAlunos(sessao?.isAdministrador ?? false);
  const [verTodos, setVerTodos] = useState(false);

  // Contato do responsável para o aviso por WhatsApp.
  const contato = useMemo(() => {
    const m = new Map((alunos ?? []).map((a) => [a.id, a]));
    return (id: number) => m.get(id) ?? null;
  }, [alunos]);

  const nomePolo = useMemo(() => {
    const m = new Map((polos ?? []).map((p) => [p.id, p.nome]));
    return (id: number) => m.get(id) ?? "-";
  }, [polos]);

  const lista = risco ?? [];
  const visiveis = verTodos ? lista : lista.slice(0, 5);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <AlertTriangle className="size-5 text-warning" />
          <h2 className="font-semibold">Alunos em risco de evasão</h2>
          {lista.length > 0 && (
            <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 text-sm font-medium text-warning">
              {lista.length}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2 p-5">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        )}

        {!isLoading && isError && (
          <p className="px-5 py-8 text-center text-sm text-destructive">
            Não foi possível carregar a frequência.
          </p>
        )}

        {!isLoading && !isError && lista.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Ninguém com {REGRA_EVASAO.FALTAS_SEGUIDAS_ALERTA} faltas seguidas. Frequência em dia!
          </p>
        )}

        {!isLoading && !isError && lista.length > 0 && (
          <>
            <p className="px-5 pt-3 text-xs text-muted-foreground">
              {REGRA_EVASAO.FALTAS_SEGUIDAS_ALERTA}+ faltas seguidas nas últimas{" "}
              {REGRA_EVASAO.AULAS_ANALISADAS} aulas registradas.
            </p>
            <ul className="divide-y divide-border">
              {visiveis.map((a) => (
                <li
                  key={a.alunoId}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {nomePolo(a.poloId)}
                      {a.ultimaPresenca
                        ? ` · última presença em ${dataBR(a.ultimaPresenca)}`
                        : " · sem presença registrada"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-md bg-warning/15 px-2 py-1 text-sm font-medium tabular-nums text-warning">
                      {a.faltasSeguidas} faltas
                    </span>
                    {(() => {
                      const aluno = contato(a.alunoId);
                      const link = linkWhatsApp(
                        aluno?.celular,
                        mensagemAusencias({
                          nomeAluno: a.nome,
                          nomeResponsavel: aluno?.responsavel,
                          faltasSeguidas: a.faltasSeguidas,
                        }),
                      );
                      if (!link) return null;
                      return (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title="Avisar responsável pelo WhatsApp"
                          aria-label="Avisar responsável pelo WhatsApp"
                          onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
                        >
                          <MessageCircle className="size-4" />
                        </Button>
                      );
                    })()}
                  </div>
                </li>
              ))}
            </ul>
            {lista.length > 5 && (
              <div className="border-t border-border px-5 py-2.5">
                <Button variant="ghost" size="sm" onClick={() => setVerTodos((v) => !v)}>
                  {verTodos ? "Ver menos" : `Ver todos (${lista.length})`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Inscrições esperando revisão — sem isso a ficha chega e ninguém percebe.
function InscricoesWidget() {
  const navigate = useNavigate();
  const { data: pendentes, isLoading } = useInscricoesPendentes();

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#3b82f61f", color: "#3b82f6" }}
        >
          <ClipboardList className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground">Inscrições</div>
          <div className="font-semibold">
            {isLoading
              ? "Carregando…"
              : !pendentes
                ? "Nenhuma inscrição pendente"
                : `${pendentes} ficha(s) aguardando revisão`}
          </div>
        </div>
        {!!pendentes && (
          <Button className="shrink-0" onClick={() => navigate("/inscricoes")}>
            Revisar
            <ChevronRight className="size-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Contexto passado a cada widget na hora de renderizar.
interface WidgetCtx {
  data: DashboardData | undefined;
  isLoading: boolean;
  mesAtual: string;
}

interface WidgetDef {
  id: string;
  // Nome exibido no personalizador.
  titulo: string;
  // Ocupa a linha inteira (tabelas), em vez de uma célula do grid.
  full?: boolean;
  render: (ctx: WidgetCtx) => React.ReactNode;
}

// Catálogo de widgets disponíveis. Para adicionar um novo, basta incluí-lo aqui
// — a config de cada usuário se ajusta sozinha (ver dashboardLayout.normalizar).
const CATALOGO: WidgetDef[] = [
  {
    id: "chamada",
    titulo: "Atalho: Fazer chamada",
    full: true,
    render: () => <ChamadaWidget />,
  },
  {
    id: "inscricoes",
    titulo: "Atalho: Inscrições pendentes",
    full: true,
    render: () => <InscricoesWidget />,
  },
  {
    id: "evasao",
    titulo: "Alunos em risco de evasão",
    full: true,
    render: () => <EvasaoWidget />,
  },
  {
    id: "card-alunos",
    titulo: "Card: Alunos",
    render: (c) => (
      <StatCard icon={Users} valor={c.data?.totalAlunos ?? 0} label="Alunos" cor="#f5c518" carregando={c.isLoading} />
    ),
  },
  {
    id: "card-polos",
    titulo: "Card: Polos",
    render: (c) => (
      <StatCard icon={MapPin} valor={c.data?.totalPolos ?? 0} label="Polos" cor="#3b82f6" carregando={c.isLoading} />
    ),
  },
  {
    id: "card-aniversariantes",
    titulo: "Card: Aniversariantes do mês",
    render: (c) => (
      <StatCard
        icon={Cake}
        valor={(c.data?.aniversariantes ?? []).length}
        label="Aniversariantes do mês"
        cor="#a855f7"
        carregando={c.isLoading}
      />
    ),
  },
  {
    id: "card-aulas",
    titulo: "Card: Aulas cadastradas",
    render: (c) => (
      <StatCard icon={CalendarDays} valor={c.data?.totalAulas ?? 0} label="Aulas cadastradas" cor="#22c55e" carregando={c.isLoading} />
    ),
  },
  {
    id: "tabela-aniversariantes",
    titulo: "Tabela: Aniversariantes do mês",
    full: true,
    render: (c) => (
      <AniversariantesTabela aniversariantes={c.data?.aniversariantes ?? []} mesAtual={c.mesAtual} />
    ),
  },
];

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const mesAtual = MESES[new Date().getMonth()];

  const todosIds = useMemo(() => CATALOGO.map((w) => w.id), []);
  const catalogoPorId = useMemo(() => new Map(CATALOGO.map((w) => [w.id, w])), []);

  // Config sincronizada com a API (localStorage como cache/offline).
  const { config, salvar: aplicar } = useDashboardLayout(todosIds);
  const [personalizar, setPersonalizar] = useState(false);

  function alternarVisivel(id: string) {
    const ocultos = config.ocultos.includes(id)
      ? config.ocultos.filter((x) => x !== id)
      : [...config.ocultos, id];
    aplicar({ ...config, ocultos });
  }

  function mover(id: string, dir: -1 | 1) {
    const i = config.ordem.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= config.ordem.length) return;
    const ordem = [...config.ordem];
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
    aplicar({ ...config, ordem });
  }

  function restaurar() {
    aplicar({ ordem: todosIds, ocultos: [] });
  }

  const ctx: WidgetCtx = { data, isLoading, mesAtual };
  const visiveis = config.ordem.filter((id) => !config.ocultos.includes(id));

  return (
    <div className="space-y-6">
      <VersiculoDoDia />

      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={() => setPersonalizar(true)}>
          <SlidersHorizontal className="size-4" />
          Personalizar
        </Button>
      </div>

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar os dados do painel. Verifique a conexão
            com a API e tente novamente.
          </CardContent>
        </Card>
      )}

      {visiveis.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhum widget visível. Clique em <span className="font-medium">Personalizar</span> para escolher o que exibir.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visiveis.map((id) => {
            const w = catalogoPorId.get(id);
            if (!w) return null;
            return (
              <div key={id} className={w.full ? "sm:col-span-2 lg:col-span-4" : undefined}>
                {w.render(ctx)}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={personalizar} onOpenChange={setPersonalizar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Personalizar painel</DialogTitle>
            <DialogDescription>
              Mostre ou oculte cada bloco e ajuste a ordem. As preferências ficam salvas neste navegador.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-1">
            {config.ordem.map((id, indice) => {
              const w = catalogoPorId.get(id);
              if (!w) return null;
              const oculto = config.ocultos.includes(id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2"
                >
                  <span className={cn("flex-1 text-sm", oculto && "text-muted-foreground line-through")}>
                    {w.titulo}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => mover(id, -1)}
                    disabled={indice === 0}
                    aria-label="Mover para cima"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => mover(id, 1)}
                    disabled={indice === config.ordem.length - 1}
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => alternarVisivel(id)}
                    aria-label={oculto ? "Mostrar" : "Ocultar"}
                    title={oculto ? "Mostrar" : "Ocultar"}
                  >
                    {oculto ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </li>
              );
            })}
          </ul>

          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" size="sm" onClick={restaurar}>
              <RotateCcw className="size-4" />
              Restaurar padrão
            </Button>
            <Button onClick={() => setPersonalizar(false)}>Concluído</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
