import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";
import type { Impacto } from "@/features/relatorios/impactoCalculos";

// Relatório de impacto em PDF, no formato que costuma ser anexado a editais e
// prestações de contas: os números grandes primeiro, depois a abertura por
// polo e os recortes de perfil e alcance.

function tabela(
  titulo: string,
  colunas: string[],
  linhas: (string | number)[][],
): string {
  if (linhas.length === 0) return "";
  const th = colunas
    .map((c, i) => `<th${i > 0 ? ' class="num"' : ""}>${esc(c)}</th>`)
    .join("");
  const tr = linhas
    .map(
      (l) =>
        `<tr>${l
          .map((v, i) => `<td${i > 0 ? ' class="num"' : ""}>${esc(String(v))}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<h2>${esc(titulo)}</h2><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

function distribuicao(
  titulo: string,
  itens: { nome: string; quantidade: number }[],
  total: number,
): string {
  if (itens.length === 0) return "";
  const linhas = itens.map((i) => [
    i.nome,
    i.quantidade,
    total > 0 ? `${Math.round((i.quantidade * 100) / total)}%` : "—",
  ]);
  return tabela(titulo, ["", "Qtde", "%"], linhas);
}

export function imprimirImpacto(i: Impacto): boolean {
  const freq = i.frequenciaMedia != null ? `${i.frequenciaMedia}%` : "—";

  const destaques = `
<div class="destaques">
  <div class="d"><span class="n">${i.atendidos}</span><span class="r">crianças e adolescentes atendidos</span></div>
  <div class="d"><span class="n">${i.polos}</span><span class="r">polos em funcionamento</span></div>
  <div class="d"><span class="n">${i.aulas}</span><span class="r">aulas realizadas</span></div>
  <div class="d"><span class="n">${freq}</span><span class="r">frequência média</span></div>
</div>`;

  const porPolo = tabela(
    "Atendimento por polo",
    ["Polo", "Alunos", "Aulas", "Frequência"],
    i.porPolo.map((p) => [
      p.nome,
      p.alunos,
      p.aulas,
      p.frequencia != null ? `${p.frequencia}%` : "—",
    ]),
  );

  const perfil =
    distribuicao(
      "Faixa etária",
      i.faixasEtarias.map((f) => ({ nome: f.rotulo, quantidade: f.quantidade })),
      i.atendidos,
    ) + distribuicao("Graduação (faixa)", i.graduacoes, i.atendidos);

  const alcance =
    distribuicao("Bairros alcançados", i.bairros.slice(0, 12), i.atendidos) +
    `<h2>Alcance</h2>
     <table><tbody>
       <tr><td>Escolas de origem</td><td class="num">${i.escolas}</td></tr>
       <tr><td>Bairros atendidos</td><td class="num">${i.bairros.length}</td></tr>
       <tr><td>Presenças registradas</td><td class="num">${i.presencasRegistradas}</td></tr>
     </tbody></table>`;

  const corpoHtml = `
<style>
  h2 {
    font-size: 12px; text-transform: uppercase; letter-spacing: .04em;
    border-bottom: 1px solid #999; padding-bottom: 3px; margin: 16px 0 6px 0;
  }
  .destaques { display: flex; gap: 8px; margin-bottom: 6px; }
  .destaques .d {
    flex: 1; border: 1px solid #ccc; border-radius: 6px; padding: 8px;
    text-align: center;
  }
  .destaques .n { display: block; font-size: 22px; font-weight: 700; }
  .destaques .r { display: block; font-size: 9px; color: #555; line-height: 1.3; }
  table { border-collapse: collapse; width: 100%; font-size: 10px; margin-bottom: 4px; }
  th, td { border: 1px solid #bbb; padding: 4px 6px; text-align: left; }
  th { background: #eee; }
  td.num, th.num { text-align: right; width: 70px; }
  tr:nth-child(even) td { background: #fafafa; }
  .nota { font-size: 9px; color: #666; margin-top: 12px; line-height: 1.45; }
</style>

${destaques}
${porPolo}
${perfil}
${alcance}

<p class="nota">
  Os números deste relatório são apurados automaticamente a partir dos registros
  do sistema no ano de ${i.ano}: matrículas, aulas cadastradas e chamadas
  realizadas pelos professores. A frequência média é a razão entre presenças e
  o total de registros de chamada do período.
</p>`;

  return abrirParaImpressao({
    titulo: `Relatório de Impacto ${i.ano}`,
    subtitulo: `${i.atendidos} atendidos · ${i.polos} polo(s) · ${i.aulas} aulas`,
    corpoHtml,
  });
}
