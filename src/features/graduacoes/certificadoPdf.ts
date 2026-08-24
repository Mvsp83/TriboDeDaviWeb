import { montarDocumentoHtml, esc } from "@/lib/impressaoDocumento";
import { carregarDocumentoPadrao } from "@/lib/documentoPadrao";
import { faixaInfo } from "@/features/alunos/faixa";
import type { Graduacao } from "@/features/graduacoes/graduacoesApi";

// Certificado de graduação. Diferente dos outros PDFs do portal, este é feito
// para ser impresso e entregue à criança — então vai em paisagem, com moldura
// e a cor da faixa conquistada, em vez do formato de relatório.

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function porExtenso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function imprimirCertificado(g: Graduacao): boolean {
  const faixa = faixaInfo(g.faixaNova);
  const anterior = faixaInfo(g.faixaAnterior);
  const cfg = carregarDocumentoPadrao();

  const corpoHtml = `
<style>
  /* Paisagem: o certificado é para emoldurar, não para arquivar. */
  @page { size: A4 landscape; margin: 0; }
  body { padding: 0 !important; }
  /* O cabeçalho e o rodapé padrão não entram neste documento. */
  .cabecalho, .rodape { display: none !important; }

  .cert {
    position: relative;
    width: 100%; min-height: 195mm;
    padding: 16mm 18mm;
    border: 3px double #111;
    outline: 1px solid #111; outline-offset: 5px;
    text-align: center;
    display: flex; flex-direction: column; justify-content: center;
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
  }
  .cert .marca { height: 58px; margin: 0 auto 6mm; display: block; }
  .cert .inst {
    font-size: 13px; letter-spacing: .22em; text-transform: uppercase;
    color: #444; font-weight: 600;
  }
  .cert h1 {
    font-size: 34px; letter-spacing: .06em; margin: 3mm 0 1mm;
    text-transform: uppercase;
  }
  .cert .sub { font-size: 12px; color: #555; margin-bottom: 8mm; }
  .cert .texto { font-size: 14px; line-height: 1.7; }
  .cert .aluno {
    font-size: 30px; font-weight: 700; margin: 4mm 0 3mm;
    border-bottom: 1px solid #999; display: inline-block; padding: 0 10mm 2mm;
  }
  .cert .faixa {
    display: inline-flex; align-items: center; gap: 8px;
    margin: 2mm 0 6mm; font-size: 20px; font-weight: 700;
  }
  .cert .faixa .amostra {
    width: 46px; height: 16px; border: 1px solid #333; border-radius: 2px;
  }
  .cert .data { font-size: 13px; color: #333; margin-top: 4mm; }
  .assinaturas {
    display: flex; justify-content: center; gap: 26mm; margin-top: 14mm;
  }
  .assinaturas div { width: 68mm; border-top: 1px solid #111; padding-top: 2mm; font-size: 11px; }
</style>

<div class="cert">
  ${cfg.mostrarLogo ? `<img class="marca" src="${window.location.origin}/pwa-512.png" alt="" onerror="this.style.display='none'" />` : ""}
  <div class="inst">${esc(cfg.tituloCabecalho || "Instituto Tribo de Davi")}</div>

  <h1>${esc(cfg.certificado.titulo)}</h1>
  <p class="sub">${esc(cfg.certificado.subtitulo)}</p>

  <p class="texto">Certificamos que</p>
  <div class="aluno">${esc(g.nomeAluno ?? "")}</div>
  <p class="texto">
    concluiu com dedicação e disciplina os requisitos para a graduação,
    ${g.faixaAnterior > 0 ? `passando da faixa <strong>${esc(anterior.nome)}</strong> para a` : "conquistando a"}
  </p>

  <div class="faixa">
    <span class="amostra" style="background:${faixa.cor}"></span>
    Faixa ${esc(faixa.nome)}
  </div>

  <p class="data">
    ${esc(g.poloNome ? `Polo ${g.poloNome} · ` : "")}${esc(porExtenso(g.data))}
  </p>

  <div class="assinaturas">
    <div>${esc(cfg.certificado.assinaturaEsquerda)}</div>
    <div>${esc(cfg.certificado.assinaturaDireita)}</div>
  </div>
</div>`;

  // O certificado tem cabeçalho próprio, então o shell entra só pela mecânica
  // de impressão (esperar as imagens antes de abrir o diálogo).
  const html = montarDocumentoHtml(
    { titulo: `Certificado — ${g.nomeAluno ?? ""}`, corpoHtml },
    cfg,
    true,
  );

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}
