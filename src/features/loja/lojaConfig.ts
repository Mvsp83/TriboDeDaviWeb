// Liga/desliga o botão "Comprar via WhatsApp" na vitrine da loja.
//
// false = loja como mostruário (sem ação de compra) — comportamento atual.
// true  = mostra o botão "Comprar via WhatsApp" em cada produto, abrindo o
//         WhatsApp com uma mensagem pronta (produto, tamanho, cor).
//
// Para habilitar: troque para true E preencha o número do WhatsApp em
// conteudoSite.ts (SITE.contato.whatsapp, só dígitos com DDD). Sem número, o
// botão não aparece mesmo com o flag ligado.
export const COMPRA_WHATSAPP_HABILITADA = false;
