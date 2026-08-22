// Token do QR da carteirinha. Formato simples e estável: "TRIBO:<id>".
//
// Não é um segredo — o QR só serve para marcar presença na chamada, feita por
// um professor autenticado no próprio polo. Um prefixo evita confundir com QRs
// de outros apps que a câmera possa capturar por engano.

const PREFIXO = "TRIBO:";

export function tokenDoAluno(alunoId: number): string {
  return `${PREFIXO}${alunoId}`;
}

// Extrai o id de um texto lido pela câmera. Retorna null se não for um QR do
// instituto (outro QR qualquer é ignorado em silêncio).
export function alunoIdDoToken(texto: string): number | null {
  const t = (texto ?? "").trim();
  if (!t.startsWith(PREFIXO)) return null;
  const n = Number(t.slice(PREFIXO.length));
  return Number.isInteger(n) && n > 0 ? n : null;
}
