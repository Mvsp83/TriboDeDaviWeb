import { abrirParaImpressao, esc } from "@/lib/impressaoDocumento";
import { dataBR } from "@/lib/format";
import { faixaInfo } from "@/features/alunos/faixa";
import {
  STATUS_ATLETA,
  STATUS_META,
  GRAVIDADE_LESAO,
  type Atleta,
} from "@/features/atletas/atletasApi";

// Monta e abre o dossiê do atleta para impressão / salvar em PDF.
export function imprimirDossie(a: Atleta): boolean {
  const secao = (titulo: string, corpo: string) =>
    corpo ? `<h2>${esc(titulo)}</h2>${corpo}` : "";

  // Perfil
  const perfil = `
    <p>
      <strong>Faixa:</strong> ${esc(faixaInfo(a.faixa).nome)} &nbsp;·&nbsp;
      <strong>Polo:</strong> ${esc(a.poloNome)} &nbsp;·&nbsp;
      <strong>Status:</strong> ${esc(STATUS_ATLETA[a.status] ?? "")}
      ${a.categoriaPeso ? `&nbsp;·&nbsp; <strong>Categoria:</strong> ${esc(a.categoriaPeso)}` : ""}
    </p>
    ${a.objetivo ? `<p><strong>Objetivo:</strong> ${esc(a.objetivo)}</p>` : ""}`;

  // Índices (cada avaliação com seus indicadores)
  const indices = a.avaliacoes
    .map(
      (av) =>
        `<p><strong>${esc(dataBR(av.data))}</strong> — ${av.indicadores
          .map((i) => `${esc(i.nome)}: ${i.valor}${i.unidade ? ` ${esc(i.unidade)}` : ""}`)
          .join(" · ")}${av.observacao ? `<br><em>${esc(av.observacao)}</em>` : ""}</p>`,
    )
    .join("");

  // Competições + medalhas
  const ouro = a.competicoes.filter((c) => c.colocacao === 1).length;
  const prata = a.competicoes.filter((c) => c.colocacao === 2).length;
  const bronze = a.competicoes.filter((c) => c.colocacao === 3).length;
  const competicoes =
    a.competicoes.length > 0
      ? `<p><strong>Medalhas:</strong> 🥇 ${ouro} · 🥈 ${prata} · 🥉 ${bronze}</p>` +
        a.competicoes
          .map(
            (c) =>
              `<p><strong>${esc(c.evento)}</strong> (${esc(dataBR(c.data))})${
                c.categoriaPeso ? ` — ${esc(c.categoriaPeso)}` : ""
              }${c.colocacao > 0 ? ` — ${c.colocacao}º lugar` : ""}<br>${c.vitorias}/${c.lutas} vitórias · ${c.finalizacoes} finalizações${
                c.observacao ? `<br><em>${esc(c.observacao)}</em>` : ""
              }</p>`,
          )
          .join("")
      : "";

  // Metas
  const metas = a.metas
    .map(
      (m) =>
        `<p>${esc(m.descricao)} — <strong>${esc(STATUS_META[m.status] ?? "")}</strong>${
          m.prazo ? ` (até ${esc(dataBR(m.prazo))})` : ""
        }</p>`,
    )
    .join("");

  // Lesões
  const lesoes = a.lesoes
    .map(
      (l) =>
        `<p><strong>${esc(dataBR(l.data))}</strong> — ${esc(l.descricao)}${
          l.local ? ` (${esc(l.local)})` : ""
        } — ${esc(GRAVIDADE_LESAO[l.gravidade] ?? "")} — ${
          l.recuperado ? "Recuperado" : "Em tratamento"
        }${l.observacao ? `<br><em>${esc(l.observacao)}</em>` : ""}</p>`,
    )
    .join("");

  const corpoHtml = [
    perfil,
    secao("Índices físicos", indices),
    secao("Competições", competicoes),
    secao("Metas", metas),
    secao("Lesões / saúde", lesoes),
  ].join("\n");

  return abrirParaImpressao({
    titulo: `Dossiê do atleta — ${a.alunoNome}`,
    subtitulo: `${faixaInfo(a.faixa).nome} · ${a.poloNome}`,
    corpoHtml,
  });
}
