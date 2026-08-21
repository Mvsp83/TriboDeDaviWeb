import { apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { ContaFinanceira, MovimentacaoFinanceira } from "./tipos";

// Migração única dos dados que ficavam no localStorage para a API.
//
// A chave antiga é preservada mesmo depois de importar: ela é a única cópia
// que existia desses lançamentos, então só o usuário decide apagá-la, e apenas
// depois de conferir os dados no servidor.

const CHAVE_ANTIGA = "tribo.financeiro.v1";
const CHAVE_MIGRADO = "tribo.financeiro.migrado";

export interface CargaLocal {
  contas: ContaFinanceira[];
  movimentacoes: MovimentacaoFinanceira[];
}

// Lê a carga antiga do navegador. Devolve null quando não há nada a migrar.
export function lerCargaLocal(): CargaLocal | null {
  try {
    const bruto = localStorage.getItem(CHAVE_ANTIGA);
    if (!bruto) return null;
    const db = JSON.parse(bruto) as Partial<CargaLocal>;
    const contas = db.contas ?? [];
    const movimentacoes = db.movimentacoes ?? [];
    if (contas.length === 0 && movimentacoes.length === 0) return null;
    return { contas, movimentacoes };
  } catch {
    return null;
  }
}

export function jaMigrou(): boolean {
  return localStorage.getItem(CHAVE_MIGRADO) === "1";
}

export function marcarMigrado(): void {
  try {
    localStorage.setItem(CHAVE_MIGRADO, "1");
  } catch {
    // Sem localStorage: no pior caso o aviso reaparece, e a API recusa a
    // segunda importação — não há risco de duplicar.
  }
}

// Guarda uma cópia da carga antiga num arquivo, para o usuário ter um backup
// fora do navegador antes de qualquer coisa.
export function baixarCopiaLocal(carga: CargaLocal): void {
  const blob = new Blob([JSON.stringify(carga, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financeiro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ResultadoImportacao {
  contasImportadas: number;
  movimentacoesImportadas: number;
  mensagem: string;
}

export async function importarParaApi(
  carga: CargaLocal,
): Promise<ResultadoImportacao> {
  return apiPost<ResultadoImportacao>(ApiRotas.finImportar, {
    contas: carga.contas,
    movimentacoes: carga.movimentacoes,
  });
}
