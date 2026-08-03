import type { ReactNode } from "react";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { TIPOS_BLOCO } from "@/types";
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

export interface BlocoCampos {
  nome: string;
  tipo: number;
  duracaoMinutos: number;
  descricao?: string | null;
}

interface Props {
  bloco: BlocoCampos;
  onChange: (patch: Partial<BlocoCampos>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  podeSubir: boolean;
  podeDescer: boolean;
  labelDescricao?: string;
  children?: ReactNode;
}

// Cartão comum de bloco (Planos e Modelos): reordenar, tipo, minutos,
// descrição e um slot opcional (ex.: atividades no editor de planos).
export function BlocoCard({
  bloco,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  podeSubir,
  podeDescer,
  labelDescricao = "Descrição / observações",
  children,
}: Props) {
  return (
    <Card>
      <CardContent className="flex gap-3 p-3">
        <div className="flex flex-col justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={!podeSubir}
            onClick={onMoveUp}
            aria-label="Mover para cima"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={!podeDescer}
            onClick={onMoveDown}
            aria-label="Mover para baixo"
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-5">
            <Label className="mb-1.5">Nome do bloco</Label>
            <Input
              value={bloco.nome}
              onChange={(e) => onChange({ nome: e.target.value })}
            />
          </div>
          <div className="sm:col-span-4">
            <Label className="mb-1.5">Tipo</Label>
            <Select
              value={String(bloco.tipo)}
              onValueChange={(v) => onChange({ tipo: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_BLOCO.map((t) => (
                  <SelectItem key={t.valor} value={String(t.valor)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Minutos</Label>
            <Input
              type="number"
              min={1}
              max={300}
              value={bloco.duracaoMinutos}
              onChange={(e) =>
                onChange({ duracaoMinutos: Math.max(1, Number(e.target.value) || 0) })
              }
            />
          </div>
          <div className="flex items-end sm:col-span-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              aria-label="Remover bloco"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          {children}

          <div className="sm:col-span-12">
            <Label className="mb-1.5">{labelDescricao}</Label>
            <Textarea
              rows={2}
              value={bloco.descricao ?? ""}
              onChange={(e) => onChange({ descricao: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
