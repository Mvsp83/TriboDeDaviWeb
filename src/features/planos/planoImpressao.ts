// Monta o HTML de impressão de um Plano de Aula (usado no "Exportar PDF" da
// visualização). Reaproveita o shell de documento padrão do instituto.
import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";
import { blocoCor } from "@/features/planos/blocoCores";
import { dataBR } from "@/lib/format";
import {
  STATUS_PLANO_LABEL,
  TIPO_BLOCO_LABEL,
  type Atividade,
  type PlanoDeAula,
} from "@/types";

function timelineHtml(plano: PlanoDeAula): string {
  const blocos = [...plano.blocos].sort((a, b) => a.ordem - b.ordem);
  if (blocos.length === 0) return "";
  const soma = blocos.reduce((s, b) => s + b.duracaoMinutos, 0);
  const base = Math.max(plano.duracaoTotalMinutos, soma, 1);
  const livres = plano.duracaoTotalMinutos - soma;

  const segmentos = blocos
    .map(
      (b) =>
        `<div style="width:${(b.duracaoMinutos * 100) / base}%;background:${blocoCor(
          b.tipo,
        )};color:#fff;font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;overflow:hidden;">${b.duracaoMinutos}</div>`,
    )
    .join("");

  const livre =
    livres > 0
      ? `<div style="width:${(livres * 100) / base}%;background:repeating-linear-gradient(45deg,#eee,#eee 6px,#ddd 6px,#ddd 12px);"></div>`
      : "";

  return `<div style="display:flex;height:22px;border-radius:5px;overflow:hidden;margin:6px 0 14px 0;">${segmentos}${livre}</div>`;
}

function blocoHtml(
  b: PlanoDeAula["blocos"][number],
  indice: number,
  atividadePorId: Map<number, Atividade>,
): string {
  const atividades = b.atividades
    .map((ab) => {
      const a = atividadePorId.get(ab.atividadeId);
      if (!a) return "<li>Atividade não encontrada.</li>";
      const desc = a.descricao ? ` — ${esc(a.descricao)}` : "";
      const video = a.videoUrl
        ? ` <span style="color:#666;">(vídeo: ${esc(a.videoUrl)})</span>`
        : "";
      return `<li><strong>${esc(a.nome)}</strong>${desc}${video}</li>`;
    })
    .join("");

  return `<div style="border:1px solid #ccc;border-radius:6px;padding:10px 12px;margin-bottom:8px;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:${blocoCor(b.tipo)};"></span>
      <strong>${indice + 1}. ${esc(b.nome || TIPO_BLOCO_LABEL[b.tipo])}</strong>
      <span style="border:1px solid #bbb;border-radius:10px;padding:0 7px;font-size:10px;color:#555;">${esc(TIPO_BLOCO_LABEL[b.tipo])}</span>
      <span style="margin-left:auto;font-size:11px;color:#555;">${b.duracaoMinutos} min</span>
    </div>
    ${b.descricao ? `<p style="margin:6px 0 0 0;font-size:12px;color:#444;">${esc(b.descricao)}</p>` : ""}
    ${atividades ? `<ul style="margin:6px 0 0 0;padding-left:18px;font-size:12px;color:#333;">${atividades}</ul>` : ""}
  </div>`;
}

export function exportarPlanoPdf(
  plano: PlanoDeAula,
  nomePolo: string,
  atividadePorId: Map<number, Atividade>,
): boolean {
  const blocos = [...plano.blocos].sort((a, b) => a.ordem - b.ordem);
  const soma = blocos.reduce((s, b) => s + b.duracaoMinutos, 0);

  const subtitulo = `${dataBR(plano.dataPrevista)} · Turma ${plano.turma} · ${nomePolo} · ${STATUS_PLANO_LABEL[plano.status]}`;

  const corpoHtml = `
    ${plano.objetivo ? `<p style="font-size:13px;color:#333;"><strong>Objetivo:</strong> ${esc(plano.objetivo)}</p>` : ""}
    <p style="font-size:12px;color:#555;">Duração: ${soma} / ${plano.duracaoTotalMinutos} min</p>
    ${timelineHtml(plano)}
    <h2>Blocos</h2>
    ${
      blocos.length === 0
        ? '<p style="color:#777;">Este plano ainda não tem blocos.</p>'
        : blocos.map((b, i) => blocoHtml(b, i, atividadePorId)).join("")
    }
  `;

  return abrirParaImpressao({ titulo: plano.titulo, subtitulo, corpoHtml });
}
