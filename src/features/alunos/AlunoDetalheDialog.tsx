import { Pencil } from "lucide-react";
import type { Aluno } from "@/types";
import { faixaInfo } from "@/features/alunos/faixa";
import { ehAlunoAdulto } from "@/features/alunos/publico";
import { AlunoAvatar } from "@/features/alunos/AlunoAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function idade(iso: string): number | null {
  if (!iso) return null;
  const n = new Date(iso);
  if (Number.isNaN(n.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) anos--;
  return anos;
}

function dataBr(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}

// Linha "rótulo: valor" — some quando não há valor.
function Campo({ label, valor }: { label: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{valor}</dd>
    </div>
  );
}

// Visualização somente-leitura da ficha do aluno. Abre ao clicar no nome, sem
// precisar entrar em "Editar". `onEditar` (admin) leva para a edição.
export function AlunoDetalheDialog({
  aluno,
  nomePolo,
  onOpenChange,
  onEditar,
}: {
  aluno: Aluno | null;
  nomePolo: string;
  onOpenChange: (aberto: boolean) => void;
  onEditar?: (aluno: Aluno) => void;
}) {
  if (!aluno) return null;

  const anos = idade(aluno.dataNascimento);
  const nascimento = dataBr(aluno.dataNascimento);
  const endereco = [
    [aluno.endereco, aluno.numero].filter(Boolean).join(", "),
    aluno.complemento,
    aluno.bairro,
    aluno.cidade,
  ]
    .filter(Boolean)
    .join(" · ");
  const autorizacao =
    aluno.autorizaImagem === true
      ? "Autoriza"
      : aluno.autorizaImagem === false
        ? "Não autoriza"
        : "Não informado";
  const escola = [aluno.escola, aluno.serie].filter(Boolean).join(" · ");

  return (
    <Dialog open={aluno !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Ficha do aluno</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <AlunoAvatar
            alunoId={aluno.id}
            nome={aluno.nome}
            temFoto={aluno.temFoto ?? false}
            size={56}
            ampliavel
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight">{aluno.nome}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: faixaInfo(aluno.faixa).cor,
                  color: faixaInfo(aluno.faixa).texto,
                  borderColor: "rgba(0,0,0,0.15)",
                }}
              >
                {faixaInfo(aluno.faixa).nome}
              </span>
              <span className="text-xs text-muted-foreground">
                {ehAlunoAdulto(aluno) ? "Adulto" : "Criança"}
              </span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Campo label="Polo" valor={nomePolo} />
          <Campo label="Turma" valor={String(aluno.turma)} />
          <Campo
            label="Nascimento"
            valor={
              nascimento && anos != null
                ? `${nascimento} (${anos} anos)`
                : nascimento
            }
          />
          <Campo label="Uso de imagem" valor={autorizacao} />
          <Campo label="Celular" valor={aluno.celular} />
          <Campo label="Telefone 2" valor={aluno.telefone2} />
          <Campo label="Responsável" valor={aluno.responsavel} />
          <Campo label="CPF do responsável" valor={aluno.cpfResponsavel} />
          <Campo label="CPF" valor={aluno.cpf} />
          <Campo label="RG" valor={aluno.rg} />
          <Campo label="Escola" valor={escola} />
          <div className="col-span-2">
            <Campo label="Endereço" valor={endereco} />
          </div>
        </dl>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {onEditar && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onEditar(aluno);
              }}
            >
              <Pencil className="size-4" />
              Editar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
