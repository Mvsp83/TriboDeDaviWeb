import { useMemo, useState } from "react";
import { ShieldCheck, Plus, Pencil, Trash2 } from "lucide-react";
import { dataHora } from "@/lib/format";
import {
  useLogAuditoria,
  ENTIDADE_LABEL,
  type LogAuditoria,
} from "@/features/auditoria/auditoriaApi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Ícone e cor por tipo de ação, para a lista ser lida num relance.
function IconeAcao({ acao }: { acao: string }) {
  if (acao === "Criou") return <Plus className="size-4 text-success" />;
  if (acao === "Excluiu") return <Trash2 className="size-4 text-destructive" />;
  return <Pencil className="size-4 text-warning" />;
}

// Traduz o JSON de alterações em frases legíveis: "Valor: 100 → 250".
function Alteracoes({ json }: { json: string }) {
  const itens = useMemo(() => {
    if (!json) return [];
    try {
      const obj = JSON.parse(json) as Record<string, { de: unknown; para: unknown }>;
      return Object.entries(obj).map(([campo, v]) => ({
        campo,
        de: v?.de ?? "",
        para: v?.para ?? "",
      }));
    } catch {
      return [];
    }
  }, [json]);

  if (itens.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-0.5">
      {itens.map((i) => (
        <div key={i.campo} className="text-xs">
          <span className="font-medium">{i.campo}:</span>{" "}
          <span className="text-muted-foreground line-through">{String(i.de)}</span>{" "}
          <span aria-hidden>→</span>{" "}
          <span>{String(i.para)}</span>
        </div>
      ))}
    </div>
  );
}

export function AuditoriaPage() {
  const [entidade, setEntidade] = useState("todas");
  const [usuario, setUsuario] = useState("");

  const { data: logs, isLoading } = useLogAuditoria(
    entidade === "todas" ? "" : entidade,
    usuario,
    200,
  );

  const lista = logs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <p>
          Quem alterou o quê e quando, nas áreas sensíveis — financeiro, doações,
          alunos, usuários, presenças e graduações. O registro é automático e não
          pode ser editado.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-52">
            <Label className="mb-1.5">Área</Label>
            <Select value={entidade} onValueChange={setEntidade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {Object.entries(ENTIDADE_LABEL).map(([valor, rotulo]) => (
                  <SelectItem key={valor} value={valor}>
                    {rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-52">
            <Label className="mb-1.5">Usuário</Label>
            <Input
              placeholder="login (parcial)"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>
          <p className="ml-auto text-sm text-muted-foreground">
            {isLoading ? "Carregando..." : `${lista.length} registro(s)`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {!isLoading && lista.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum registro de auditoria com os filtros atuais.
            </p>
          )}

          {!isLoading && lista.length > 0 && (
            <ul className="divide-y divide-border">
              {lista.map((log: LogAuditoria) => (
                <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5">
                    <IconeAcao acao={log.acao} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">{log.acao}</span>
                      <Badge variant="outline">
                        {ENTIDADE_LABEL[log.entidade] ?? log.entidade} #{log.entidadeId}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        por <span className="font-medium">{log.usuarioLogin}</span>
                      </span>
                    </div>
                    {log.acao === "Alterou" && (
                      <div className="mt-1">
                        <Alteracoes json={log.alteracoes} />
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <div className="tabular-nums">{dataHora(log.data)}</div>
                    {log.ip && <div className="opacity-70">{log.ip}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
