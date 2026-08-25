import type { Aluno } from "@/types";

// Idade em anos completos a partir da data de nascimento (ISO). null se vazia.
export function idadeEmAnos(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) anos -= 1;
  return anos;
}

// É adulto? A marca explícita (ehAdulto, herdada da inscrição de adulto na
// aprovação) manda; na falta dela, cai para a idade (18+). Assim funciona tanto
// para quem se inscreveu pela ficha de adulto quanto para os cadastros antigos.
export function ehAlunoAdulto(
  aluno: Pick<Aluno, "ehAdulto" | "dataNascimento">,
): boolean {
  if (aluno.ehAdulto) return true;
  const anos = idadeEmAnos(aluno.dataNascimento);
  return anos != null && anos >= 18;
}
