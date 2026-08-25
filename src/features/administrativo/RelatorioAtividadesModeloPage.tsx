import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Printer,
  ImagePlus,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAlunos } from "@/features/alunos/alunosApi";
import { usePolos } from "@/features/polos/polosApi";
import { useGraduacoes } from "@/features/graduacoes/graduacoesApi";
import { useEventosCalendario } from "@/features/calendario/calendarioApi";
import { redimensionarFoto } from "@/lib/imagem";
import { blocoNumerosAno } from "@/features/administrativo/relatorioAtividadesDraft";
import {
  carregarModelo,
  salvarModelo,
  imprimirRelatorio,
  type ModeloRelatorio,
  type SecaoRelatorio,
  type FotoRelatorio,
} from "@/features/administrativo/relatorioModelo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const novoId = () => crypto.randomUUID();

function mover<T>(lista: T[], idx: number, dir: -1 | 1): T[] {
  const alvo = idx + dir;
  if (alvo < 0 || alvo >= lista.length) return lista;
  const nova = [...lista];
  [nova[idx], nova[alvo]] = [nova[alvo], nova[idx]];
  return nova;
}

export function RelatorioAtividadesModeloPage() {
  const navigate = useNavigate();
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const anoAtual = new Date().getFullYear();

  const [modelo, setModelo] = useState<ModeloRelatorio>(() => carregarModelo());
  const [ano, setAno] = useState(anoAtual);
  const [fotos, setFotos] = useState<FotoRelatorio[]>([]);
  const [sujo, setSujo] = useState(false);
  const inputFotos = useRef<HTMLInputElement>(null);

  const { data: alunos } = useAlunos(admin);
  const { data: polos } = usePolos();
  const { data: graduacoes } = useGraduacoes(ano);
  const { data: eventos } = useEventosCalendario(ano);

  const anos = [anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3];

  function marcar(next: ModeloRelatorio) {
    setModelo(next);
    setSujo(true);
  }

  function patchSecao(id: string, patch: Partial<SecaoRelatorio>) {
    marcar({
      ...modelo,
      secoes: modelo.secoes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function addSecao() {
    marcar({
      ...modelo,
      secoes: [...modelo.secoes, { id: novoId(), titulo: "Nova seção", corpo: "" }],
    });
  }

  function removerSecao(id: string) {
    marcar({ ...modelo, secoes: modelo.secoes.filter((s) => s.id !== id) });
  }

  function moverSecao(idx: number, dir: -1 | 1) {
    marcar({ ...modelo, secoes: mover(modelo.secoes, idx, dir) });
  }

  function preencherNumeros() {
    const bloco = blocoNumerosAno({
      ano,
      alunos: alunos ?? [],
      polos: polos ?? [],
      graduacoes: graduacoes ?? [],
      eventos: eventos ?? [],
    });
    const alvo = modelo.secoes.find((s) => s.id === "alcance");
    if (alvo) {
      patchSecao("alcance", { corpo: bloco });
    } else {
      marcar({
        ...modelo,
        secoes: [
          ...modelo.secoes,
          { id: "alcance", titulo: "Alcance e números", corpo: bloco },
        ],
      });
    }
    toast.success(`Números de ${ano} preenchidos na seção "Alcance e números".`);
  }

  async function onAdicionarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const arquivo of arquivos) {
      try {
        const dataUrl = await redimensionarFoto(arquivo);
        setFotos((f) => [...f, { id: novoId(), dataUrl, legenda: "" }]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Não foi possível ler a imagem.");
      }
    }
  }

  function salvar() {
    salvarModelo(modelo);
    setSujo(false);
    toast.success("Modelo salvo neste navegador.");
  }

  function gerarPdf() {
    if (!imprimirRelatorio(modelo, ano, fotos)) {
      toast.error("Permita pop-ups para gerar o PDF.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/administrativo/contabilidade/relatorio-atividades")}
        >
          <ArrowLeft className="size-4" />
          Relatório de Atividades
        </Button>
        <h1 className="text-lg font-semibold">Modelo do relatório</h1>
        <div className="ml-auto flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Ano</Label>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <p>
          Edite o <span className="font-medium text-foreground">texto do modelo</span> (fica
          salvo para os próximos anos), adicione as <span className="font-medium text-foreground">fotos</span> do ano
          e gere o PDF. As fotos entram só no PDF — não ficam guardadas.
        </p>
      </div>

      {/* Cabeçalho do documento */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5">Título</Label>
            <Input
              value={modelo.titulo}
              onChange={(e) => marcar({ ...modelo, titulo: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1.5">Subtítulo</Label>
            <Input
              value={modelo.subtitulo}
              onChange={(e) => marcar({ ...modelo, subtitulo: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seções de texto */}
      <div className="space-y-3">
        {modelo.secoes.map((s, i) => (
          <Card key={s.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={s.titulo}
                  onChange={(e) => patchSecao(s.id, { titulo: e.target.value })}
                  className="h-8 font-medium"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => moverSecao(i, -1)}
                  disabled={i === 0}
                  title="Subir"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => moverSecao(i, 1)}
                  disabled={i === modelo.secoes.length - 1}
                  title="Descer"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removerSecao(s.id)}
                  title="Remover seção"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Textarea
                rows={4}
                value={s.corpo}
                onChange={(e) => patchSecao(s.id, { corpo: e.target.value })}
              />
              {s.id === "alcance" && (
                <Button variant="outline" size="sm" className="h-8" onClick={preencherNumeros}>
                  <Sparkles className="size-3.5" />
                  Preencher números do ano
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" onClick={addSecao}>
          <Plus className="size-4" />
          Adicionar seção
        </Button>
      </div>

      {/* Fotos */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">Fotos do ano ({fotos.length})</div>
            <input
              ref={inputFotos}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={onAdicionarFotos}
            />
            <Button variant="outline" size="sm" onClick={() => inputFotos.current?.click()}>
              <ImagePlus className="size-4" />
              Adicionar fotos
            </Button>
          </div>
          {fotos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhuma foto adicionada. As fotos aparecem no fim do PDF, na seção
              "Registro fotográfico".
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fotos.map((f, i) => (
                <div key={f.id} className="space-y-1.5 rounded-md border border-border p-2">
                  <img
                    src={f.dataUrl}
                    alt=""
                    className="aspect-video w-full rounded object-cover"
                  />
                  <Input
                    value={f.legenda}
                    placeholder="Legenda (opcional)"
                    className="h-7 text-xs"
                    onChange={(e) =>
                      setFotos((lista) =>
                        lista.map((x) =>
                          x.id === f.id ? { ...x, legenda: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <div className="flex justify-between">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setFotos((l) => mover(l, i, -1))}
                        disabled={i === 0}
                        title="Mover para trás"
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setFotos((l) => mover(l, i, 1))}
                        disabled={i === fotos.length - 1}
                        title="Mover para frente"
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setFotos((l) => l.filter((x) => x.id !== f.id))}
                      title="Remover foto"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={salvar} disabled={!sujo}>
          <Save className="size-4" />
          {sujo ? "Salvar modelo" : "Modelo salvo"}
        </Button>
        <Button variant="outline" onClick={gerarPdf}>
          <Printer className="size-4" />
          Gerar PDF
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Depois de gerar, o PDF abre para impressão — salve como PDF e envie em{" "}
        <strong>Novo documento</strong> para guardar no sistema.
      </p>
    </div>
  );
}
