import type { CodigoResponsavelItem } from "@/features/alunos/alunosApi";

// Folha de impressão dos códigos de acesso do responsável, agrupada por polo.
// Feita para recortar/entregar às famílias que não recebem pelo WhatsApp.
function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );
}

export function imprimirCodigos(
  itens: CodigoResponsavelItem[],
  nomePorPolo: Map<number, string>,
): boolean {
  // Agrupa por polo (ordenado pelo nome do polo).
  const grupos = new Map<number, CodigoResponsavelItem[]>();
  for (const it of itens) {
    const lista = grupos.get(it.poloId) ?? [];
    lista.push(it);
    grupos.set(it.poloId, lista);
  }
  const polosOrdenados = [...grupos.keys()].sort((a, b) =>
    (nomePorPolo.get(a) ?? "").localeCompare(nomePorPolo.get(b) ?? ""),
  );

  const linkPortal = `${window.location.origin}/responsavel`;

  const secoes = polosOrdenados
    .map((poloId) => {
      const linhas = grupos
        .get(poloId)!
        .map(
          (a) => `
      <tr>
        <td>${esc(a.nome)}</td>
        <td>${esc(a.responsavel || "—")}</td>
        <td class="cod">${esc(a.codigo)}</td>
      </tr>`,
        )
        .join("");
      return `
    <h2>${esc(nomePorPolo.get(poloId) ?? "Polo")}</h2>
    <table>
      <thead>
        <tr><th>Aluno</th><th>Responsável</th><th>Código</th></tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>Códigos de acesso do responsável</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  body { font-family: "Segoe UI", Roboto, Arial, sans-serif; color: #111; font-size: 12px; }
  h1 { font-size: 18px; margin: 0 0 2mm; }
  .info { color: #555; font-size: 11px; margin-bottom: 6mm; }
  h2 { font-size: 14px; margin: 6mm 0 2mm; border-bottom: 1px solid #999; padding-bottom: 1mm; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #ddd; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #444; }
  td.cod { font-family: "Courier New", monospace; font-weight: 700; letter-spacing: .12em; }
  tr { break-inside: avoid; }
</style></head>
<body>
  <h1>Códigos de acesso do responsável</h1>
  <p class="info">
    Cada família acompanha o aluno no portal <strong>${esc(linkPortal)}</strong>,
    entrando com o <strong>código</strong> abaixo e a <strong>data de nascimento
    do aluno</strong>.
  </p>
  ${secoes}
  <script>window.onload = function () { window.print(); };</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}
