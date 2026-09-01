import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAulas } from "@/features/aulas/aulasApi";
import { usePolos } from "@/features/polos/polosApi";
import { dataBR, horaCurta } from "@/lib/format";
import type { Aula } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FiltroStatus = "todas" | "pendentes" | "salvas";
const TURMAS = [1, 2, 3];

// Lista as aulas para o professor fazer a chamada. O professor vê apenas as
// aulas do seu polo (a API filtra pelo token); o administrador vê todas, mas
// somente para visualizar — o registro é feito pelo professor.
export function ChamadaPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const professor = sessao?.isProfessor ?? false;
  const navigate = useNavigate();

  const { data: aulas, isLoading, isError } = useAulas(admin);
  const { data: polos } = usePolos();

  const [status, setStatus] = useState<FiltroStatus>("pendentes");
  const [turma, setTurma] = useState<string>("todas");
  const [polo, setPolo] = useState<string>("todos");
  const [ordemData, setOrdemData] = useState<"desc" | "asc">("desc");

  const nomePorPolo = useMemo(
    () => new Map((polos ?? []).map((p) => [p.id, p.nome])),
    [polos],
  );

  const filtradas = useMemo(() => {
    let lista = [...(aulas ?? [])];
    if (status === "pendentes") lista = lista.filter((a) => !a.presencaSalva);
    if (status === "salvas") lista = lista.filter((a) => a.presencaSalva);
    if (turma !== "todas") lista = lista.filter((a) => a.turma === Number(turma));
    if (admin && polo !== "todos")
      lista = lista.filter((a) => a.poloId === Number(polo));
    // Pendentes primeiro; dentro disso, pela data na ordem escolhida.
    return lista.sort((a, b) => {
      if (a.presencaSalva !== b.presencaSalva) return a.presencaSalva ? 1 : -1;
      const d = new Date(a.data).getTime() - new Date(b.data).getTime();
      return ordemData === "asc" ? d : -d;
    });
  }, [aulas, status, turma, polo, admin, ordemData]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chamada</h1>
        <p className="text-sm text-muted-foreground">
          {professor
            ? "Selecione uma aula do seu polo para registrar as presenças."
            : "Visualização das presenças por aula (somente leitura)."}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Label className="mb-1.5">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as FiltroStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendentes">Pendentes</SelectItem>
              <SelectItem value="salvas">Salvas</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-32">
          <Label className="mb-1.5">Turma</Label>
          <Select value={turma} onValueChange={setTurma}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {TURMAS.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  Turma {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {admin && (
          <div className="w-52">
            <Label className="mb-1.5">Polo</Label>
            <Select value={polo} onValueChange={setPolo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(polos ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="w-40">
          <Label className="mb-1.5">Ordenar</Label>
          <Select value={ordemData} onValueChange={(v) => setOrdemData(v as "desc" | "asc")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mais recentes</SelectItem>
              <SelectItem value="asc">Mais antigas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista */}
      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            Erro ao carregar as aulas. Tente novamente.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && filtradas.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma aula encontrada com os filtros atuais.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && filtradas.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((a) => (
            <AulaCard
              key={a.id}
              aula={a}
              nomePolo={nomePorPolo.get(a.poloId) ?? "-"}
              professor={professor}
              onAbrir={() => navigate(`/chamada/${a.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AulaCard({
  aula,
  nomePolo,
  professor,
  onAbrir,
}: {
  aula: Aula;
  nomePolo: string;
  professor: boolean;
  onAbrir: () => void;
}) {
  const salva = aula.presencaSalva;
  const acaoLabel = salva
    ? "Ver presenças"
    : professor
      ? "Fazer chamada"
      : "Ver aula";

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/50"
      onClick={onAbrir}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 font-medium tabular-nums">
            <CalendarDays className="size-4 text-muted-foreground" />
            {dataBR(aula.data)}
          </div>
          {salva ? (
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
          <span className="tabular-nums">
            {horaCurta(aula.horaInicio)}–{horaCurta(aula.horaFim)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {nomePolo}
          </span>
        </div>

        <Button
          variant={salva || !professor ? "outline" : "default"}
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onAbrir();
          }}
        >
          {acaoLabel}
          <ChevronRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
