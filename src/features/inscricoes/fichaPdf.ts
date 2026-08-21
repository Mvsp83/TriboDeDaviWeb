import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";
import { dataBR } from "@/lib/format";
import { faixaInfo } from "@/features/alunos/faixa";
import {
  PARQ,
  TERMO_RESPONSABILIDADE,
  type RespostasSaude,
  type RespostasFamiliar,
} from "@/features/matricula/questionarios";
import {
  TERMO_PARTICIPACAO,
  TERMO_COMODATO,
  TERMO_IMAGEM,
  TERMO_LGPD,
  PRAZO_FILIACAO,
} from "@/features/matricula/termos";
import type { Inscricao } from "@/features/inscricoes/inscricoesApi";

// Gera a ficha de inscrição em PDF. É o documento que fica no arquivo do
// instituto: além dos dados, traz o questionário com as respostas, os textos
// dos termos aceitos e o registro da assinatura (nome, data e versão), que é a
// evidência de que aquele texto foi o que a família leu.

const PARENTESCOS = ["Pai", "Mãe", "Tio", "Tia", "Avô/Avó", "Outro"];

function parse<T>(json: string | null | undefined, vazio: T): T {
  if (!json) return vazio;
  try {
    return JSON.parse(json) as T;
  } catch {
    return vazio;
  }
}

function idade(iso: string): string {
  const n = new Date(iso);
  if (Number.isNaN(n.getTime())) return "";
  const hoje = new Date();
  let i = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) i--;
  return `${i} anos`;
}

// Uma linha "rótulo: valor". Campos vazios são omitidos para a ficha não
// ficar cheia de tracinhos.
function campo(rotulo: string, valor?: string | number | null): string {
  if (valor === null || valor === undefined || valor === "") return "";
  return `<div class="campo"><span class="rot">${esc(rotulo)}</span><span class="val">${esc(String(valor))}</span></div>`;
}

function secao(titulo: string, conteudo: string): string {
  if (!conteudo.trim()) return "";
  return `<section><h2>${esc(titulo)}</h2>${conteudo}</section>`;
}

function blocoTermo(titulo: string, texto: string, aceito: boolean): string {
  return `
<div class="termo">
  <div class="termo-cab">
    <strong>${esc(titulo)}</strong>
    <span class="${aceito ? "aceito" : "recusado"}">${aceito ? "ACEITO" : "NÃO ACEITO"}</span>
  </div>
  <p class="termo-txt">${esc(texto).replace(/\n/g, "<br>")}</p>
</div>`;
}

export function imprimirFicha(i: Inscricao): boolean {
  const saude = parse<Partial<RespostasSaude>>(i.respostasSaudeJson, {});
  const familiar = parse<Partial<RespostasFamiliar>>(i.respostasFamiliarJson, {});
  const houveSim = PARQ.some((p) => saude.parq?.[p.id] === true);

  const dadosAluno =
    campo("Nome", i.nome) +
    campo("Nascimento", `${dataBR(i.dataNascimento)} (${idade(i.dataNascimento)})`) +
    campo("RG", i.rg) +
    campo("CPF", i.cpf) +
    campo("Peso", i.peso ? `${i.peso} kg` : null) +
    campo("Altura", i.altura ? `${i.altura} m` : null) +
    campo("Faixa", faixaInfo(i.faixa).nome) +
    campo("Escola", i.escola) +
    campo("Série", i.serie) +
    campo("Período", i.periodo);

  const dadosResp =
    campo("Nome", i.nomeResponsavel) +
    campo("Parentesco", i.parentescoOutro || PARENTESCOS[i.parentesco]) +
    campo("RG", i.rgResponsavel) +
    campo("CPF", i.cpfResponsavel) +
    campo("WhatsApp", i.whatsApp) +
    campo("Telefone 2", i.telefone2);

  const endereco =
    campo("Rua", [i.rua, i.numero, i.complemento].filter(Boolean).join(", ")) +
    campo("Bairro", i.bairro) +
    campo("Cidade", i.cidade);

  const matricula =
    campo("Polo", i.poloNome) +
    campo("Turma", i.turma ?? null) +
    campo("Já era aluno", i.jaEraAluno ? `Sim${i.turmaAnterior ? ` (turma ${i.turmaAnterior})` : ""}` : "Não");

  // Questionário legal: cada pergunta com a resposta ao lado.
  const linhasParq = PARQ.map((p, n) => {
    const r = saude.parq?.[p.id];
    const marca = r === true ? "SIM" : r === false ? "Não" : "—";
    return `<tr>
      <td class="num">${n + 1}</td>
      <td>${esc(p.texto)}</td>
      <td class="resp ${r === true ? "sim" : ""}">${marca}</td>
    </tr>`;
  }).join("");

  const parqHtml = `
<table class="parq">
  <thead><tr><th></th><th>Pergunta</th><th>Resposta</th></tr></thead>
  <tbody>${linhasParq}</tbody>
</table>
${
  houveSim
    ? `<div class="anexo2">
         <strong>Termo de Responsabilidade (Anexo II)</strong>
         <p>${esc(TERMO_RESPONSABILIDADE)}</p>
         <p class="aceite">${
           saude.aceitouTermoResponsabilidade
             ? "Aceito pelo responsável."
             : "NÃO ACEITO — verificar antes de liberar a prática."
         }</p>
       </div>`
    : ""
}`;

  const listaSaude =
    campo("Condições", [...(saude.condicoes ?? []), saude.condicaoOutra].filter(Boolean).join(", ")) +
    campo("Sintomas", saude.sintomas?.join(", ")) +
    campo("Medicamentos", saude.medicamentos) +
    campo("Acompanhamento", [...(saude.acompanhamentos ?? []), saude.acompanhamentoOutro].filter(Boolean).join(", ")) +
    campo("Objetivos", saude.objetivos?.join(", "));

  const listaFamiliar =
    campo("Situação conjugal", familiar.situacaoConjugalOutro || familiar.situacaoConjugal) +
    campo("Pessoas na casa", familiar.pessoasNaCasa) +
    campo("Motivos da matrícula", familiar.motivos?.join(", "));

  const termos =
    blocoTermo("Termo de participação", TERMO_PARTICIPACAO, i.aceitouTermo) +
    blocoTermo("Comodato de kimono e faixa", TERMO_COMODATO, i.aceitouComodato) +
    blocoTermo("Uso de imagem e voz", TERMO_IMAGEM, i.aceitouImagem) +
    blocoTermo("Tratamento de dados (LGPD)", TERMO_LGPD, i.aceitouLgpd);

  const assinatura = `
<div class="assinatura">
  <p class="prazo">${esc(PRAZO_FILIACAO(i.ano))}</p>
  <div class="linha-assinatura">${esc(i.nomeAssinatura)}</div>
  <p class="rodape-ass">
    Nome completo do responsável · aceite registrado eletronicamente em
    ${esc(dataBR(i.dataEnvio))}${i.versaoTermos ? ` · versão dos termos ${esc(i.versaoTermos)}` : ""}
  </p>
</div>`;

  const corpoHtml = `
<style>
  section { margin-bottom: 14px; break-inside: avoid; }
  h2 {
    font-size: 12px; text-transform: uppercase; letter-spacing: .04em;
    border-bottom: 1px solid #999; padding-bottom: 3px; margin: 0 0 6px 0;
  }
  .campo { display: flex; gap: 6px; font-size: 11px; line-height: 1.5; }
  .campo .rot { color: #555; min-width: 110px; }
  .campo .val { font-weight: 600; }

  table.parq { border-collapse: collapse; width: 100%; font-size: 10px; }
  table.parq th, table.parq td { border: 1px solid #bbb; padding: 4px 6px; text-align: left; vertical-align: top; }
  table.parq th { background: #eee; }
  table.parq td.num { width: 18px; text-align: center; color: #666; }
  table.parq td.resp { width: 60px; text-align: center; font-weight: 700; }
  table.parq td.resp.sim { background: #fde68a; }

  .anexo2 { border: 1px solid #999; padding: 8px; margin-top: 8px; font-size: 10px; }
  .anexo2 p { margin: 4px 0 0 0; line-height: 1.45; }
  .anexo2 .aceite { font-weight: 700; }

  .termo { border: 1px solid #ccc; padding: 8px; margin-bottom: 8px; break-inside: avoid; }
  .termo-cab { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
  .termo-cab .aceito { color: #166534; font-weight: 700; }
  .termo-cab .recusado { color: #991b1b; font-weight: 700; }
  .termo-txt { font-size: 9px; line-height: 1.4; color: #333; margin: 0; text-align: justify; }

  .assinatura { margin-top: 26px; break-inside: avoid; }
  .assinatura .prazo { font-size: 10px; font-weight: 600; margin-bottom: 26px; }
  .linha-assinatura {
    border-top: 1px solid #111; padding-top: 4px; width: 62%;
    font-size: 12px; font-weight: 600;
  }
  .rodape-ass { font-size: 9px; color: #555; margin-top: 3px; }
</style>

${secao("Matrícula", matricula)}
${secao("Dados do aluno", dadosAluno)}
${secao("Responsável", dadosResp)}
${secao("Endereço", endereco)}
${secao("Questionário de aptidão para atividade física (Lei nº 16.331/2014)", parqHtml)}
${secao("Informações de saúde", listaSaude)}
${secao("Pesquisa familiar", listaFamiliar)}
${secao("Termos", termos)}
${assinatura}`;

  return abrirParaImpressao({
    titulo: `Ficha de inscrição ${i.ano}`,
    subtitulo: `${i.nome} · ${i.poloNome ?? ""}`.trim().replace(/·\s*$/, ""),
    corpoHtml,
  });
}
