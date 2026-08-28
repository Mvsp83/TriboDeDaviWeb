import QRCode from "qrcode";
import { montarDocumentoHtml, esc } from "@/lib/impressaoDocumento";
import { carregarDocumentoPadrao } from "@/lib/documentoPadrao";
import { faixaInfo } from "@/features/alunos/faixa";
import { tokenDoAluno } from "@/features/carteirinha/tokenQr";
import type { Aluno } from "@/types";

// Carteirinha do aluno: um cartão com o QR usado no check-in da chamada, mais
// nome, faixa, polo e turma. Impressa e entregue à família; o QR fica no verso
// da rotina (é lido pelo professor na entrada da aula).

interface DadosCarteirinha {
  aluno: Aluno;
  nomePolo: string;
  // Foto do aluno em data URI (opcional) — incluída conforme a config global.
  fotoDataUri?: string | null;
}

// Gera as carteirinhas (uma ou várias) numa folha só, em cartões lado a lado.
export async function imprimirCarteirinhas(itens: DadosCarteirinha[]): Promise<boolean> {
  if (itens.length === 0) return false;
  const cfg = carregarDocumentoPadrao();

  // O QR de cada aluno é gerado como data URL — assim o PDF é autocontido e
  // não depende de rede na hora de imprimir.
  const cartoes = await Promise.all(
    itens.map(async ({ aluno, nomePolo, fotoDataUri }) => {
      const qr = await QRCode.toDataURL(tokenDoAluno(aluno.id), {
        width: 240,
        margin: 1,
      });
      const faixa = faixaInfo(aluno.faixa);
      const fotoHtml = fotoDataUri
        ? `<img class="foto" src="${fotoDataUri}" alt="Foto de ${esc(aluno.nome)}" />`
        : "";
      return `
<div class="cartao">
  <div class="cab">
    <img class="logo" src="${window.location.origin}/pwa-512.png" alt="" onerror="this.style.display='none'" />
    <div class="inst">INSTITUTO TRIBO DE DAVI</div>
  </div>
  <div class="corpo">
    <img class="qr" src="${qr}" alt="QR de ${esc(aluno.nome)}" />
    <div class="dados">
      <div class="nome-linha">${fotoHtml}<span class="nome">${esc(aluno.nome)}</span></div>
      <div class="linha"><span>Faixa</span> <b><span class="fx" style="background:${faixa.cor}"></span>${esc(faixa.nome)}</b></div>
      <div class="linha"><span>Polo</span> <b>${esc(nomePolo)}</b></div>
      <div class="linha"><span>Turma</span> <b>${esc(String(aluno.turma))}</b></div>
    </div>
  </div>
  <div class="rodape-cartao">Apresente na entrada da aula</div>
</div>`;
    }),
  );

  const corpoHtml = `
<style>
  /* O cabeçalho/rodapé padrão do documento não entram na folha de cartões. */
  .cabecalho, .rodape { display: none !important; }
  .cartoes { display: flex; flex-wrap: wrap; gap: 8mm; }
  .cartao {
    width: 85mm; /* padrão de cartão */
    border: 1px solid #999; border-radius: 8px; padding: 6mm;
    display: flex; flex-direction: column; gap: 4mm;
    break-inside: avoid; font-family: "Segoe UI", Roboto, Arial, sans-serif;
  }
  .cartao .cab { display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #ddd; padding-bottom: 3mm; }
  .cartao .cab .logo { height: 26px; width: auto; }
  .cartao .cab .inst { font-size: 10px; font-weight: 700; letter-spacing: .04em; color: #333; }
  .cartao .corpo { display: flex; gap: 5mm; align-items: center; }
  .cartao .qr { width: 30mm; height: 30mm; }
  .cartao .dados { min-width: 0; }
  .cartao .nome-linha { display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm; }
  .cartao .foto { width: 14mm; height: 14mm; border-radius: 50%; object-fit: cover; border: 1px solid #ccc; }
  .cartao .nome { font-size: 14px; font-weight: 700; }
  .cartao .linha { font-size: 11px; color: #555; margin-bottom: 1mm; }
  .cartao .linha b { color: #111; display: inline-flex; align-items: center; gap: 4px; }
  .cartao .fx { width: 22px; height: 10px; border: 1px solid #333; border-radius: 2px; display: inline-block; }
  .cartao .rodape-cartao { font-size: 9px; color: #888; text-align: center; border-top: 1px dashed #ccc; padding-top: 2mm; }
</style>
<div class="cartoes">${cartoes.join("")}</div>`;

  const html = montarDocumentoHtml(
    {
      titulo: itens.length === 1 ? `Carteirinha — ${itens[0].aluno.nome}` : "Carteirinhas",
      corpoHtml,
    },
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
