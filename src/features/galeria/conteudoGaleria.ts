import type { Foto } from "@/features/site/conteudoSite";

// Galeria pública de fotos, organizada por evento (graduações, competições,
// festas). Conteúdo CURADO — as URLs das fotos são preenchidas aqui, no mesmo
// modelo do restante do site. Enquanto a lista está vazia, a página mostra
// "em breve" e nada é inventado.
//
// >>> IMPORTANTE (LGPD): só inclua fotos de alunos cujo responsável AUTORIZOU
// o uso de imagem (campo "autoriza imagem", coletado na inscrição e ajustável
// no Portal do Responsável). Na dúvida, não publique.
//
// As fotos podem estar em /public (ex.: "/fotos/graduacao-2026-01.jpg") ou em
// qualquer URL pública (Google Drive com link, etc.).

export interface AlbumEvento {
  // Nome do evento (ex.: "Graduação 2026", "Copa Blumenau de Jiu-Jitsu").
  evento: string;
  // Data ou período, texto livre (ex.: "Junho de 2026"). Opcional.
  data?: string;
  // Descrição curta do evento. Opcional.
  descricao?: string;
  fotos: Foto[];
}

// PREENCHER: cada item é um álbum de um evento. Exemplo de estrutura:
// {
//   evento: "Graduação do 1º semestre",
//   data: "Junho de 2026",
//   descricao: "A turma toda subiu de faixa — que orgulho!",
//   fotos: [
//     { url: "/fotos/grad-2026-1.jpg", legenda: "Entrega das faixas" },
//     { url: "/fotos/grad-2026-2.jpg" },
//   ],
// },
export const GALERIA: AlbumEvento[] = [];

// Total de fotos em todos os álbuns — usado para decidir a mensagem "em breve".
export const totalFotosGaleria = () =>
  GALERIA.reduce((soma, a) => soma + a.fotos.length, 0);
