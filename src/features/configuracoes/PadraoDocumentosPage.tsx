import { useMemo, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, RotateCcw, Loader2, Upload, Trash2 } from "lucide-react";
import {
  carregarDocumentoPadrao,
  salvarDocumentoPadrao,
  PADRAO_DEFAULT,
  MODELOS_CABECALHO,
  type DocumentoPadrao,
  type ModeloCabecalho,
} from "@/lib/documentoPadrao";
import {
  useDocumentoPadraoRemoto,
  useSalvarDocumentoPadrao,
} from "@/features/configuracoes/configuracaoDocumentoApi";
import { montarDocumentoHtml, esc } from "@/lib/impressaoDocumento";
import { corpoCertificado } from "@/features/graduacoes/certificadoPdf";
import type { Graduacao } from "@/features/graduacoes/graduacoesApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Abas: um cabeçalho/rodapé (a "casca") vale para todos os documentos; cada aba
// edita uma parte e mostra uma prévia condizente.
type AbaId = "geral" | "oficio" | "recibo" | "certificado";
const ABAS: { id: AbaId; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "oficio", label: "Ofício" },
  { id: "recibo", label: "Recibo" },
  { id: "certificado", label: "Certificado" },
];

// Logo próprio é guardado como data URL dentro do config (sem object storage).
// Cap para o base64 não inflar o JSON compartilhado; SVG/PNG pequeno é ideal.
const LIMITE_LOGO = 300_000; // ~220 KB de imagem

// Graduação de exemplo só para a prévia do certificado.
const CERT_EXEMPLO: Graduacao = {
  id: 0,
  alunoId: 0,
  poloId: 0,
  faixaAnterior: 0,
  faixaNova: 1,
  data: new Date().toISOString(),
  nomeAluno: "Nome do Aluno",
  poloNome: "Central",
};

// ---- Corpos de exemplo por aba (mostram a casca ao redor de um conteúdo) ----

const CORPO_GERAL = `
  <p style="font-size:13px;color:#333;"><strong>Objetivo:</strong> Exemplo de conteúdo do documento.</p>
  <h2>Seção</h2>
  <p style="font-size:12px;color:#444;">O conteúdo de cada documento (plano de aula, relatório, etc.) aparece aqui. O cabeçalho e o rodapé acima e abaixo seguem o padrão definido nesta tela.</p>
`;

function corpoOficioExemplo(cfg: DocumentoPadrao): string {
  return `
  <p>${esc(cfg.oficio.saudacao)}</p>
  <p>Vimos, por meio deste, apresentar o Instituto e o trabalho social que desenvolvemos, colocando-nos à disposição para eventual parceria. Este é apenas um <em>texto de exemplo</em> para você ver como o ofício ficará com o padrão definido.</p>
  <p>${esc(cfg.oficio.fecho).replace(/\n/g, "<br>")}</p>
  <div style="margin-top:36px;text-align:center;">
    <div style="border-top:1px solid #111;width:60%;margin:0 auto;padding-top:4px;">
      <strong>${esc(cfg.oficio.assinante)}</strong><br>
      <span style="color:#555;font-size:12px;">${esc(cfg.oficio.cargo)}</span>
    </div>
  </div>`;
}

function corpoReciboExemplo(cfg: DocumentoPadrao): string {
  return `
  <p>Recebemos a importância de <strong>R$ 100,00</strong> (cem reais), referente à contribuição/doação ao Instituto. Texto de exemplo para conferir o padrão do recibo.</p>
  <p>Para clareza e comprovação, firmamos o presente recibo.</p>
  <div style="margin-top:36px;text-align:center;">
    <div style="border-top:1px solid #111;width:60%;margin:0 auto;padding-top:4px;">
      <strong>${esc(cfg.recibo.assinante)}</strong>
    </div>
  </div>`;
}

export function PadraoDocumentosPage() {
  const remoto = useDocumentoPadraoRemoto();
  const salvarMut = useSalvarDocumentoPadrao();
  const [cfg, setCfg] = useState<DocumentoPadrao>(() => carregarDocumentoPadrao());
  const [aba, setAba] = useState<AbaId>("geral");
  const inputLogo = useRef<HTMLInputElement>(null);

  // Quando o padrão chega da API, sincroniza o formulário (fonte da verdade).
  useEffect(() => {
    if (remoto.data) setCfg(remoto.data);
  }, [remoto.data]);

  function set<K extends keyof DocumentoPadrao>(chave: K, valor: DocumentoPadrao[K]) {
    setCfg((c) => ({ ...c, [chave]: valor }));
  }

  // Atualiza um campo de um bloco por tipo (ofício/recibo/certificado).
  function setBloco<S extends "oficio" | "recibo" | "certificado">(
    secao: S,
    patch: Partial<DocumentoPadrao[S]>,
  ) {
    setCfg((c) => ({ ...c, [secao]: { ...c[secao], ...patch } }));
  }

  // Prévia condizente com a aba ativa.
  const previaHtml = useMemo(() => {
    if (aba === "certificado") {
      return montarDocumentoHtml(
        { titulo: "Certificado", corpoHtml: corpoCertificado(CERT_EXEMPLO, cfg) },
        cfg,
        false,
      );
    }
    if (aba === "oficio") {
      return montarDocumentoHtml(
        { titulo: "Ofício", subtitulo: "Nº 001/2026 · exemplo", corpoHtml: corpoOficioExemplo(cfg) },
        cfg,
        false,
      );
    }
    if (aba === "recibo") {
      return montarDocumentoHtml(
        { titulo: "Recibo", subtitulo: "Nº 001/2026 · exemplo", corpoHtml: corpoReciboExemplo(cfg) },
        cfg,
        false,
      );
    }
    return montarDocumentoHtml(
      {
        titulo: "Título do Documento",
        subtitulo: "Subtítulo · data · turma · polo",
        corpoHtml: CORPO_GERAL,
      },
      cfg,
      false,
    );
  }, [cfg, aba]);

  function aoEscolherLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-selecionar o mesmo arquivo
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (PNG, SVG ou JPG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      if (dataUrl.length > LIMITE_LOGO) {
        toast.error("Imagem muito grande. Use um arquivo menor (de preferência SVG ou PNG leve).");
        return;
      }
      set("logoDataUrl", dataUrl);
      toast.success("Logo carregado. Clique em Salvar para aplicar.");
    };
    reader.onerror = () => toast.error("Não foi possível ler o arquivo.");
    reader.readAsDataURL(file);
  }

  function salvar() {
    salvarMut.mutate(cfg, {
      onSuccess: () => toast.success("Padrão salvo — vale para todos os usuários."),
      onError: () => {
        // API sem o endpoint ainda (migration pendente): salva ao menos local.
        salvarDocumentoPadrao(cfg);
        toast.warning(
          "Salvo apenas neste navegador — a API não respondeu (migration pendente?).",
        );
      },
    });
  }

  function restaurar() {
    setCfg(PADRAO_DEFAULT);
    toast.info("Padrão restaurado. Clique em Salvar para confirmar.");
  }

  const logoAtual = cfg.logoDataUrl || "/simbolo.png";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Padrão de Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Defina o cabeçalho e o rodapé aplicados a todos os documentos
          exportados (planos, relatórios, ofícios e recibos) e os textos-padrão
          de ofício, recibo e certificado de graduação.
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap items-center gap-1.5" role="tablist">
        {ABAS.map((a) => {
          const ativo = aba === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setAba(a.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                ativo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Formulário da aba ativa */}
        <Card>
          <CardContent className="space-y-4 p-5">
            {aba === "geral" && (
              <>
                <div>
                  <Label className="mb-1.5">Título do cabeçalho</Label>
                  <Input
                    value={cfg.tituloCabecalho}
                    onChange={(e) => set("tituloCabecalho", e.target.value)}
                    placeholder="INSTITUTO TRIBO DE DAVI"
                  />
                </div>

                {/* Modelo de cabeçalho */}
                <div>
                  <Label className="mb-1.5">Modelo do cabeçalho</Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {MODELOS_CABECALHO.map((m) => {
                      const ativo = cfg.modelo === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => set("modelo", m.id as ModeloCabecalho)}
                          className={cn(
                            "rounded-md border p-2.5 text-left transition-colors",
                            ativo
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-secondary",
                          )}
                        >
                          <div className="text-sm font-medium">{m.nome}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{m.descricao}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Logo / marca */}
                <div>
                  <Label className="mb-1.5">Logo do cabeçalho</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex size-16 items-center justify-center rounded-md border border-border bg-neutral-900 p-1.5">
                      <img src={logoAtual} alt="" className="max-h-full max-w-full" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => inputLogo.current?.click()}>
                          <Upload className="size-4" /> Enviar logo
                        </Button>
                        {cfg.logoDataUrl && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => set("logoDataUrl", "")}>
                            <Trash2 className="size-4" /> Usar símbolo padrão
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, SVG ou JPG. {cfg.logoDataUrl ? "Logo próprio em uso." : "Usando o símbolo padrão do instituto."}
                      </p>
                    </div>
                    <input
                      ref={inputLogo}
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      className="hidden"
                      onChange={aoEscolherLogo}
                    />
                  </div>
                  <label className="mt-3 flex items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={cfg.mostrarLogo}
                      onChange={(e) => set("mostrarLogo", e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    Mostrar logo no cabeçalho
                  </label>
                </div>

                {/* Contato estruturado */}
                <div className="border-t border-border pt-4">
                  <h2 className="text-sm font-semibold">Contato / identificação</h2>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Aparece abaixo do nome no cabeçalho. Deixe em branco o que não quiser mostrar.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-1.5">Endereço</Label>
                      <Input
                        value={cfg.endereco}
                        onChange={(e) => set("endereco", e.target.value)}
                        placeholder="Rua Exemplo, 123 — Bairro, Cidade/UF"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="mb-1.5">Telefone</Label>
                        <Input
                          value={cfg.telefone}
                          onChange={(e) => set("telefone", e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5">E-mail</Label>
                        <Input
                          value={cfg.email}
                          onChange={(e) => set("email", e.target.value)}
                          placeholder="instituto@email.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="mb-1.5">Site</Label>
                        <Input
                          value={cfg.site}
                          onChange={(e) => set("site", e.target.value)}
                          placeholder="www.site.com.br"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5">CNPJ</Label>
                        <Input
                          value={cfg.cnpj}
                          onChange={(e) => set("cnpj", e.target.value)}
                          placeholder="00.000.000/0001-00"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1.5">Outras linhas (opcional)</Label>
                      <Textarea
                        rows={2}
                        value={cfg.linhaExtra}
                        onChange={(e) => set("linhaExtra", e.target.value)}
                        placeholder={"Uma informação por linha"}
                      />
                    </div>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="border-t border-border pt-4">
                  <h2 className="text-sm font-semibold">Rodapé</h2>
                  <div className="mt-3">
                    <Label className="mb-1.5">Texto do rodapé</Label>
                    <Input
                      value={cfg.textoRodape}
                      onChange={(e) => set("textoRodape", e.target.value)}
                      placeholder="Instituto Tribo de Davi"
                    />
                  </div>
                  <label className="mt-3 flex items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={cfg.mostrarDataGeracao}
                      onChange={(e) => set("mostrarDataGeracao", e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    Mostrar data de geração no rodapé
                  </label>
                </div>
              </>
            )}

            {aba === "oficio" && (
              <>
                <div>
                  <h2 className="text-sm font-semibold">Ofício (padrão)</h2>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Vem preenchido ao criar um novo ofício; dá para editar no documento.
                  </p>
                </div>
                <div>
                  <Label className="mb-1.5">Saudação</Label>
                  <Input
                    value={cfg.oficio.saudacao}
                    onChange={(e) => setBloco("oficio", { saudacao: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Fecho</Label>
                  <Textarea
                    rows={4}
                    value={cfg.oficio.fecho}
                    onChange={(e) => setBloco("oficio", { fecho: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1.5">Assinante</Label>
                    <Input
                      value={cfg.oficio.assinante}
                      onChange={(e) => setBloco("oficio", { assinante: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Cargo</Label>
                    <Input
                      value={cfg.oficio.cargo}
                      onChange={(e) => setBloco("oficio", { cargo: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {aba === "recibo" && (
              <>
                <div>
                  <h2 className="text-sm font-semibold">Recibo (padrão)</h2>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Vale para o recibo avulso. O recibo de doação usa os dados do doador.
                  </p>
                </div>
                <div>
                  <Label className="mb-1.5">Emitente / assinante</Label>
                  <Input
                    value={cfg.recibo.assinante}
                    onChange={(e) => setBloco("recibo", { assinante: e.target.value })}
                  />
                </div>
              </>
            )}

            {aba === "certificado" && (
              <>
                <div>
                  <h2 className="text-sm font-semibold">Certificado de graduação</h2>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Textos fixos do certificado; o miolo (aluno, faixa, data) vem da graduação.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5">Título</Label>
                    <Input
                      value={cfg.certificado.titulo}
                      onChange={(e) => setBloco("certificado", { titulo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Subtítulo</Label>
                    <Input
                      value={cfg.certificado.subtitulo}
                      onChange={(e) => setBloco("certificado", { subtitulo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5">Assinatura à esquerda</Label>
                    <Input
                      value={cfg.certificado.assinaturaEsquerda}
                      onChange={(e) => setBloco("certificado", { assinaturaEsquerda: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5">Assinatura à direita</Label>
                    <Input
                      value={cfg.certificado.assinaturaDireita}
                      onChange={(e) => setBloco("certificado", { assinaturaDireita: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Ações — sempre visíveis, valem para toda a configuração */}
            <div className="flex gap-2 border-t border-border pt-4">
              <Button onClick={salvar} disabled={salvarMut.isPending}>
                {salvarMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Salvar
              </Button>
              <Button variant="outline" onClick={restaurar}>
                <RotateCcw className="size-4" /> Restaurar padrão
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              O padrão é salvo na API e vale para todos os usuários. Uma cópia
              fica neste navegador para a exportação funcionar offline.
            </p>
          </CardContent>
        </Card>

        {/* Prévia da aba ativa */}
        <Card>
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center justify-between">
              <Label>Prévia</Label>
              <span className="text-xs text-muted-foreground">
                {ABAS.find((a) => a.id === aba)?.label}
              </span>
            </div>
            <iframe
              key={aba}
              srcDoc={previaHtml}
              title="Prévia do documento"
              className="h-[560px] w-full rounded-md border border-border bg-white"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
