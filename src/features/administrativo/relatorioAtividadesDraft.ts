// Rascunho automático do Relatório de Atividades a partir dos dados que o
// sistema já tem (alunos, polos, graduações e eventos do ano). Sem IA e sem
// custo — um ponto de partida que o usuário revisa e complementa.
import { mudouDeCor } from "@/features/alunos/faixa";
import { dataBR } from "@/lib/format";
import { esc } from "@/lib/impressaoDocumento";
import type { Aluno, EventoCalendario, Polo } from "@/types";
import type { Graduacao } from "@/features/graduacoes/graduacoesApi";

export interface DadosRascunho {
  ano: number;
  alunos: Aluno[];
  polos: Polo[];
  graduacoes: Graduacao[];
  eventos: EventoCalendario[];
}

// Monta o rascunho como texto (editável na tela).
export function montarRascunhoAtividades(d: DadosRascunho): string {
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
  const listaEventos = eventos.length
    ? eventos.map((e) => `- ${dataBR(e.data)}: ${e.titulo}`).join("\n")
    : "Não há eventos registrados no calendário deste ano.";

  const linhaPolos = nPolos
    ? `O projeto atende atualmente ${nAlunos} aluno(s) em ${nPolos} polo(s)${
        nomesPolos ? `: ${nomesPolos}` : ""
      }.`
    : `O projeto atende atualmente ${nAlunos} aluno(s).`;

  return [
    `RELATÓRIO DE ATIVIDADES — ${d.ano}`,
    `Instituto Tribo de Davi`,
    ``,
    `APRESENTAÇÃO`,
    `O Instituto Tribo de Davi utiliza o jiu-jitsu como ferramenta de transformação social, oferecendo aulas gratuitas a crianças e adolescentes. Este relatório apresenta um panorama das atividades realizadas em ${d.ano}.`,
    ``,
    `ALCANCE`,
    linhaPolos,
    ``,
    `GRADUAÇÕES`,
    `Em ${d.ano} foram registradas ${total} graduação(ões): ${trocasCor} troca(s) de faixa (mudança de cor) e ${graus} novo(s) grau(s).`,
    ``,
    `EVENTOS E ATIVIDADES`,
    listaEventos,
    ``,
    `CONSIDERAÇÕES FINAIS`,
    `[Descreva aqui os destaques do ano, os desafios enfrentados, as parcerias, os agradecimentos e as metas para o próximo período.]`,
  ].join("\n");
}

// Converte o rascunho (texto) em HTML para a impressão/PDF. Linhas curtas em
// MAIÚSCULAS viram títulos; o resto vira parágrafo.
export function rascunhoParaHtml(texto: string): string {
  return texto
    .split(/\n{2,}/)
    .map((bloco) => {
      const linhas = bloco.split("\n");
      const primeira = linhas[0] ?? "";
      const ehTitulo =
        linhas.length === 1 &&
        primeira.length >= 3 &&
        primeira === primeira.toUpperCase() &&
        /[A-ZÀ-Ú]/.test(primeira);
      if (ehTitulo) {
        return `<h2 style="font-size:14px;margin:16px 0 6px;">${esc(primeira)}</h2>`;
      }
      return `<p style="margin:0 0 8px;line-height:1.5;">${linhas
        .map(esc)
        .join("<br>")}</p>`;
    })
    .join("");
}
