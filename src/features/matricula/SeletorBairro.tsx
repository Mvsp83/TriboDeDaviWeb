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
  const listado = BAIRROS.includes(value);

  // "Outro" é derivado do próprio valor (robusto a valor preenchido depois do
  // mount — rascunho restaurado, edição de registro com bairro fora da lista):
  //  - valor preenchido e fora da lista  -> Outro, com o texto visível;
  //  - valor vazio                        -> normalmente é "nada selecionado",
  //    exceto logo após clicar em "Outro", quando ainda não digitou nada — esse
  //    caso transitório é o único que precisa de estado.
  const [outroVazio, setOutroVazio] = useState(false);
  const outro = value.trim() !== "" ? !listado : outroVazio;

  return (
    <div className="space-y-2">
      <Select
        value={outro ? OUTRO : listado ? value : ""}
        onValueChange={(v) => {
          if (v === OUTRO) {
            setOutroVazio(true);
            onChange("");
          } else {
            setOutroVazio(false);
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
          autoFocus={outroVazio}
        />
      )}
    </div>
  );
}
