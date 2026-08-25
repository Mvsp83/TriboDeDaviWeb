import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";
import { moeda, dataCurtaBR } from "@/lib/format";
import {
  FORMA_LABEL,
  type Doacao,
  type Doador,
  type ResumoDoacoes,
} from "@/features/doadores/doacoesApi";

const ESTILO = `
<style>
  table.rel{border-collapse:collapse;width:100%;font-size:11px;}
  table.rel th,table.rel td{border:1px solid #bbb;padding:4px 8px;text-align:left;vertical-align:top;}
  table.rel th{background:#eee;}
  table.rel td.num,table.rel th.num{text-align:right;white-space:nowrap;}
  table.rel td.nowrap,table.rel th.nowrap{white-space:nowrap;}
  table.rel tr:nth-child(even) td{background:#fafafa;}
  table.rel tfoot td{font-weight:600;background:#f0f0f0;}
</style>`;

// Relatório das doações do ano (aba "Doações").
export function exportarDoacoesPdf(
  doacoes: Doacao[],
  ano: number,
  resumo?: ResumoDoacoes,
): boolean {
  const total = doacoes.reduce((s, d) => s + d.valor, 0);

  const linhas = doacoes
    .map(
      (d) => `<tr>
        <td class="nowrap">${dataCurtaBR(d.data)}</td>
        <td>${esc(d.nomeDoador || "Anônimo")}</td>
        <td>${esc(FORMA_LABEL[d.forma] ?? d.forma)}</td>
        <td>${esc(d.finalidade || "-")}</td>
        <td class="num">${moeda(d.valor)}</td>
        <td class="nowrap">${esc(d.reciboNumero || "—")}</td>
      </tr>`,
    )
    .join("");

  const vazio = `<tr><td colspan="6" style="text-align:center;color:#777;padding:12px;">Nenhuma doação no período.</td></tr>`;

  const corpoHtml = `${ESTILO}
<table class="rel">
  <thead><tr>
    <th class="nowrap">Data</th><th>Doador</th><th>Forma</th>
    <th>Finalidade</th><th class="num">Valor</th><th class="nowrap">Recibo</th>
  </tr></thead>
  <tbody>${linhas || vazio}</tbody>
  <tfoot><tr>
    <td colspan="4" class="num">Total</td>
    <td class="num">${moeda(total)}</td><td></td>
  </tr></tfoot>
</table>`;

  const subtitulo = resumo
    ? `Ano ${ano} · ${resumo.quantidade} doação(ões) · ${resumo.doadores} doador(es) · total ${moeda(resumo.total)}`
    : `Ano ${ano} · ${doacoes.length} doação(ões) · total ${moeda(total)}`;

  return abrirParaImpressao({ titulo: "Doações", subtitulo, corpoHtml });
}

// Relatório dos doadores no ano (aba "Doadores"). Agrega as doações do ano por
// doador — quantidade, total e última doação no período — em vez dos totais
// históricos. Doações anônimas (sem doador) ficam de fora. Ordena por total.
export function exportarDoadoresPdf(
  doadores: Doador[],
  doacoes: Doacao[],
  ano: number,
): boolean {
  const porDoador = new Map<
    number,
    { qtd: number; total: number; ultima: string }
  >();
  for (const d of doacoes) {
    if (d.doadorId == null) continue;
    const cur = porDoador.get(d.doadorId) ?? { qtd: 0, total: 0, ultima: "" };
    cur.qtd += 1;
    cur.total += d.valor;
    if (!cur.ultima || d.data > cur.ultima) cur.ultima = d.data;
    porDoador.set(d.doadorId, cur);
  }

  const byId = new Map(doadores.map((x) => [x.id, x]));
  const linhasDados = [...porDoador.entries()]
    .map(([id, agg]) => ({ doador: byId.get(id), agg }))
    .filter((r): r is { doador: Doador; agg: (typeof r)["agg"] } => !!r.doador)
    .sort((a, b) => b.agg.total - a.agg.total);

  const total = linhasDados.reduce((s, r) => s + r.agg.total, 0);

  const linhas = linhasDados
    .map(
      ({ doador: d, agg }) => `<tr>
        <td>${esc(d.nome)}${d.tipoPessoa === 1 ? " (PJ)" : ""}</td>
        <td class="nowrap">${esc(d.documento || "-")}</td>
        <td>${esc(d.email || d.telefone || "-")}</td>
        <td class="num">${agg.qtd}</td>
        <td class="num">${moeda(agg.total)}</td>
        <td class="nowrap">${agg.ultima ? dataCurtaBR(agg.ultima) : "—"}</td>
      </tr>`,
    )
    .join("");

  const vazio = `<tr><td colspan="6" style="text-align:center;color:#777;padding:12px;">Nenhum doador identificado em ${ano}.</td></tr>`;

  const corpoHtml = `${ESTILO}
<table class="rel">
  <thead><tr>
    <th>Nome</th><th class="nowrap">Documento</th><th>Contato</th>
    <th class="num">Doações</th><th class="num">Total</th><th class="nowrap">Última</th>
  </tr></thead>
  <tbody>${linhas || vazio}</tbody>
  <tfoot><tr>
    <td colspan="4" class="num">Total arrecadado</td>
    <td class="num">${moeda(total)}</td><td></td>
  </tr></tfoot>
</table>`;

  return abrirParaImpressao({
    titulo: "Doadores",
    subtitulo: `Ano ${ano} · ${linhasDados.length} doador(es) · total ${moeda(total)}`,
    corpoHtml,
  });
}
