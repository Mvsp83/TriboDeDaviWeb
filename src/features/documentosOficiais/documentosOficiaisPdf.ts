// Monta o PDF de Ofício/Recibo usando o shell de documento padrão (mesmo
// cabeçalho/rodapé configurável das demais telas).
import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";
import { moeda } from "@/lib/format";
import type { DocumentoOficial } from "@/types";
import type { OficioConteudo, ReciboConteudo } from "@/features/documentosOficiais/tipos";
import { TIPO_DOC_LABEL, ehRecibo } from "@/features/documentosOficiais/tipos";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// "2025-11-18..." -> "18 de novembro de 2025" (sem depender de fuso).
export function dataExtenso(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return "";
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

function numeroRotulo(doc: DocumentoOficial): string {
  const tipo = TIPO_DOC_LABEL[doc.tipo];
  return doc.numeroFormatado
    ? `${tipo} nº ${doc.numeroFormatado}`
    : `${tipo} (rascunho — sem número)`;
}

function paragrafos(texto: string): string {
  return texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function oficioCorpo(c: OficioConteudo): string {
  return `
    ${c.destinatario ? `<p><strong>A/C ${esc(c.destinatario)}</strong></p>` : ""}
    ${c.saudacao ? `<p>${esc(c.saudacao)}</p>` : ""}
    ${paragrafos(c.corpo)}
    ${paragrafos(c.fecho)}
    <p style="margin-top:36px;">${esc(c.assinante)}<br/>${esc(c.cargo)}</p>
  `;
}

function reciboCorpo(c: ReciboConteudo): string {
  const valorFmt = moeda(c.valor);
  const extenso = c.valorExtenso ? ` (${esc(c.valorExtenso)})` : "";
  const docPagador = c.documentoPagador ? ` (${esc(c.documentoPagador)})` : "";
  return `
    <p style="font-size:16px;"><strong>Valor: ${valorFmt}</strong></p>
    <p style="margin-top:12px;line-height:1.7;">
      Recebemos de <strong>${esc(c.pagador)}</strong>${docPagador} a importância de
      <strong>${valorFmt}</strong>${extenso}, referente a ${esc(c.referente)}.
    </p>
    <p style="margin-top:48px;text-align:center;">
      _______________________________________<br/>
      ${esc(c.assinante)}${c.documentoAssinante ? `<br/>${esc(c.documentoAssinante)}` : ""}
    </p>
  `;
}

export function exportarDocumentoOficialPdf(doc: DocumentoOficial): boolean {
  let conteudo: OficioConteudo | ReciboConteudo;
  try {
    conteudo = JSON.parse(doc.conteudo || "{}");
  } catch {
    conteudo = {} as OficioConteudo;
  }

  const local = (conteudo as OficioConteudo).local || "";
  const subtitulo = [local, dataExtenso(doc.dataDocumento)]
    .filter(Boolean)
    .join(", ") + ".";

  const corpoHtml = ehRecibo(doc.tipo)
    ? reciboCorpo(conteudo as ReciboConteudo)
    : oficioCorpo(conteudo as OficioConteudo);

  return abrirParaImpressao({
    titulo: numeroRotulo(doc),
    subtitulo,
    corpoHtml,
  });
}
