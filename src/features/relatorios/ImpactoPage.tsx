import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileDown, Info, Loader2, Users, MapPin, CalendarDays, Percent, ClipboardCopy } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAlunos } from "@/features/alunos/alunosApi";
import { useAulas } from "@/features/aulas/aulasApi";
import { usePolos } from "@/features/polos/polosApi";
import { faixaInfo } from "@/features/alunos/faixa";
import { useMatriculas, usePresencasDoAno } from "@/features/relatorios/impactoApi";
import { calcularImpacto } from "@/features/relatorios/impactoCalculos";
import { imprimirImpacto } from "@/features/relatorios/impactoPdf";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function Indicador({
  icone: Icone,
  valor,
  rotulo,
  cor,
}: {
  icone: typeof Users;
  valor: string;
  rotulo: string;
  cor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${cor}1f`, color: cor }}
        >
          <Icone className="size-6" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold tabular-nums">{valor}</div>
          <div className="truncate text-sm text-muted-foreground">{rotulo}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Barra proporcional simples — evita dependência de biblioteca de gráfico
// para uma distribuição que cabe em poucas linhas.
function Distribuicao({
  titulo,
  itens,
  total,
}: {
  titulo: string;
  itens: { nome: string; quantidade: number }[];
  total: number;
}) {
  if (itens.length === 0) return null;
  return (
    <Card>
      <CardContent className="p-5">
        <p className="mb-3 text-sm font-semibold">{titulo}</p>
        <div className="space-y-2">
          {itens.map((i) => {
            const pct = total > 0 ? Math.round((i.quantidade * 100) / total) : 0;
            return (
              <div key={i.nome}>
                <div className="flex justify-between text-sm">
                  <span className="truncate">{i.nome}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {i.quantidade} ({pct}%)
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Relatório de impacto do projeto: consolida em uma página os números que
// editais e prestações de contas costumam pedir, a partir do que o sistema
// já registra no dia a dia.
export function ImpactoPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(String(anoAtual));
  const anoNum = Number(ano);

  const { data: alunos, isLoading: carregandoAlunos } = useAlunos(admin);
  const { data: aulas, isLoading: carregandoAulas } = useAulas(admin);
  const { data: polos } = usePolos();
  const { data: matriculas, isLoading: carregandoMat } = useMatriculas(anoNum);
  const { data: presencas, isLoading: carregandoPres } = usePresencasDoAno();

  const carregando =
    carregandoAlunos || carregandoAulas || carregandoMat || carregandoPres;

  const nomePolo = useMemo(() => {
    const m = new Map((polos ?? []).map((p) => [p.id, p.nome]));
    return (id: number) => m.get(id) ?? "-";
  }, [polos]);

  const impacto = useMemo(
    () =>
      calcularImpacto({
        ano: anoNum,
        matriculas: matriculas ?? [],
        alunos: alunos ?? [],
        aulas: aulas ?? [],
        presencas: presencas ?? [],
        nomePolo,
        nomeFaixa: (f) => faixaInfo(f).nome,
      }),
    [anoNum, matriculas, alunos, aulas, presencas, nomePolo],
  );

  const anos = [anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3].map(String);

  // Monta o bloco `impacto` no formato de conteudoTransparencia.ts, para o
  // coordenador colar na página pública sem redigitar nem recalcular nada.
  async function copiarParaTransparencia() {
    const lista = (itens: { nome: string; quantidade: number }[]) =>
      itens.map((i) => `\n      { nome: ${JSON.stringify(i.nome)}, quantidade: ${i.quantidade} },`).join("");
    const snippet = `impacto: {
    ano: ${impacto.ano},
    atendidos: ${impacto.atendidos},
    polos: ${impacto.polos},
    aulas: ${impacto.aulas},
    frequenciaMedia: ${impacto.frequenciaMedia ?? 0},
    escolas: ${impacto.escolas},
    bairros: ${impacto.bairros.length},
    faixasEtarias: [${lista(impacto.faixasEtarias.map((f) => ({ nome: f.rotulo, quantidade: f.quantidade })))}
    ],
    graduacoes: [${lista(impacto.graduacoes)}
    ],
  },`;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Números copiados. Cole no bloco `impacto` de conteudoTransparencia.ts.");
    } catch {
      toast.error("Não foi possível copiar. Verifique a permissão da área de transferência.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Números do projeto no ano, prontos para <span className="font-medium text-foreground">prestação
          de contas e inscrição em editais</span>. Os atendidos vêm do cadastro de
          alunos; aulas e frequência, das chamadas do ano selecionado.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
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
          <Button
            variant="outline"
            className="ml-auto"
            disabled={carregando || impacto.atendidos === 0}
            onClick={copiarParaTransparencia}
          >
            <ClipboardCopy className="size-4" />
            Números para a página pública
          </Button>
          <Button
            variant="outline"
            disabled={carregando || impacto.atendidos === 0}
            onClick={() => {
              if (!imprimirImpacto(impacto)) {
                toast.error("Permita pop-ups para exportar o PDF.");
              }
            }}
          >
            {carregando ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            Exportar PDF
          </Button>
        </CardContent>
      </Card>

      {carregando ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador
              icone={Users}
              valor={String(impacto.atendidos)}
              rotulo="crianças e adolescentes atendidos"
              cor="#f5c518"
            />
            <Indicador
              icone={MapPin}
              valor={String(impacto.polos)}
              rotulo="polos em funcionamento"
              cor="#3b82f6"
            />
            <Indicador
              icone={CalendarDays}
              valor={String(impacto.aulas)}
              rotulo="aulas realizadas"
              cor="#22c55e"
            />
            <Indicador
              icone={Percent}
              valor={impacto.frequenciaMedia != null ? `${impacto.frequenciaMedia}%` : "—"}
              rotulo="frequência média"
              cor="#a855f7"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-semibold">Atendimento por polo</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Polo</TableHead>
                    <TableHead className="text-right">Alunos</TableHead>
                    <TableHead className="text-right">Aulas</TableHead>
                    <TableHead className="text-right">Frequência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {impacto.porPolo.map((p) => (
                    <TableRow key={p.poloId}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.alunos}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.aulas}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.frequencia != null ? `${p.frequencia}%` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {impacto.porPolo.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                        Nenhum dado registrado em {ano}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Distribuicao
              titulo="Faixa etária"
              itens={impacto.faixasEtarias.map((f) => ({
                nome: f.rotulo,
                quantidade: f.quantidade,
              }))}
              total={impacto.atendidos}
            />
            <Distribuicao
              titulo="Graduação (faixa)"
              itens={impacto.graduacoes}
              total={impacto.atendidos}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Distribuicao
              titulo="Bairros alcançados"
              itens={impacto.bairros.slice(0, 10)}
              total={impacto.atendidos}
            />
            <Card>
              <CardContent className="p-5">
                <p className="mb-3 text-sm font-semibold">Alcance</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escolas de origem</span>
                    <span className="font-medium tabular-nums">{impacto.escolas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bairros atendidos</span>
                    <span className="font-medium tabular-nums">{impacto.bairros.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Presenças registradas</span>
                    <span className="font-medium tabular-nums">
                      {impacto.presencasRegistradas}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
