// Importação de extrato bancário em PDF (formato VIACREDI/Sicoob e semelhantes).
// O pdfjs é carregado sob demanda (import dinâmico) para não pesar no bundle.
import type { TipoMovimentacao } from "./tipos";

export interface LinhaExtrato {
  data: string; // yyyy-MM-dd
  descricao: string;
  documento: string;
  valor: number; // sempre positivo
  tipo: TipoMovimentacao;
  categoriaId: string; // sugestão inicial (editável na prévia)
}

// "-1.234,56" -> -1234.56
function parseValorBR(s: string): number {
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function dataBRparaISO(ddmmyyyy: string): string {
  const [d, m, a] = ddmmyyyy.split("/");
  return `${a}-${m}-${d}`;
}

// Sugestão conservadora de categoria; o usuário ajusta na prévia.
function sugerirCategoria(descricao: string, tipo: TipoMovimentacao): string {
  const d = descricao.toUpperCase();
  if (d.includes("TARIFA")) return "tarifas";
  if (/CELESC|ENERGIA|\bAGUA\b|\bLUZ\b|INTERNET|SANEAMENTO/.test(d))
    return "utilidades";
  if (/APLIC|COTAS|SOBRAS/.test(d)) return "transferencia";
  return tipo === "Credito" ? "outras-receitas" : "outras-despesas";
}

// Reconstrói as linhas de texto de uma página agrupando itens pela posição Y.
function linhasDaPagina(itens: { str: string; x: number; y: number }[]): string[] {
  const grupos = new Map<number, { x: number; str: string }[]>();
  for (const it of itens) {
    const y = Math.round(it.y);
    const arr = grupos.get(y) ?? [];
    arr.push({ x: it.x, str: it.str });
    grupos.set(y, arr);
  }
  return [...grupos.entries()]
    .sort((a, b) => b[0] - a[0]) // Y decrescente = de cima para baixo
    .map(([, arr]) =>
      arr
        .sort((a, b) => a.x - b.x)
        .map((t) => t.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    );
}

// Linha de movimento: "dd/mm/aaaa  documento  valor  saldo"
const RE_MOV = /^(\d{2}\/\d{2}\/\d{4})\s+(\S+)\s+(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})$/;

export async function parsearExtratoPdf(arquivo: File): Promise<LinhaExtrato[]> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await arquivo.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  const linhas: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const conteudo = await page.getTextContent();
    // items é (TextItem | TextMarkedContent)[]; ficamos só com os que têm texto.
    type ItemTexto = { str: string; transform: number[] };
    const itens = (conteudo.items as unknown as ItemTexto[])
      .filter((i) => typeof i.str === "string" && Array.isArray(i.transform))
      .map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5] }));
    linhas.push(...linhasDaPagina(itens));
  }

  const movimentos: LinhaExtrato[] = [];
  let descricaoAnterior = "";
  for (const linha of linhas) {
    const m = linha.match(RE_MOV);
    if (!m) {
      // Linha de descrição (ignora cabeçalhos e "SALDO ANTERIOR").
      if (linha && !/^SALDO ANTERIOR/i.test(linha)) descricaoAnterior = linha;
      continue;
    }
    const [, dataBR, documento, valorStr] = m;
    const valorAssinado = parseValorBR(valorStr);
    if (!Number.isFinite(valorAssinado)) continue;

    const tipo: TipoMovimentacao = valorAssinado < 0 ? "Debito" : "Credito";
    const descricao = descricaoAnterior || "Movimentação";
    movimentos.push({
      data: dataBRparaISO(dataBR),
      descricao,
      documento,
      valor: Math.abs(valorAssinado),
      tipo,
      categoriaId: sugerirCategoria(descricao, tipo),
    });
    descricaoAnterior = "";
  }

  return movimentos;
}

// ── OFX (Open Financial Exchange) ─────────────────────────────────────────
// Formato padrão exportado pela maioria dos bancos. Bem mais robusto que PDF
// (independe de layout). Serve SGML (tags sem fechamento) e XML (OFX 2.x).

function unescapeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

// Valor de uma tag OFX: do ">" até o próximo "<" ou fim de linha.
function tagOfx(bloco: string, tag: string): string {
  const m = bloco.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, "i"));
  return m ? unescapeXml(m[1].trim()) : "";
}

function valorOfx(s: string): number {
  const t = s.replace(/\s/g, "");
  // OFX costuma usar "." como decimal; alguns bancos BR usam ",".
  const n = t.includes(",") && !t.includes(".") ? t.replace(",", ".") : t;
  return Number(n);
}

async function lerTextoArquivo(arquivo: File): Promise<string> {
  const buf = new Uint8Array(await arquivo.arrayBuffer());
  const cabecalho = new TextDecoder("latin1")
    .decode(buf.slice(0, 512))
    .toUpperCase();
  const enc =
    cabecalho.includes("CHARSET:1252") || cabecalho.includes("WINDOWS-1252")
      ? "windows-1252"
      : "utf-8";
  return new TextDecoder(enc).decode(buf);
}

export async function parsearExtratoOfx(arquivo: File): Promise<LinhaExtrato[]> {
  const texto = await lerTextoArquivo(arquivo);
  const blocos = texto.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];

  const movimentos: LinhaExtrato[] = [];
  for (const bloco of blocos) {
    const valorAssinado = valorOfx(tagOfx(bloco, "TRNAMT"));
    if (!Number.isFinite(valorAssinado)) continue;

    const dtRaw = tagOfx(bloco, "DTPOSTED").slice(0, 8); // yyyymmdd
    if (dtRaw.length < 8) continue;
    const data = `${dtRaw.slice(0, 4)}-${dtRaw.slice(4, 6)}-${dtRaw.slice(6, 8)}`;

    const descricao =
      tagOfx(bloco, "MEMO") || tagOfx(bloco, "NAME") || "Movimentação";
    const documento =
      tagOfx(bloco, "CHECKNUM") || tagOfx(bloco, "FITID") || "";
    const tipo: TipoMovimentacao = valorAssinado < 0 ? "Debito" : "Credito";

    movimentos.push({
      data,
      descricao,
      documento,
      valor: Math.abs(valorAssinado),
      tipo,
      categoriaId: sugerirCategoria(descricao, tipo),
    });
  }
  return movimentos;
}

// Dispatcher: escolhe o parser pela extensão do arquivo.
export async function parsearExtrato(arquivo: File): Promise<LinhaExtrato[]> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".ofx") || nome.endsWith(".qfx"))
    return parsearExtratoOfx(arquivo);
  return parsearExtratoPdf(arquivo);
}
