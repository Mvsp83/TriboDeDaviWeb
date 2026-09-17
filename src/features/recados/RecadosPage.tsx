import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Megaphone, Upload, X } from "lucide-react";
import { usePolos } from "@/features/polos/polosApi";
import {
  useRecadosGerenciar,
  useSalvarRecado,
  useExcluirRecado,
  uploadRecadoFoto,
  obterRecadoFoto,
  type RecadoForm,
} from "@/features/recados/recadosApi";
import { RecadoFoto } from "@/features/recados/RecadoFoto";
import { CATEGORIA_RECADO_LABEL, CATEGORIAS_RECADO } from "@/features/recados/tipos";
import { dataCurtaBR } from "@/lib/format";
import { ApiError } from "@/lib/api";
import type { Recado } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VAZIO: RecadoForm = {
  titulo: "",
  descricao: "",
  categoria: 0,
  anunciante: "",
  contato: "",
  fotoArquivoId: "",
  expiraEm: "",
  ativo: true,
};

export function RecadosPage() {
  const { data: recados, isLoading } = useRecadosGerenciar();
  const { data: polos } = usePolos();
  const salvar = useSalvarRecado();
  const excluir = useExcluirRecado();

  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState<RecadoForm>(VAZIO);
  const [paraExcluir, setParaExcluir] = useState<Recado | null>(null);
  // Prévia local da foto recém-escolhida (objectURL) e estado de envio.
  const [fotoPreview, setFotoPreview] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);

  const nomePorPolo = useMemo(
    () => new Map((polos ?? []).map((p) => [p.id, p.nome])),
    [polos],
  );
  const nomePolo = (id?: number | null) =>
    id == null ? "Geral" : nomePorPolo.get(id) ?? "-";

  function abrirNovo() {
    setForm(VAZIO);
    setFotoPreview("");
    setDialog(true);
  }

  function abrirEdicao(r: Recado) {
    setForm({
      id: r.id,
      titulo: r.titulo,
      descricao: r.descricao,
      categoria: r.categoria,
      anunciante: r.anunciante ?? "",
      contato: r.contato,
      fotoArquivoId: r.fotoArquivoId ?? "",
      expiraEm: r.expiraEm ? r.expiraEm.slice(0, 10) : "",
      ativo: r.ativo,
    });
    setFotoPreview("");
    setDialog(true);
  }

  async function aoEscolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem.");
      return;
    }
    setEnviandoFoto(true);
    try {
      const fotoArquivoId = await uploadRecadoFoto(file);
      setForm((f) => ({ ...f, fotoArquivoId }));
      setFotoPreview(URL.createObjectURL(file));
      toast.success("Foto anexada.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao enviar a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  function removerFoto() {
    setForm((f) => ({ ...f, fotoArquivoId: "" }));
    setFotoPreview("");
  }

  async function onSalvar() {
    if (!form.titulo.trim() || !form.descricao.trim() || !form.contato.trim()) {
      toast.warning("Preencha título, descrição e contato.");
      return;
    }
    try {
      await salvar.mutateAsync({
        ...form,
        expiraEm: form.expiraEm ? form.expiraEm : null,
      });
      toast.success(form.id ? "Recado atualizado." : "Recado publicado.");
      setDialog(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar o recado.");
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Recado removido.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  function statusDoRecado(r: Recado) {
    if (!r.ativo) return <Badge variant="secondary">Inativo</Badge>;
    if (r.expiraEm && new Date(r.expiraEm) < new Date())
      return <Badge variant="warning">Expirado</Badge>;
    return <Badge variant="success">No ar</Badge>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Megaphone className="size-5 text-primary" /> Mural de Recados
          </h1>
          <p className="text-sm text-muted-foreground">
            Classificados da comunidade (emprego, veículo, serviços…) divulgados a
            todos os polos. Você publica em nome do aluno/responsável.
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="size-4" /> Novo recado
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (recados?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum recado ainda. Publique o primeiro.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recados!.map((r) => (
            <Card key={r.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{CATEGORIA_RECADO_LABEL[r.categoria]}</Badge>
                  {statusDoRecado(r)}
                </div>
                {r.fotoArquivoId ? (
                  <RecadoFoto
                    recadoId={r.id}
                    buscar={obterRecadoFoto}
                    className="h-32 w-full rounded-md object-cover"
                  />
                ) : null}
                <h3 className="font-semibold leading-tight">{r.titulo}</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {r.descricao}
                </p>
                <div className="mt-auto space-y-0.5 pt-2 text-xs text-muted-foreground">
                  {r.anunciante ? <p>Anunciante: {r.anunciante}</p> : null}
                  <p>Contato: {r.contato}</p>
                  <p>
                    Polo: {nomePolo(r.poloId)}
                    {r.expiraEm ? ` · até ${dataCurtaBR(r.expiraEm)}` : ""}
                  </p>
                </div>
                <div className="flex justify-end gap-1 pt-1">
                  <Button variant="ghost" size="icon" onClick={() => abrirEdicao(r)} aria-label="Editar">
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setParaExcluir(r)}
                    aria-label="Excluir"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar recado" : "Novo recado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Título</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex.: Vendo Gol 2012, Vaga de auxiliar…"
              />
            </div>
            <div>
              <Label className="mb-1.5">Categoria</Label>
              <Select
                value={String(form.categoria)}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_RECADO.map((c) => (
                    <SelectItem key={c.valor} value={String(c.valor)}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Descrição</Label>
              <Textarea
                rows={4}
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Detalhes do anúncio."
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5">Anunciante (opcional)</Label>
                <Input
                  value={form.anunciante}
                  onChange={(e) => setForm((f) => ({ ...f, anunciante: e.target.value }))}
                  placeholder="Nome de quem anuncia"
                />
              </div>
              <div>
                <Label className="mb-1.5">Contato</Label>
                <Input
                  value={form.contato}
                  onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))}
                  placeholder="WhatsApp / telefone / e-mail"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5">Válido até (opcional)</Label>
                <Input
                  type="date"
                  value={form.expiraEm ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, expiraEm: e.target.value }))}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Em branco = 45 dias.
                </p>
              </div>
              {form.id && (
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.ativo ?? true}
                    onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                    className="size-4 accent-primary"
                  />
                  Ativo (aparece no mural)
                </label>
              )}
            </div>

            <div>
              <Label className="mb-1.5">Foto (opcional)</Label>
              {fotoPreview || form.fotoArquivoId ? (
                <div className="flex items-center gap-3">
                  <div className="size-20 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="" className="size-full object-cover" />
                    ) : form.id ? (
                      <RecadoFoto
                        recadoId={form.id}
                        buscar={obterRecadoFoto}
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={removerFoto}>
                    <X className="size-4" /> Remover foto
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputFoto.current?.click()}
                  disabled={enviandoFoto}
                >
                  {enviandoFoto ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  Enviar foto
                </Button>
              )}
              <input
                ref={inputFoto}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={aoEscolherFoto}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={onSalvar} disabled={salvar.isPending}>
              {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
              {form.id ? "Salvar" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(o) => !o && setParaExcluir(null)}
        titulo="Excluir recado"
        descricao={
          <>
            Excluir <strong>{paraExcluir?.titulo}</strong> do mural?
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
