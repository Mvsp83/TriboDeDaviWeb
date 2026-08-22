import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  HeartHandshake,
  Plus,
  Receipt,
  Trash2,
  Loader2,
  Users,
  Wallet,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { dataBR, formatarTelefone } from "@/lib/format";
import {
  useDoadores,
  useDoacoes,
  useResumoDoacoes,
  useSalvarDoador,
  useExcluirDoador,
  useSalvarDoacao,
  useExcluirDoacao,
  useEmitirRecibo,
  FORMAS,
  FORMA_LABEL,
  type Doador,
  type Doacao,
} from "@/features/doadores/doacoesApi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Indicador({
  icone: Icone,
  valor,
  rotulo,
  cor,
}: {
  icone: typeof Wallet;
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

// ── Cadastro de doador ────────────────────────────────────────────────────
function DoadorDialog({
  aberto,
  onOpenChange,
  doador,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  doador: Doador | null;
}) {
  const salvar = useSalvarDoador();
  const [form, setForm] = useState(() => ({
    tipoPessoa: "0",
    nome: "",
    documento: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    observacoes: "",
  }));

  // Recarrega os campos ao abrir (novo ou edição).
  useEffect(() => {
    if (!aberto) return;
    setForm({
      tipoPessoa: String(doador?.tipoPessoa ?? 0),
      nome: doador?.nome ?? "",
      documento: doador?.documento ?? "",
      email: doador?.email ?? "",
      telefone: doador?.telefone ?? "",
      endereco: doador?.endereco ?? "",
      cidade: doador?.cidade ?? "",
      observacoes: doador?.observacoes ?? "",
    });
  }, [aberto, doador]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submeter() {
    if (!form.nome.trim()) {
      toast.warning("Informe o nome do doador.");
      return;
    }
    try {
      await salvar.mutateAsync({
        id: doador?.id,
        tipoPessoa: Number(form.tipoPessoa),
        nome: form.nome.trim(),
        documento: form.documento.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        endereco: form.endereco.trim(),
        cidade: form.cidade.trim(),
        observacoes: form.observacoes.trim(),
        ativo: doador?.ativo ?? true,
      });
      toast.success(doador ? "Doador atualizado." : "Doador cadastrado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar.");
    }
  }

  const pessoaJuridica = form.tipoPessoa === "1";

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{doador ? "Editar doador" : "Novo doador"}</DialogTitle>
          <DialogDescription>
            O documento é necessário para emitir recibo de doação.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5">Tipo</Label>
            <Select value={form.tipoPessoa} onValueChange={(v) => set("tipoPessoa", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Pessoa física</SelectItem>
                <SelectItem value="1">Pessoa jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5">{pessoaJuridica ? "CNPJ" : "CPF"}</Label>
            <Input value={form.documento} onChange={(e) => set("documento", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">
              {pessoaJuridica ? "Razão social" : "Nome"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">E-mail</Label>
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Telefone</Label>
            <Input
              inputMode="tel"
              placeholder="(47) 99999-9999"
              value={form.telefone}
              onChange={(e) => set("telefone", formatarTelefone(e.target.value))}
            />
          </div>
          <div>
            <Label className="mb-1.5">Endereço</Label>
            <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Cidade</Label>
            <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Observações</Label>
            <Input value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submeter} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Registro de doação ────────────────────────────────────────────────────
function DoacaoDialog({
  aberto,
  onOpenChange,
  doadores,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  doadores: Doador[];
}) {
  const salvar = useSalvarDoacao();
  const [doadorId, setDoadorId] = useState("anonimo");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [forma, setForma] = useState<string>("Pix");
  const [finalidade, setFinalidade] = useState("");
  const [observacoes, setObservacoes] = useState("");

  async function submeter() {
    const n = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      toast.warning("Informe um valor maior que zero.");
      return;
    }
    try {
      await salvar.mutateAsync({
        doadorId: doadorId === "anonimo" ? null : Number(doadorId),
        valor: n,
        data,
        forma,
        finalidade: finalidade.trim(),
        observacoes: observacoes.trim(),
      });
      toast.success("Doação registrada!");
      setValor("");
      setFinalidade("");
      setObservacoes("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao registrar.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar doação</DialogTitle>
          <DialogDescription>
            Doação sem doador identificado fica como anônima — mas só doações
            com doador geram recibo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Doador</Label>
            <Select value={doadorId} onValueChange={setDoadorId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anonimo">Anônimo</SelectItem>
                {doadores.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5">
              Valor (R$) <span className="text-destructive">*</span>
            </Label>
            <Input
              inputMode="decimal"
              placeholder="ex: 150,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5">Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Forma</Label>
            <Select value={forma} onValueChange={setForma}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FORMA_LABEL[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5">Finalidade</Label>
            <Input
              placeholder="ex: Kimonos"
              value={finalidade}
              onChange={(e) => setFinalidade(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Observações</Label>
            <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submeter} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Página ────────────────────────────────────────────────────────────────
export function DoacoesPage() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(String(anoAtual));
  const [aba, setAba] = useState<"doacoes" | "doadores">("doacoes");
  const [novaDoacao, setNovaDoacao] = useState(false);
  const [doadorEdit, setDoadorEdit] = useState<Doador | null>(null);
  const [dialogDoador, setDialogDoador] = useState(false);
  const [doacaoExcluir, setDoacaoExcluir] = useState<Doacao | null>(null);
  const [doadorExcluir, setDoadorExcluir] = useState<Doador | null>(null);

  const { data: doadores, isLoading: carregandoDoadores } = useDoadores();
  const { data: doacoes, isLoading: carregandoDoacoes } = useDoacoes(Number(ano));
  const { data: resumo } = useResumoDoacoes(Number(ano));

  const emitir = useEmitirRecibo();
  const excluirDoacao = useExcluirDoacao();
  const excluirDoador = useExcluirDoador();

  const anos = [anoAtual, anoAtual - 1, anoAtual - 2].map(String);

  async function emitirRecibo(d: Doacao) {
    try {
      const r = await emitir.mutateAsync(d.id);
      toast.success(`Recibo ${r.reciboNumero} emitido! Veja em Ofícios e Recibos.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao emitir recibo.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <HeartHandshake className="mt-0.5 size-4 shrink-0" />
        <p>
          Quem apoia o instituto e quanto foi recebido. O recibo usa a{" "}
          <span className="font-medium text-foreground">numeração oficial</span> e
          fica junto dos demais documentos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          icone={Wallet}
          valor={brl(resumo?.total ?? 0)}
          rotulo={`arrecadado em ${ano}`}
          cor="#22c55e"
        />
        <Indicador
          icone={HeartHandshake}
          valor={String(resumo?.quantidade ?? 0)}
          rotulo="doações recebidas"
          cor="#f5c518"
        />
        <Indicador
          icone={Users}
          valor={String(resumo?.doadores ?? 0)}
          rotulo="doadores no ano"
          cor="#3b82f6"
        />
        <Indicador
          icone={TrendingUp}
          valor={brl(resumo?.ticketMedio ?? 0)}
          rotulo="doação média"
          cor="#a855f7"
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-40">
            <Label className="mb-1.5">Ver</Label>
            <Select value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doacoes">Doações</SelectItem>
                <SelectItem value="doadores">Doadores</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {aba === "doacoes" && (
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
          )}
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDoadorEdit(null);
                setDialogDoador(true);
              }}
            >
              <UserPlus className="size-4" />
              Novo doador
            </Button>
            <Button onClick={() => setNovaDoacao(true)}>
              <Plus className="size-4" />
              Registrar doação
            </Button>
          </div>
        </CardContent>
      </Card>

      {aba === "doacoes" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Doador</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Finalidade</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Recibo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carregandoDoacoes &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!carregandoDoacoes && (doacoes ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Nenhuma doação registrada em {ano}.
                    </TableCell>
                  </TableRow>
                )}

                {(doacoes ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="tabular-nums">{dataBR(d.data)}</TableCell>
                    <TableCell className="font-medium">{d.nomeDoador}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {FORMA_LABEL[d.forma] ?? d.forma}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.finalidade}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {brl(d.valor)}
                    </TableCell>
                    <TableCell>
                      {d.reciboNumero ? (
                        <Badge variant="success">{d.reciboNumero}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!d.reciboNumero && d.doadorId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Emitir recibo"
                            disabled={emitir.isPending}
                            onClick={() => emitirRecibo(d)}
                          >
                            <Receipt className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          title="Remover"
                          onClick={() => setDoacaoExcluir(d)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Doações</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Última</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carregandoDoadores &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!carregandoDoadores && (doadores ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Nenhum doador cadastrado ainda.
                    </TableCell>
                  </TableRow>
                )}

                {(doadores ?? []).map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setDoadorEdit(d);
                      setDialogDoador(true);
                    }}
                  >
                    <TableCell className="font-medium">
                      {d.nome}
                      {d.tipoPessoa === 1 && (
                        <Badge variant="outline" className="ml-2">
                          PJ
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.documento}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.email || d.telefone}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.quantidadeDoacoes}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {brl(d.totalDoado)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {d.ultimaDoacao ? dataBR(d.ultimaDoacao) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        title="Remover"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDoadorExcluir(d);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <DoacaoDialog
        aberto={novaDoacao}
        onOpenChange={setNovaDoacao}
        doadores={doadores ?? []}
      />
      <DoadorDialog
        aberto={dialogDoador}
        onOpenChange={setDialogDoador}
        doador={doadorEdit}
      />

      <ConfirmDialog
        aberto={doacaoExcluir !== null}
        onOpenChange={(v) => !v && setDoacaoExcluir(null)}
        titulo="Remover doação?"
        descricao={
          doacaoExcluir?.reciboNumero ? (
            <>
              Esta doação tem o recibo <strong>{doacaoExcluir.reciboNumero}</strong>{" "}
              emitido. O recibo continuará existindo em Ofícios e Recibos.
            </>
          ) : (
            "O registro será removido permanentemente."
          )
        }
        confirmarLabel="Remover"
        destrutivo
        carregando={excluirDoacao.isPending}
        onConfirmar={async () => {
          if (!doacaoExcluir) return;
          try {
            await excluirDoacao.mutateAsync(doacaoExcluir.id);
            toast.success("Doação removida.");
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
          } finally {
            setDoacaoExcluir(null);
          }
        }}
      />

      <ConfirmDialog
        aberto={doadorExcluir !== null}
        onOpenChange={(v) => !v && setDoadorExcluir(null)}
        titulo="Remover doador?"
        descricao="Doadores com doações registradas não podem ser removidos."
        confirmarLabel="Remover"
        destrutivo
        carregando={excluirDoador.isPending}
        onConfirmar={async () => {
          if (!doadorExcluir) return;
          try {
            await excluirDoador.mutateAsync(doadorExcluir.id);
            toast.success("Doador removido.");
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
          } finally {
            setDoadorExcluir(null);
          }
        }}
      />
    </div>
  );
}
