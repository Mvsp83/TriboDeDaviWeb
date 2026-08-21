import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";
import { moeda, dataCurtaBR } from "@/lib/format";
import {
  CATEGORIA_BEM_LABEL,
  ESTADO_BEM_LABEL,
} from "@/features/patrimonio/tipos";
import type { BemPatrimonial } from "@/types";

export function exportarPatrimonioPdf(
  bens: BemPatrimonial[],
  nomePolo: (id: number | null | undefined) => string,
): boolean {
  const total = bens.reduce((s, b) => s + b.quantidade * b.valorUnitario, 0);

  const linhas = bens
    .map((b) => {
      const valorTotal = b.quantidade * b.valorUnitario;
      return `<tr>
        <td>${esc(CATEGORIA_BEM_LABEL[b.categoria] ?? "-")}</td>
        <td>${esc(b.descricao)}</td>
        <td class="num">${b.quantidade}</td>
        <td class="num">${moeda(b.valorUnitario)}</td>
        <td class="num">${moeda(valorTotal)}</td>
        <td>${esc(ESTADO_BEM_LABEL[b.estado] ?? "-")}</td>
        <td>${esc(nomePolo(b.poloId))}</td>
        <td>${b.dataAquisicao ? dataCurtaBR(b.dataAquisicao) : "-"}</td>
      </tr>`;
    })
    .join("");

  const corpoHtml = `
<style>
  table.pat{border-collapse:collapse;width:100%;font-size:11px;}
  table.pat th,table.pat td{border:1px solid #bbb;padding:4px 8px;text-align:left;}
  table.pat th{background:#eee;}
  table.pat td.num,table.pat th.num{text-align:right;white-space:nowrap;}
  table.pat tr:nth-child(even) td{background:#fafafa;}
  table.pat tfoot td{font-weight:600;background:#f0f0f0;}
</style>
<table class="pat">
  <thead><tr>
    <th>Categoria</th><th>Descrição</th><th class="num">Qtd</th>
    <th class="num">Valor unit.</th><th class="num">Valor total</th>
    <th>Estado</th><th>Polo</th><th>Aquisição</th>
  </tr></thead>
  <tbody>${linhas}</tbody>
  <tfoot><tr>
    <td colspan="4" class="num">Total geral</td>
    <td class="num">${moeda(total)}</td>
    <td colspan="3"></td>
  </tr></tfoot>
</table>`;

  return abrirParaImpressao({
    titulo: "Patrimônio",
    subtitulo: `${bens.length} bem(ns) — total ${moeda(total)}`,
    corpoHtml,
  });
}
