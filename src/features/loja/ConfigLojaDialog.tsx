import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfigLoja, useSalvarConfigLoja } from "@/features/loja/produtosApi";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Config da loja (admin): liga/desliga a compra por WhatsApp e define o número
// que recebe os pedidos. Antes isso vivia no código-fonte.
export function ConfigLojaDialog({
  aberto,
  onOpenChange,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
}) {
  const { data: config } = useConfigLoja();
  const salvar = useSalvarConfigLoja();

  const [habilitada, setHabilitada] = useState(false);
  const [numero, setNumero] = useState("");

  // Preenche com os valores atuais ao abrir (ou quando a config chega).
  useEffect(() => {
    if (aberto && config) {
      setHabilitada(config.compraWhatsappHabilitada);
      setNumero(config.whatsappNumero ?? "");
    }
  }, [aberto, config]);

  async function handleSalvar() {
    const digitos = numero.replace(/\D/g, "");
    if (habilitada && !digitos) {
      toast.error("Informe o número do WhatsApp para habilitar a compra.");
      return;
    }
    try {
      await salvar.mutateAsync({
        compraWhatsappHabilitada: habilitada,
        whatsappNumero: digitos,
      });
      toast.success("Configuração da loja salva.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuração da loja</DialogTitle>
          <DialogDescription>
            Compra por WhatsApp na vitrine do site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={habilitada}
              onChange={(e) => setHabilitada(e.target.checked)}
            />
            Mostrar botão “Comprar via WhatsApp”
          </label>

          <div>
            <Label className="mb-1.5">Número do WhatsApp (com DDD)</Label>
            <Input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="47999998888"
              inputMode="numeric"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Só números, com DDD. É o número que recebe os pedidos.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
