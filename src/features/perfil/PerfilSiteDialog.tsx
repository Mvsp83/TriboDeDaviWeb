import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { redimensionarQuadrado } from "@/lib/imagem";
import { ApiError } from "@/lib/api";
import { OPCOES_FAIXA_BASE, faixaInfo } from "@/features/alunos/faixa";
import {
  useMeuPerfilSite,
  useSalvarMeuPerfilSite,
} from "@/features/perfil/perfilSiteApi";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
}

// Perfil que aparece na seção "Polos e Endereços" do site: foto de rosto do
// professor numa moldura com a cor da faixa. Só vai ao site com o opt-in.
export function PerfilSiteDialog({ aberto, onOpenChange }: Props) {
  const { data: perfil } = useMeuPerfilSite();
  const salvar = useSalvarMeuPerfilSite();
  const inputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [faixa, setFaixa] = useState<string>("");
  const [foto, setFoto] = useState<string | null>(null);
  const [mostrar, setMostrar] = useState(false);
  const [processando, setProcessando] = useState(false);

  // Carrega os valores atuais quando abre.
  useEffect(() => {
    if (!aberto || !perfil) return;
    setNome(perfil.nome ?? "");
    setFaixa(perfil.faixa != null ? String(perfil.faixa) : "");
    setFoto(perfil.fotoSite ?? null);
    setMostrar(perfil.mostrarNoSite);
  }, [aberto, perfil]);

  const corFaixa = faixa !== "" ? faixaInfo(Number(faixa)).cor : "#d4d4d8";

  async function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessando(true);
    try {
      setFoto(await redimensionarQuadrado(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível processar a imagem.");
    } finally {
      setProcessando(false);
    }
  }

  async function onSalvar() {
    if (mostrar && !foto) {
      toast.warning("Envie uma foto para aparecer no site.");
      return;
    }
    try {
      await salvar.mutateAsync({
        nome: nome.trim() || null,
        faixa: faixa !== "" ? Number(faixa) : null,
        fotoSite: foto,
        mostrarNoSite: mostrar,
      });
      toast.success("Perfil do site atualizado!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível salvar o perfil.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Meu perfil no site</DialogTitle>
          <DialogDescription>
            Sua foto de rosto aparece na seção do seu polo, numa moldura com a
            cor da sua faixa.
          </DialogDescription>
        </DialogHeader>

        {/* Prévia: foto na moldura da faixa */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-muted"
            style={{ border: `4px solid ${corFaixa}` }}
          >
            {foto ? (
              <img src={foto} alt="Foto do professor" className="size-full object-cover" />
            ) : (
              <User className="size-10 text-muted-foreground" />
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onFoto}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={processando}
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {foto ? "Trocar foto" : "Enviar foto"}
          </Button>
        </div>

        <div>
          <Label className="mb-1.5">Nome</Label>
          <Input
            value={nome}
            maxLength={60}
            placeholder="Nome que aparece no site"
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1.5">Faixa</Label>
          <Select value={faixa} onValueChange={setFaixa}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a faixa" />
            </SelectTrigger>
            <SelectContent>
              {OPCOES_FAIXA_BASE.map((f) => (
                <SelectItem key={f.valor} value={String(f.valor)}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block size-3 rounded-full border border-border"
                      style={{ background: faixaInfo(f.valor).cor }}
                    />
                    {f.nome}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            checked={mostrar}
            onChange={(e) => setMostrar(e.target.checked)}
          />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Aparecer no site</span> —
            autorizo exibir minha foto e faixa na seção do meu polo.
          </span>
        </label>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => setFoto(null)}
            disabled={!foto}
            className="text-destructive focus:text-destructive"
          >
            Remover foto
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSalvar} disabled={salvar.isPending}>
              {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
