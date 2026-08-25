import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";
import { dataCurtaBR } from "@/lib/format";
import { TIPO_DOC_LABEL } from "@/features/documentosOficiais/tipos";
import { STATUS_DOC, type DocumentoOficial } from "@/types";

// Relatório (listagem imprimível) da tela Ofícios e Recibos. Reflete o que
// está filtrado na tela: ano + tipo. Segue o padrão de patrimonioPdf.
export function exportarDocumentosOficiaisPdf(
  docs: DocumentoOficial[],
  ano: number,
  filtroLabel: string,
): boolean {
  const linhas = docs
    .map(
      (d) => `<tr>
        <td class="nowrap">${esc(d.numeroFormatado || "—")}</td>
        <td>${esc(TIPO_DOC_LABEL[d.tipo] ?? "-")}</td>
        <td>${esc(d.titulo)}</td>
        <td class="nowrap">${dataCurtaBR(d.dataDocumento)}</td>
        <td>${d.status === STATUS_DOC.Aprovado ? "Aprovado" : "Rascunho"}</td>
      </tr>`,
    )
    .join("");

  const vazio = `<tr><td colspan="5" style="text-align:center;color:#777;padding:12px;">Nenhum documento no período.</td></tr>`;

  const corpoHtml = `
<style>
  table.rel{border-collapse:collapse;width:100%;font-size:11px;}
  table.rel th,table.rel td{border:1px solid #bbb;padding:4px 8px;text-align:left;vertical-align:top;}
  table.rel th{background:#eee;}
  table.rel td.nowrap,table.rel th.nowrap{white-space:nowrap;}
  table.rel tr:nth-child(even) td{background:#fafafa;}
</style>
<table class="rel">
  <thead><tr>
    <th class="nowrap">Número</th><th>Tipo</th><th>Identificação</th>
    <th class="nowrap">Data</th><th>Status</th>
  </tr></thead>
  <tbody>${linhas || vazio}</tbody>
</table>`;

  return abrirParaImpressao({
    titulo: "Ofícios e Recibos",
    subtitulo: `Ano ${ano} · ${filtroLabel} · ${docs.length} documento(s)`,
    corpoHtml,
  });
}
