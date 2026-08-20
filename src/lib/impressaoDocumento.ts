// Shell reutilizável de documento para impressão / exportar em PDF.
// Segue o padrão da casa (RelatoriosPage / financeiro/exportar): monta um HTML
// próprio, abre em nova janela e dispara a impressão — o navegador salva como
// PDF. Zero dependências.
//
// A "casca" (cabeçalho com marca, rodapé, tipografia) vem do padrão
// configurável em documentoPadrao.ts. Cada tipo de documento (plano de aula,
// relatório, etc.) só fornece o corpo (corpoHtml).
import {
  carregarDocumentoPadrao,
  type DocumentoPadrao,
} from "@/lib/documentoPadrao";

export function esc(v: string | null | undefined): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface OpcoesDocumento {
  // Título do documento (aba do navegador e nome sugerido do PDF).
  titulo: string;
  // Linha de subtítulo abaixo do título (ex.: data, turma, polo).
  subtitulo?: string;
  // Conteúdo já em HTML (use os helpers de cada feature para montá-lo).
  corpoHtml: string;
}

// Monta o HTML completo do documento aplicando o padrão. `imprimirAoCarregar`
// injeta o disparo de impressão (usado na exportação; a prévia passa false).
export function montarDocumentoHtml(
  { titulo, subtitulo, corpoHtml }: OpcoesDocumento,
  cfg: DocumentoPadrao = carregarDocumentoPadrao(),
  imprimirAoCarregar = false,
): string {
  const logo = `${window.location.origin}/logo.png`;
  const geradoEm = new Date().toLocaleString("pt-BR");

  const logoHtml = cfg.mostrarLogo
    ? `<img src="${logo}" alt="" onerror="this.style.display='none'" />`
    : "";
  const instHtml = cfg.tituloCabecalho
    ? `<div class="inst">${esc(cfg.tituloCabecalho)}</div>`
    : "";
  const extraHtml = cfg.linhaExtra
    ? `<div class="extra">${esc(cfg.linhaExtra)}</div>`
    : "";
  const dataHtml = cfg.mostrarDataGeracao
    ? `<span>Gerado em ${esc(geradoEm)}</span>`
    : "<span></span>";
  const scriptImprimir = imprimirAoCarregar
    ? `<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},250);});</script>`
    : "";

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${esc(titulo)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
    color: #111; margin: 0; padding: 24px; background: #fff;
    /* Garante que fundos coloridos (timeline, chips) saiam na impressão. */
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cabecalho {
    display: flex; align-items: center; gap: 12px;
    border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 18px;
  }
  .cabecalho img { height: 40px; width: auto; }
  .cabecalho .inst { font-size: 12px; color: #555; font-weight: 600; letter-spacing: .3px; }
  .cabecalho .extra { font-size: 11px; color: #777; margin-top: 1px; }
  h1 { font-size: 20px; margin: 2px 0 0 0; }
  .sub { margin: 2px 0 0 0; color: #555; font-size: 12px; }
  .rodape {
    margin-top: 24px; padding-top: 8px; border-top: 1px solid #ccc;
    color: #888; font-size: 10px; display: flex; justify-content: space-between;
  }
  h2 { font-size: 14px; margin: 18px 0 8px 0; }
  p { margin: 0 0 8px 0; line-height: 1.45; }
</style>
</head><body>
  <div class="cabecalho">
    ${logoHtml}
    <div>
      ${instHtml}
      ${extraHtml}
      <h1>${esc(titulo)}</h1>
      ${subtitulo ? `<p class="sub">${esc(subtitulo)}</p>` : ""}
    </div>
  </div>

  ${corpoHtml}

  <div class="rodape">
    <span>${esc(cfg.textoRodape)}</span>
    ${dataHtml}
  </div>
  ${scriptImprimir}
</body></html>`;
}

// Abre a janela de impressão com o documento montado. Retorna false se o
// pop-up foi bloqueado (quem chama mostra o aviso).
export function abrirParaImpressao(opts: OpcoesDocumento): boolean {
  const html = montarDocumentoHtml(opts, carregarDocumentoPadrao(), true);
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}
