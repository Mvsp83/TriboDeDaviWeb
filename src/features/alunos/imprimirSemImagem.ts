import type { Aluno } from "@/types";

// Folha de "alunos SEM autorização de uso de imagem", agrupada por polo. Serve
// para quem cuida das redes sociais consultar antes de publicar fotos.
function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );
}

export function imprimirSemImagem(
  alunos: Aluno[],
  nomePorPolo: Map<number, string>,
): boolean {
  const grupos = new Map<number, Aluno[]>();
  for (const a of alunos) {
    const lista = grupos.get(a.poloId) ?? [];
    lista.push(a);
    grupos.set(a.poloId, lista);
  }
  const polosOrdenados = [...grupos.keys()].sort((a, b) =>
    (nomePorPolo.get(a) ?? "").localeCompare(nomePorPolo.get(b) ?? ""),
  );

  const secoes = polosOrdenados
    .map((poloId) => {
      const linhas = grupos
        .get(poloId)!
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map(
          (a) => `
      <tr>
        <td>${esc(a.nome)}</td>
        <td>${esc(a.responsavel || "—")}</td>
        <td>${a.autorizaImagem === false ? "Não autoriza" : "Não informado"}</td>
      </tr>`,
        )
        .join("");
      return `
    <h2>${esc(nomePorPolo.get(poloId) ?? "Polo")}</h2>
    <table>
      <thead><tr><th>Aluno</th><th>Responsável</th><th>Situação</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>Alunos sem autorização de imagem</title>
<style>
  @page { size: A4 portrait; margin: 14mm; }
  body { font-family: "Segoe UI", Roboto, Arial, sans-serif; color: #111; font-size: 12px; }
  h1 { font-size: 18px; margin: 0 0 2mm; }
  .info { color: #555; font-size: 11px; margin-bottom: 6mm; }
  h2 { font-size: 14px; margin: 6mm 0 2mm; border-bottom: 1px solid #999; padding-bottom: 1mm; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #ddd; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #444; }
  tr { break-inside: avoid; }
</style></head>
<body>
  <h1>Alunos SEM autorização de uso de imagem</h1>
  <p class="info">
    Não publicar a imagem identificável destes alunos nos canais oficiais do
    instituto (redes sociais, site, materiais). Lista gerada do sistema.
  </p>
  ${secoes || "<p>Nenhum aluno sem autorização no escopo atual.</p>"}
  <script>window.onload = function () { window.print(); };</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}
