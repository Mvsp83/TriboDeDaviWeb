import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";
import { CATEGORIA_BEM_LABEL, ESTADO_BEM_LABEL } from "@/features/patrimonio/tipos";
import type { BemPatrimonial } from "@/types";

// Termo de comodato (empréstimo gratuito) de uma peça específica a um aluno.
// Reaproveita o shell de documento (cabeçalho/rodapé padrão). A multa por perda
// segue o termo de comodato da matrícula (kimono/faixa).
const MULTA = "R$ 200,00";

export function imprimirComodato(bem: BemPatrimonial, alunoNome: string): boolean {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const item = [CATEGORIA_BEM_LABEL[bem.categoria], bem.descricao]
    .filter(Boolean)
    .join(" — ");
  const detalhes = [
    bem.tamanho ? `Tamanho: ${bem.tamanho}` : "",
    bem.cor ? `Cor: ${bem.cor}` : "",
    bem.numeroPatrimonio ? `Nº de patrimônio: ${bem.numeroPatrimonio}` : "",
    `Estado: ${ESTADO_BEM_LABEL[bem.estado] ?? "-"}`,
  ].filter(Boolean);

  const corpoHtml = `
    <p>Pelo presente instrumento, o <strong>Instituto Tribo de Davi</strong> (COMODANTE)
    entrega em <strong>comodato</strong> (empréstimo gratuito) ao aluno abaixo identificado
    (COMODATÁRIO) o bem descrito, para uso exclusivo nas atividades do projeto.</p>

    <h2>Aluno</h2>
    <p>${esc(alunoNome)}</p>

    <h2>Bem emprestado</h2>
    <p style="margin-bottom:4px;">${esc(item)}</p>
    <ul style="margin:0 0 8px 18px; padding:0; font-size:12px; color:#333;">
      ${detalhes.map((d) => `<li>${esc(d)}</li>`).join("")}
    </ul>

    <h2>Condições</h2>
    <p>1. O bem é de propriedade do Instituto e deve ser conservado e devolvido nas
    mesmas condições, ressalvado o desgaste natural do uso.</p>
    <p>2. Em caso de perda, extravio ou dano por mau uso, o COMODATÁRIO ou seu
    responsável arcará com o ressarcimento no valor de <strong>${MULTA}</strong> por peça.</p>
    <p>3. A devolução deve ocorrer ao término das atividades ou quando solicitada
    pelo Instituto.</p>

    <p style="margin-top:10px;">Blumenau, ${esc(hoje)}.</p>

    <div style="margin-top:52px; display:flex; justify-content:space-between; gap:28px;">
      <div style="flex:1; text-align:center; font-size:12px;">
        <div style="border-top:1px solid #111; padding-top:4px;">Instituto Tribo de Davi (Comodante)</div>
      </div>
      <div style="flex:1; text-align:center; font-size:12px;">
        <div style="border-top:1px solid #111; padding-top:4px;">${esc(alunoNome)} / Responsável (Comodatário)</div>
      </div>
    </div>
  `;

  return abrirParaImpressao({
    titulo: "Termo de Comodato",
    subtitulo: [item, bem.tamanho].filter(Boolean).join(" · "),
    corpoHtml,
  });
}
