import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Save,
  Printer,
  Type,
  Users,
  AlertTriangle,
} from "lucide-react";
import { faixaInfo } from "@/features/alunos/faixa";
import { useConfigGraduacao, useSalvarPrograma } from "./graduacaoApi";
import { imprimirApostilaFaixa } from "./apostilaHtml";
import { acharGolpe, avisosPosicao } from "./restricao";
import {
  type ProgramaFaixa,
  type Grau,
  type Requisito,
  type Criterio,
  type FaixaEtaria,
  novoId,
} from "./tipos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function valeParaIdade(
  faixaEtariaId: string | null | undefined,
  filtro: string,
): boolean {
  if (filtro === "todas") return true;
  return faixaEtariaId == null || faixaEtariaId === filtro;
}

function moverEmLista<T extends { id: string }>(
  full: T[],
  visiveisIds: string[],
  id: string,
  dir: -1 | 1,
): T[] {
  const vis = visiveisIds.indexOf(id);
  const alvoId = visiveisIds[vis + dir];
  if (!alvoId) return full;
  const a = full.findIndex((x) => x.id === id);
  const b = full.findIndex((x) => x.id === alvoId);
  const novo = [...full];
  [novo[a], novo[b]] = [novo[b], novo[a]];
  return novo;
}

function EscopoIdade({
  value,
  bandas,
  onChange,
}: {
  value: string | null | undefined;
  bandas: FaixaEtaria[];
  onChange: (id: string | null) => void;
}) {
  if (bandas.length === 0) return null;
  return (
    <Select
      value={value ?? "todas"}
      onValueChange={(v) => onChange(v === "todas" ? null : v)}
    >
      <SelectTrigger className="h-7 w-auto gap-1 px-2 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todas as idades</SelectItem>
        {bandas.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProgramaEditorPage() {
  const { faixaBase: faixaParam } = useParams();
  const faixaBase = Number(faixaParam);
  const navigate = useNavigate();
  const info = faixaInfo(faixaBase);

  const { data: cfg } = useConfigGraduacao();
  const salvar = useSalvarPrograma();

  const [prog, setProg] = useState<ProgramaFaixa | null>(null);
  const [sujo, setSujo] = useState(false);
  const [filtroIdade, setFiltroIdade] = useState("todas");

  const posicoes = useMemo(() => cfg?.posicoes ?? [], [cfg]);
  const posicoesOrdenadas = useMemo(
    () => [...posicoes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [posicoes],
  );
  const nomePorId = useMemo(
    () => new Map(posicoes.map((p) => [p.id, p])),
    [posicoes],
  );

  useEffect(() => {
    const encontrado = cfg?.programas.find((p) => p.faixaBase === faixaBase) ?? null;
    setProg(encontrado ? structuredClone(encontrado) : null);
    setSujo(false);
    setFiltroIdade("todas");
  }, [cfg, faixaBase]);

  const bandas = prog?.faixasEtarias ?? [];
  const escopoNovo = filtroIdade === "todas" ? null : filtroIdade;

  function marcar(next: ProgramaFaixa) {
    setProg(next);
    setSujo(true);
  }

  function criarPrograma() {
    marcar({
      faixaBase,
      tag: "",
      perfil: "",
      faixasEtarias: [],
      graus: [{ id: novoId(), titulo: "1º grau", requisitos: [], criterios: [] }],
    });
    toast.info("Programa criado. Edite e salve.");
  }

  // ---- faixas etárias ----
  function addFaixaEtaria() {
    if (!prog) return;
    marcar({
      ...prog,
      faixasEtarias: [
        ...prog.faixasEtarias,
        { id: novoId(), label: "Nova faixa etária" },
      ],
    });
  }
  function patchFaixaEtaria(id: string, patch: Partial<FaixaEtaria>) {
    if (!prog) return;
    marcar({
      ...prog,
      faixasEtarias: prog.faixasEtarias.map((f) =>
        f.id === id ? { ...f, ...patch } : f,
      ),
    });
  }
  function removerFaixaEtaria(id: string) {
    if (!prog) return;
    const soltar = <T extends { faixaEtariaId?: string | null }>(x: T): T =>
      x.faixaEtariaId === id ? { ...x, faixaEtariaId: null } : x;
    marcar({
      ...prog,
      faixasEtarias: prog.faixasEtarias.filter((f) => f.id !== id),
      graus: prog.graus.map((g) => ({
        ...g,
        requisitos: g.requisitos.map(soltar),
        criterios: g.criterios.map(soltar),
      })),
    });
    if (filtroIdade === id) setFiltroIdade("todas");
  }

  // ---- graus ----
  function patchGrau(grauId: string, patch: Partial<Grau>) {
    if (!prog) return;
    marcar({
      ...prog,
      graus: prog.graus.map((g) => (g.id === grauId ? { ...g, ...patch } : g)),
    });
  }
  function addGrau() {
    if (!prog) return;
    marcar({
      ...prog,
      graus: [
        ...prog.graus,
        {
          id: novoId(),
          titulo: `${prog.graus.length + 1}º grau`,
          requisitos: [],
          criterios: [],
        },
      ],
    });
  }
  function removerGrau(grauId: string) {
    if (!prog) return;
    marcar({ ...prog, graus: prog.graus.filter((g) => g.id !== grauId) });
  }

  // ---- requisitos ----
  function setRequisitos(grauId: string, requisitos: Requisito[]) {
    patchGrau(grauId, { requisitos });
  }
  function addPosicao(grau: Grau, posicaoId: string) {
    setRequisitos(grau.id, [
      ...grau.requisitos,
      { id: novoId(), posicaoId, faixaEtariaId: escopoNovo },
    ]);
  }
  function addTextoLivre(grau: Grau) {
    setRequisitos(grau.id, [
      ...grau.requisitos,
      { id: novoId(), posicaoId: null, texto: "", faixaEtariaId: escopoNovo },
    ]);
  }

  // ---- critérios ----
  function setCriterios(grauId: string, criterios: Criterio[]) {
    patchGrau(grauId, { criterios });
  }
  function addCriterio(grau: Grau) {
    setCriterios(grau.id, [
      ...grau.criterios,
      { id: novoId(), texto: "", faixaEtariaId: escopoNovo },
    ]);
  }

  async function salvarPrograma() {
    if (!prog) return;
    try {
      await salvar.mutateAsync(prog);
      setSujo(false);
      toast.success("Programa salvo neste navegador.");
    } catch {
      toast.error("Erro ao salvar o programa.");
    }
  }

  async function gerarApostila() {
    if (!prog || !cfg) return;
    if (!(await imprimirApostilaFaixa(prog, cfg, filtroIdade))) {
      toast.error("Permita pop-ups para gerar a apostila.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho: faixa + voltar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/graduacao/programas")}>
          <ArrowLeft className="size-4" />
          Programas
        </Button>
        <div
          className="flex items-center gap-2 rounded-full border border-border px-3 py-1"
        >
          <span
            className="size-3.5 rounded-full border border-black/10"
            style={{ backgroundColor: info.cor }}
          />
          <span className="font-semibold">Faixa {info.nome}</span>
        </div>
        {prog?.tag && (
          <span className="text-sm text-muted-foreground">{prog.tag}</span>
        )}
      </div>

      {!prog && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              A faixa {info.nome} ainda não tem programa.
            </p>
            <Button onClick={criarPrograma}>
              <Plus className="size-4" />
              Criar programa desta faixa
            </Button>
          </CardContent>
        </Card>
      )}

      {prog && (
        <>
          {/* Cabeçalho do programa */}
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <Label className="mb-1.5">Rótulo curto (tag)</Label>
                <Input
                  placeholder="ex: Fundamentos e sobrevivência"
                  value={prog.tag ?? ""}
                  onChange={(e) => marcar({ ...prog, tag: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1.5">Perfil da faixa</Label>
                <Textarea
                  rows={2}
                  placeholder="Parágrafo de abertura da faixa na apostila."
                  value={prog.perfil ?? ""}
                  onChange={(e) => marcar({ ...prog, perfil: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={salvarPrograma} disabled={salvar.isPending || !sujo}>
                  <Save className="size-4" />
                  {sujo ? "Salvar" : "Salvo"}
                </Button>
                <Button variant="outline" onClick={gerarApostila}>
                  <Printer className="size-4" />
                  Gerar apostila (PDF)
                </Button>
                <Button variant="ghost" className="ml-auto" onClick={addGrau}>
                  <Plus className="size-4" />
                  Adicionar grau
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Faixas etárias + filtro */}
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="size-4 text-muted-foreground" />
                  Faixas etárias desta cor
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Editando para</Label>
                  <Select value={filtroIdade} onValueChange={setFiltroIdade}>
                    <SelectTrigger className="h-8 w-auto gap-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as idades</SelectItem>
                      {bandas.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                {bandas.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma faixa etária. Sem elas, o conteúdo vale para todas as
                    idades. Adicione uma para diferenciar por idade.
                  </p>
                )}
                {bandas.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center gap-2">
                    <Input
                      className="h-8 w-44"
                      value={b.label}
                      placeholder="ex: 4 a 5 anos"
                      onChange={(e) => patchFaixaEtaria(b.id, { label: e.target.value })}
                    />
                    <Input
                      className="h-8 w-20"
                      type="number"
                      value={b.idadeMin ?? ""}
                      placeholder="mín"
                      onChange={(e) =>
                        patchFaixaEtaria(b.id, {
                          idadeMin: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      className="h-8 w-20"
                      type="number"
                      value={b.idadeMax ?? ""}
                      placeholder="máx"
                      onChange={(e) =>
                        patchFaixaEtaria(b.id, {
                          idadeMax: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      title="Remover faixa etária"
                      onClick={() => removerFaixaEtaria(b.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-8" onClick={addFaixaEtaria}>
                  <Plus className="size-3.5" />
                  Adicionar faixa etária
                </Button>
              </div>
            </CardContent>
          </Card>

          {filtroIdade !== "todas" && (
            <p className="px-1 text-xs text-muted-foreground">
              Mostrando o conteúdo de{" "}
              <span className="font-medium text-foreground">
                {bandas.find((b) => b.id === filtroIdade)?.label}
              </span>{" "}
              (inclui os itens válidos para todas as idades). Novos itens entram
              nesta faixa etária.
            </p>
          )}

          {/* Graus — empilhados, um abaixo do outro */}
          <div className="grid grid-cols-1 gap-4">
            {prog.graus.map((g, gi) => {
              const reqsVis = g.requisitos.filter((r) =>
                valeParaIdade(r.faixaEtariaId, filtroIdade),
              );
              const reqVisIds = reqsVis.map((r) => r.id);
              const critVis = g.criterios.filter((c) =>
                valeParaIdade(c.faixaEtariaId, filtroIdade),
              );
              const critVisIds = critVis.map((c) => c.id);
              return (
                <Card key={g.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap text-base font-bold text-primary">
                        {gi + 1}º GRAU
                      </span>
                      <Input
                        value={g.titulo}
                        onChange={(e) => patchGrau(g.id, { titulo: e.target.value })}
                        className="h-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        title="Remover grau"
                        onClick={() => removerGrau(g.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* Requisitos */}
                    <div>
                      <Label className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Requisitos
                      </Label>
                      <ul className="space-y-1.5">
                        {reqsVis.length === 0 && (
                          <li className="rounded border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
                            Sem requisitos aqui. Adicione abaixo.
                          </li>
                        )}
                        {reqsVis.map((r, ri) => {
                          const p = r.posicaoId ? nomePorId.get(r.posicaoId) : null;
                          const faixaEt = bandas.find((b) => b.id === r.faixaEtariaId);
                          const golpe = acharGolpe(cfg, p?.golpeRestritoId);
                          const avisos = avisosPosicao(p, faixaBase, faixaEt, golpe);
                          return (
                            <li
                              key={r.id}
                              className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
                            >
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  onClick={() =>
                                    setRequisitos(
                                      g.id,
                                      moverEmLista(g.requisitos, reqVisIds, r.id, -1),
                                    )
                                  }
                                  disabled={ri === 0}
                                  title="Subir"
                                >
                                  <ArrowUp className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  onClick={() =>
                                    setRequisitos(
                                      g.id,
                                      moverEmLista(g.requisitos, reqVisIds, r.id, 1),
                                    )
                                  }
                                  disabled={ri === reqsVis.length - 1}
                                  title="Descer"
                                >
                                  <ArrowDown className="size-3.5" />
                                </button>
                              </div>
                              {p ? (
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium">{p.nome}</div>
                                  {p.nomeEn && (
                                    <div className="truncate text-xs text-muted-foreground">
                                      {p.nomeEn}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Input
                                  value={r.texto ?? ""}
                                  placeholder="Requisito (texto livre)"
                                  onChange={(e) =>
                                    setRequisitos(
                                      g.id,
                                      g.requisitos.map((x) =>
                                        x.id === r.id ? { ...x, texto: e.target.value } : x,
                                      ),
                                    )
                                  }
                                  className="h-8 flex-1"
                                />
                              )}
                              {avisos.length > 0 && (
                                <span
                                  className="flex-none text-amber-600 dark:text-amber-500"
                                  title={avisos.join("\n")}
                                >
                                  <AlertTriangle className="size-4" />
                                </span>
                              )}
                              <EscopoIdade
                                value={r.faixaEtariaId}
                                bandas={bandas}
                                onChange={(id) =>
                                  setRequisitos(
                                    g.id,
                                    g.requisitos.map((x) =>
                                      x.id === r.id ? { ...x, faixaEtariaId: id } : x,
                                    ),
                                  )
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive"
                                title="Remover requisito"
                                onClick={() =>
                                  setRequisitos(
                                    g.id,
                                    g.requisitos.filter((x) => x.id !== r.id),
                                  )
                                }
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Select value="" onValueChange={(v) => addPosicao(g, v)}>
                          <SelectTrigger className="h-8 flex-1">
                            <SelectValue placeholder="+ Adicionar posição do catálogo" />
                          </SelectTrigger>
                          <SelectContent>
                            {posicoesOrdenadas.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => addTextoLivre(g)}
                        >
                          <Type className="size-3.5" />
                          Texto livre
                        </Button>
                      </div>
                    </div>

                    {/* Critérios de exame */}
                    <div>
                      <Label className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Critérios de exame
                      </Label>
                      <ul className="space-y-1.5">
                        {critVis.length === 0 && (
                          <li className="rounded border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
                            Sem critérios aqui. Adicione abaixo.
                          </li>
                        )}
                        {critVis.map((c, ci) => (
                          <li
                            key={c.id}
                            className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
                          >
                            <div className="flex flex-col">
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                onClick={() =>
                                  setCriterios(
                                    g.id,
                                    moverEmLista(g.criterios, critVisIds, c.id, -1),
                                  )
                                }
                                disabled={ci === 0}
                                title="Subir"
                              >
                                <ArrowUp className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                onClick={() =>
                                  setCriterios(
                                    g.id,
                                    moverEmLista(g.criterios, critVisIds, c.id, 1),
                                  )
                                }
                                disabled={ci === critVis.length - 1}
                                title="Descer"
                              >
                                <ArrowDown className="size-3.5" />
                              </button>
                            </div>
                            <Input
                              value={c.texto}
                              placeholder="Critério (o que demonstrar para passar)"
                              onChange={(e) =>
                                setCriterios(
                                  g.id,
                                  g.criterios.map((x) =>
                                    x.id === c.id ? { ...x, texto: e.target.value } : x,
                                  ),
                                )
                              }
                              className="h-8 flex-1"
                            />
                            <EscopoIdade
                              value={c.faixaEtariaId}
                              bandas={bandas}
                              onChange={(id) =>
                                setCriterios(
                                  g.id,
                                  g.criterios.map((x) =>
                                    x.id === c.id ? { ...x, faixaEtariaId: id } : x,
                                  ),
                                )
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              title="Remover critério"
                              onClick={() =>
                                setCriterios(
                                  g.id,
                                  g.criterios.filter((x) => x.id !== c.id),
                                )
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-8"
                        onClick={() => addCriterio(g)}
                      >
                        <Plus className="size-3.5" />
                        Adicionar critério
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
