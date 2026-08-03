import {
  Users,
  MapPin,
  Cake,
  CalendarDays,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useDashboard } from "@/features/dashboard/dashboardApi";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

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

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const mesAtual = MESES[new Date().getMonth()];
  const aniversariantes = data?.aniversariantes ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          valor={data?.totalAlunos ?? 0}
          label="Alunos"
          cor="#f5c518"
          carregando={isLoading}
        />
        <StatCard
          icon={MapPin}
          valor={data?.totalPolos ?? 0}
          label="Polos"
          cor="#3b82f6"
          carregando={isLoading}
        />
        <StatCard
          icon={Cake}
          valor={aniversariantes.length}
          label="Aniversariantes do mês"
          cor="#a855f7"
          carregando={isLoading}
        />
        <StatCard
          icon={CalendarDays}
          valor={data?.totalAulas ?? 0}
          label="Aulas cadastradas"
          cor="#22c55e"
          carregando={isLoading}
        />
      </div>

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Não foi possível carregar os dados do painel. Verifique a conexão
            com a API e tente novamente.
          </CardContent>
        </Card>
      )}

      {aniversariantes.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <Cake className="size-5 text-primary" />
              <h2 className="font-semibold capitalize">
                Aniversariantes de {mesAtual}
              </h2>
            </div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
