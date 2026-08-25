import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Check, HeartHandshake, QrCode } from "lucide-react";
import { gerarPixBrCode } from "@/lib/pixBrCode";
import { DOACAO, doacaoConfigurada } from "@/features/doacao/configDoacao";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginaPublica } from "@/components/PaginaPublica";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Página pública de doação: mostra o QR Code e o "copia e cola" do Pix.
// Não depende de login nem da API — funciona mesmo com o backend fora do ar.
export function DoacaoPage() {
  useDocumentTitle("Doar por Pix — Instituto Tribo de Davi");
  const [valor, setValor] = useState<number | null>(null);
  const [outro, setOutro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const configurada = doacaoConfigurada();

  const codigo = useMemo(() => {
    if (!configurada) return "";
    return gerarPixBrCode({
      chave: DOACAO.chave,
      nome: DOACAO.nome,
      cidade: DOACAO.cidade,
      valor,
    });
  }, [valor, configurada]);

  useEffect(() => {
    if (!codigo) {
      setQrDataUrl("");
      return;
    }
    let ativo = true;
    QRCode.toDataURL(codigo, { width: 320, margin: 1 })
      .then((url) => ativo && setQrDataUrl(url))
      .catch(() => ativo && setQrDataUrl(""));
    return () => {
      ativo = false;
    };
  }, [codigo]);

  // Trocar o valor invalida o código copiado antes.
  useEffect(() => setCopiado(false), [codigo]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      toast.success("Código Pix copiado!");
    } catch {
      toast.error("Não foi possível copiar. Selecione o código e copie manualmente.");
    }
  }

  function escolherOutro(texto: string) {
    setOutro(texto);
    const n = Number(texto.replace(",", "."));
    setValor(Number.isFinite(n) && n > 0 ? n : null);
  }

  return (
    <PaginaPublica larguraMax="max-w-2xl">
      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 md:p-8">
      <header className="space-y-2 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <HeartHandshake className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Ajude o Instituto Tribo de Davi
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Sua doação mantém as aulas gratuitas de arte marcial para crianças e
          adolescentes. Contribua por Pix — rápido, seguro e sem taxas.
        </p>
      </header>

      {!configurada ? (
        <Card>
          <CardContent className="space-y-2 p-6 text-center">
            <p className="font-medium">Doação ainda não configurada</p>
            <p className="text-sm text-muted-foreground">
              A chave Pix da instituição precisa ser preenchida em{" "}
              <code className="rounded bg-secondary px-1 py-0.5 text-xs">
                src/features/doacao/configDoacao.ts
              </code>{" "}
              antes de divulgar esta página.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <Label className="mb-2">Escolha um valor</Label>
                <div className="flex flex-wrap gap-2">
                  {DOACAO.sugestoes.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setValor(v);
                        setOutro("");
                      }}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        valor === v && !outro
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                      )}
                    >
                      {brl(v)}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setValor(null);
                      setOutro("");
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      valor === null && !outro
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                    )}
                  >
                    Escolher no banco
                  </button>
                </div>
              </div>

              <div>
                <Label className="mb-1.5">Ou digite outro valor (R$)</Label>
                <Input
                  inputMode="decimal"
                  placeholder="ex: 75,00"
                  value={outro}
                  onChange={(e) => escolherOutro(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="size-4 text-primary" />
                {valor ? `Doar ${brl(valor)} por Pix` : "Doar por Pix"}
              </div>

              {qrDataUrl && (
                <div className="flex justify-center">
                  {/* Fundo branco fixo: QR precisa de contraste, inclusive no tema escuro. */}
                  <img
                    src={qrDataUrl}
                    alt="QR Code para doação via Pix"
                    className="size-56 rounded-lg bg-white p-2"
                  />
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Abra o app do seu banco, escolha <strong>Pix → Ler QR Code</strong> e
                aponte para a imagem. Ou use o código abaixo.
              </p>

              <div className="space-y-2">
                <Label>Pix copia e cola</Label>
                <textarea
                  readOnly
                  value={codigo}
                  onFocus={(e) => e.currentTarget.select()}
                  rows={3}
                  className="w-full resize-none rounded-md border border-border bg-secondary/40 p-2 font-mono text-[11px] leading-snug text-muted-foreground"
                />
                <Button className="w-full" onClick={copiar}>
                  {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copiado ? "Código copiado" : "Copiar código Pix"}
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Recebedor: <strong>{DOACAO.nome}</strong> · {DOACAO.cidade}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Precisa de recibo de doação? Fale com a administração do instituto.
      </p>
      </div>
    </PaginaPublica>
  );
}
