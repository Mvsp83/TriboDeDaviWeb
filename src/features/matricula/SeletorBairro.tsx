import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BAIRROS } from "@/features/matricula/bairros";

// Seletor de bairro padronizado: escolhe de uma lista fechada (evita o mesmo
// bairro escrito de formas diferentes) com uma saída "Outro" para quem não
// está na lista — ex.: bairro novo ou de outra cidade. Ao escolher "Outro",
// aparece um campo de texto livre.
//
// O valor final continua sendo uma string simples (o nome do bairro), então
// os formulários não precisam de nenhum estado extra.
const OUTRO = "__outro__";

export function SeletorBairro({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Monta em "Outro" quando já vem um valor que não está na lista (rascunho
  // restaurado, edição). O inicializador roda uma vez, no mount — que aqui só
  // acontece quando a etapa de endereço aparece, depois do rascunho carregado.
  const [outro, setOutro] = useState(
    () => value.trim() !== "" && !BAIRROS.includes(value),
  );

  return (
    <div className="space-y-2">
      <Select
        value={outro ? OUTRO : BAIRROS.includes(value) ? value : ""}
        onValueChange={(v) => {
          if (v === OUTRO) {
            setOutro(true);
            onChange("");
          } else {
            setOutro(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione o bairro" />
        </SelectTrigger>
        <SelectContent>
          {BAIRROS.map((b) => (
            <SelectItem key={b} value={b}>
              {b}
            </SelectItem>
          ))}
          <SelectItem value={OUTRO}>Outro (não está na lista)</SelectItem>
        </SelectContent>
      </Select>

      {outro && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite o nome do bairro"
          autoFocus
        />
      )}
    </div>
  );
}
