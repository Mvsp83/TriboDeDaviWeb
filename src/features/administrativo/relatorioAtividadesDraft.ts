// Bloco de números do ano, montado a partir dos dados que o sistema já tem
// (alunos, polos, graduações e eventos). Usado para preencher uma seção do
// modelo do Relatório de Atividades — sem IA e sem custo.
import { mudouDeCor } from "@/features/alunos/faixa";
import { dataBR } from "@/lib/format";
import type { Aluno, EventoCalendario, Polo } from "@/types";
import type { Graduacao } from "@/features/graduacoes/graduacoesApi";

export interface DadosRascunho {
  ano: number;
  alunos: Aluno[];
  polos: Polo[];
  graduacoes: Graduacao[];
  eventos: EventoCalendario[];
}

export function blocoNumerosAno(d: DadosRascunho): string {
  const nAlunos = d.alunos.length;
  const nPolos = d.polos.length;
  const nomesPolos = d.polos
    .map((p) => p.nome)
    .filter(Boolean)
    .join(", ");

  const total = d.graduacoes.length;
  const trocasCor = d.graduacoes.filter((g) =>
    mudouDeCor(g.faixaAnterior, g.faixaNova),
  ).length;
  const graus = total - trocasCor;

  const eventos = [...d.eventos].sort((a, b) => a.data.localeCompare(b.data));

  const linhaPolos = nPolos
    ? `O projeto atende atualmente ${nAlunos} aluno(s) em ${nPolos} polo(s)${
        nomesPolos ? `: ${nomesPolos}` : ""
      }.`
    : `O projeto atende atualmente ${nAlunos} aluno(s).`;

  const linhaEventos = eventos.length
    ? `Eventos e atividades no ano:\n${eventos
        .map((e) => `- ${dataBR(e.data)}: ${e.titulo}`)
        .join("\n")}`
    : "Não há eventos registrados no calendário deste ano.";

  return [
    linhaPolos,
    `Em ${d.ano} foram registradas ${total} graduação(ões): ${trocasCor} troca(s) de faixa (mudança de cor) e ${graus} novo(s) grau(s).`,
    ``,
    linhaEventos,
  ].join("\n");
}
