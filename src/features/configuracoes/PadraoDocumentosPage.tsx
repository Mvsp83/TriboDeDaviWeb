import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import {
  carregarDocumentoPadrao,
  salvarDocumentoPadrao,
  PADRAO_DEFAULT,
  type DocumentoPadrao,
} from "@/lib/documentoPadrao";
import {
  useDocumentoPadraoRemoto,
  useSalvarDocumentoPadrao,
} from "@/features/configuracoes/configuracaoDocumentoApi";
import { montarDocumentoHtml } from "@/lib/impressaoDocumento";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Corpo de exemplo só para a prévia — mostra a "casca" ao redor de um conteúdo
// qualquer, para o usuário ver como os documentos ficarão.
const CORPO_EXEMPLO = `
  <p style="font-size:13px;color:#333;"><strong>Objetivo:</strong> Exemplo de conteúdo do documento.</p>
  <h2>Seção</h2>
  <p style="font-size:12px;color:#444;">O conteúdo de cada documento (plano de aula, relatório, etc.) aparece aqui. O cabeçalho e o rodapé acima e abaixo seguem o padrão definido nesta tela.</p>
`;

export function PadraoDocumentosPage() {
  const remoto = useDocumentoPadraoRemoto();
  const salvarMut = useSalvarDocumentoPadrao();
  const [cfg, setCfg] = useState<DocumentoPadrao>(() => carregarDocumentoPadrao());

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

  const previaHtml = useMemo(
    () =>
      montarDocumentoHtml(
        {
          titulo: "Título do Documento",
          subtitulo: "Subtítulo · data · turma · polo",
          corpoHtml: CORPO_EXEMPLO,
        },
        cfg,
        false,
      ),
    [cfg],
  );

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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Formulário */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <Label className="mb-1.5">Título do cabeçalho</Label>
              <Input
                value={cfg.tituloCabecalho}
                onChange={(e) => set("tituloCabecalho", e.target.value)}
                placeholder="INSTITUTO TRIBO DE DAVI"
              />
            </div>

            <div>
              <Label className="mb-1.5">Linha extra do cabeçalho (opcional)</Label>
              <Input
                value={cfg.linhaExtra}
                onChange={(e) => set("linhaExtra", e.target.value)}
                placeholder="Endereço, CNPJ ou contato"
              />
            </div>

            <div>
              <Label className="mb-1.5">Texto do rodapé</Label>
              <Input
                value={cfg.textoRodape}
                onChange={(e) => set("textoRodape", e.target.value)}
                placeholder="Instituto Tribo de Davi"
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={cfg.mostrarLogo}
                onChange={(e) => set("mostrarLogo", e.target.checked)}
                className="size-4 accent-primary"
              />
              Mostrar logo no cabeçalho
            </label>

            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={cfg.mostrarDataGeracao}
                onChange={(e) => set("mostrarDataGeracao", e.target.checked)}
                className="size-4 accent-primary"
              />
              Mostrar data de geração no rodapé
            </label>

            {/* Ofício — textos que já vêm preenchidos ao criar um novo ofício. */}
            <div className="border-t border-border pt-4">
              <h2 className="text-sm font-semibold">Ofício (padrão)</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Vem preenchido ao criar um novo ofício; dá para editar no documento.
              </p>
              <div className="space-y-3">
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
                    rows={3}
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
              </div>
            </div>

            {/* Recibo */}
            <div className="border-t border-border pt-4">
              <h2 className="text-sm font-semibold">Recibo (padrão)</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Vale para o recibo avulso. O recibo de doação usa os dados do doador.
              </p>
              <div>
                <Label className="mb-1.5">Emitente / assinante</Label>
                <Input
                  value={cfg.recibo.assinante}
                  onChange={(e) => setBloco("recibo", { assinante: e.target.value })}
                />
              </div>
            </div>

            {/* Certificado de graduação */}
            <div className="border-t border-border pt-4">
              <h2 className="text-sm font-semibold">Certificado de graduação</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Textos fixos do certificado; o miolo (aluno, faixa, data) vem da graduação.
              </p>
              <div className="space-y-3">
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
              </div>
            </div>

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

        {/* Prévia */}
        <Card>
          <CardContent className="space-y-2 p-5">
            <Label>Prévia</Label>
            <iframe
              srcDoc={previaHtml}
              title="Prévia do documento"
              className="h-[520px] w-full rounded-md border border-border bg-white"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
