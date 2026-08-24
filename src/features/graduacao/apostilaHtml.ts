// Gera a apostila (manual em PDF) de uma faixa a partir da configuração de
// graduação. Reaproveita o shell de documento do instituto (mesmo caminho do
// planoImpressao/carteirinhaPdf) — cabeçalho/rodapé com a marca — e monta o
// corpo no espírito do layout aprovado: banda com a cor real da faixa e graus
// como cartões de checklist. Pode gerar para todas as idades ou por faixa
// etária. Posições com vídeo ganham um QR code que abre o vídeo no celular.
import QRCode from "qrcode";
import { montarDocumentoHtml, esc } from "@/lib/impressaoDocumento";
import { carregarDocumentoPadrao } from "@/lib/documentoPadrao";
import { faixaInfo } from "@/features/alunos/faixa";
import {
  type ConfigGraduacao,
  type ProgramaFaixa,
  type Posicao,
  type Requisito,
  type Criterio,
} from "./tipos";

// Um item vale para uma idade quando é universal (sem faixa etária) ou é daquela
// faixa. "todas" mostra tudo.
function valeParaIdade(
  faixaEtariaId: string | null | undefined,
  filtro: string,
): boolean {
  if (filtro === "todas") return true;
  return faixaEtariaId == null || faixaEtariaId === filtro;
}

function chipIdade(
  faixaEtariaId: string | null | undefined,
  labelPorId: Map<string, string>,
): string {
  if (!faixaEtariaId) return "";
  const label = labelPorId.get(faixaEtariaId);
  if (!label) return "";
  return ` <span style="background:#eee;border-radius:8px;padding:1px 6px;font-size:10px;color:#555;">${esc(label)}</span>`;
}

function textoRequisito(
  r: Requisito,
  porId: Map<string, Posicao>,
): { principal: string; secundario?: string; videoUrl?: string | null } {
  if (r.posicaoId) {
    const p = porId.get(r.posicaoId);
    if (p) return { principal: p.nome, secundario: p.nomeEn, videoUrl: p.videoUrl };
  }
  return { principal: r.texto || "(requisito sem descrição)", secundario: r.nota };
}

function grauHtml(
  g: ProgramaFaixa["graus"][number],
  indice: number,
  porId: Map<string, Posicao>,
  labelPorId: Map<string, string>,
  filtro: string,
  qrPorUrl: Map<string, string>,
): string {
  const reqs = g.requisitos.filter((r) => valeParaIdade(r.faixaEtariaId, filtro));
  const itens = reqs
    .map((r) => {
      const t = textoRequisito(r, porId);
      const sec = t.secundario
        ? ` <span style="color:#888;font-size:11px;">${esc(t.secundario)}</span>`
        : "";
      const qr =
        t.videoUrl && qrPorUrl.get(t.videoUrl)
          ? `<img src="${qrPorUrl.get(t.videoUrl)}" width="42" height="42" alt="Vídeo" title="Aponte a câmera para assistir" style="flex:none;border:1px solid #eee;border-radius:3px;" />`
          : "";
      return `<li style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dotted #e5e5e5;">
        <span style="flex:none;width:11px;height:11px;border:1.5px solid #bbb;border-radius:2px;"></span>
        <span style="flex:1;">${esc(t.principal)}${sec}${chipIdade(r.faixaEtariaId, labelPorId)}</span>
        ${qr}
      </li>`;
    })
    .join("");

  const criterios = g.criterios.filter((c) => valeParaIdade(c.faixaEtariaId, filtro));
  const exame =
    criterios.length > 0
      ? `<div style="margin-top:8px;font-size:11px;color:#555;">
           <strong style="color:#333;text-transform:uppercase;letter-spacing:.5px;font-size:10px;">Exame</strong>
           <ul style="list-style:disc;margin:4px 0 0 16px;padding:0;">
             ${criterios
               .map(
                 (c: Criterio) =>
                   `<li>${esc(c.texto)}${chipIdade(c.faixaEtariaId, labelPorId)}</li>`,
               )
               .join("")}
           </ul>
         </div>`
      : "";

  return `<div style="border:1px solid #ddd;border-radius:8px;padding:12px 14px;break-inside:avoid;">
    <div style="display:flex;align-items:baseline;gap:8px;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px;">
      <span style="font-size:22px;font-weight:800;color:#3a3a8c;">${indice + 1}º</span>
      <span style="font-weight:700;text-transform:uppercase;letter-spacing:.4px;font-size:12px;color:#444;">${esc(g.titulo)}</span>
    </div>
    <ul style="list-style:none;margin:0;padding:0;font-size:12px;">${itens || '<li style="color:#999;">Sem requisitos.</li>'}</ul>
    ${exame}
  </div>`;
}

function corpoApostilaFaixa(
  programa: ProgramaFaixa,
  cfg: ConfigGraduacao,
  filtro: string,
  qrPorUrl: Map<string, string>,
): string {
  const info = faixaInfo(programa.faixaBase);
  const porId = new Map(cfg.posicoes.map((p) => [p.id, p]));
  const labelPorId = new Map(programa.faixasEtarias.map((f) => [f.id, f.label]));
  const bandaFiltro = filtro !== "todas" ? labelPorId.get(filtro) : undefined;

  const banda = `<div style="display:flex;align-items:center;gap:14px;background:${info.cor};color:${info.texto};border:1px solid #ccc;border-radius:10px;padding:14px 18px;margin-bottom:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
    <div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:.75;">Faixa${bandaFiltro ? ` · ${esc(bandaFiltro)}` : ""}</div>
      <div style="font-size:26px;font-weight:800;line-height:1;">${esc(info.nome)}</div>
    </div>
    ${programa.tag ? `<div style="margin-left:auto;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:.5px;opacity:.85;">${esc(programa.tag)}</div>` : ""}
  </div>`;

  const perfil = programa.perfil
    ? `<p style="font-size:12.5px;color:#444;margin:0 0 14px 0;line-height:1.5;">${esc(programa.perfil)}</p>`
    : "";

  const graus = programa.graus
    .map((g, i) => grauHtml(g, i, porId, labelPorId, filtro, qrPorUrl))
    .join("");

  const grade = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">${graus}</div>`;

  const dica = qrPorUrl.size
    ? `<p style="margin:12px 0 0 0;font-size:10px;color:#999;">Aponte a câmera do celular para o QR de cada posição para assistir ao vídeo de referência.</p>`
    : "";

  return `${banda}${perfil}${grade}${dica}`;
}

// Reúne as URLs de vídeo das posições usadas no programa (respeitando o filtro
// de idade) e gera um QR data URL para cada — autocontido, sem depender de rede
// na hora de imprimir.
async function gerarQrs(
  programa: ProgramaFaixa,
  cfg: ConfigGraduacao,
  filtro: string,
): Promise<Map<string, string>> {
  const porId = new Map(cfg.posicoes.map((p) => [p.id, p]));
  const urls = new Set<string>();
  for (const g of programa.graus) {
    for (const r of g.requisitos) {
      if (!valeParaIdade(r.faixaEtariaId, filtro)) continue;
      const p = r.posicaoId ? porId.get(r.posicaoId) : null;
      if (p?.videoUrl) urls.add(p.videoUrl);
    }
  }
  const mapa = new Map<string, string>();
  await Promise.all(
    [...urls].map(async (url) => {
      try {
        mapa.set(url, await QRCode.toDataURL(url, { width: 120, margin: 0 }));
      } catch {
        // Se um QR falhar, a apostila segue sem ele (não trava a impressão).
      }
    }),
  );
  return mapa;
}

// Abre a janela de impressão (salvar como PDF) da apostila de uma faixa.
export async function imprimirApostilaFaixa(
  programa: ProgramaFaixa,
  cfg: ConfigGraduacao,
  filtro: string = "todas",
): Promise<boolean> {
  const info = faixaInfo(programa.faixaBase);
  const labelPorId = new Map(programa.faixasEtarias.map((f) => [f.id, f.label]));
  const banda = filtro !== "todas" ? labelPorId.get(filtro) : undefined;

  const qrPorUrl = await gerarQrs(programa, cfg, filtro);
  const html = montarDocumentoHtml(
    {
      titulo: `Apostila de Graduação — Faixa ${info.nome}${banda ? ` (${banda})` : ""}`,
      subtitulo: "Requisitos por grau · Instituto Tribo de Davi",
      corpoHtml: corpoApostilaFaixa(programa, cfg, filtro, qrPorUrl),
    },
    carregarDocumentoPadrao(),
    true,
  );

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}
