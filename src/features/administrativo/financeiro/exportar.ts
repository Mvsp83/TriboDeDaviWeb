// Utilidades de exportação do módulo financeiro (CSV e PDF via impressão),
// no mesmo estilo do RelatoriosPage.

function campoCsv(v: string | number): string {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

// Gera e baixa um CSV (separador ";", BOM para o Excel abrir em UTF-8).
export function baixarCsv(
  nomeArquivo: string,
  cabecalho: string[],
  linhas: (string | number)[][],
): void {
  const conteudo = [
    cabecalho.map(campoCsv).join(";"),
    ...linhas.map((l) => l.map(campoCsv).join(";")),
  ].join("\r\n");
  const blob = new Blob(["﻿" + conteudo], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo.endsWith(".csv") ? nomeArquivo : `${nomeArquivo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function esc(v: string): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface SecaoImpressao {
  titulo?: string;
  cabecalho: string[];
  linhas: string[][];
  // Índices de colunas alinhadas à direita (valores).
  colunasNumericas?: number[];
  // Índices de linhas destacadas (totais/subtotais).
  linhasDestaque?: number[];
}

// Abre uma janela com HTML formatado e dispara a impressão (salvar como PDF).
export function imprimirDocumento(
  titulo: string,
  subtitulo: string,
  secoes: SecaoImpressao[],
): boolean {
  const tabelas = secoes
    .map((s) => {
      const num = new Set(s.colunasNumericas ?? []);
      const destaque = new Set(s.linhasDestaque ?? []);
      const thead = `<tr>${s.cabecalho
        .map((c, i) => `<th class="${num.has(i) ? "num" : ""}">${esc(c)}</th>`)
        .join("")}</tr>`;
      const tbody = s.linhas
        .map(
          (l, li) =>
            `<tr class="${destaque.has(li) ? "destaque" : ""}">${l
              .map(
                (v, i) =>
                  `<td class="${num.has(i) ? "num" : ""}">${esc(v)}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("");
      return `${s.titulo ? `<h2>${esc(s.titulo)}</h2>` : ""}<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${esc(titulo)}</title>
<style>
  body{font-family:Segoe UI,Roboto,Arial,sans-serif;color:#111;margin:28px;}
  h1{font-size:18px;margin:0 0 2px 0;}
  h2{font-size:14px;margin:22px 0 6px 0;}
  p.sub{margin:0 0 8px 0;color:#555;font-size:12px;}
  table{border-collapse:collapse;width:100%;font-size:11px;margin-bottom:4px;}
  th,td{border:1px solid #bbb;padding:4px 8px;text-align:left;}
  th{background:#eee;}
  td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}
  tr.destaque td{background:#f0f0f0;font-weight:600;}
  tr:nth-child(even):not(.destaque) td{background:#fafafa;}
</style></head><body>
<h1>Instituto Tribo de Davi — ${esc(titulo)}</h1>
<p class="sub">${esc(subtitulo)} · Gerado em ${new Date().toLocaleString("pt-BR")}</p>
${tabelas}
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
