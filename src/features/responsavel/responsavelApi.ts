import axios, { AxiosError } from "axios";
import { ApiError, type ResultViewModel } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

// Cliente próprio do portal do responsável: token separado do admin, guardado
// em sessionStorage (sessão pontual, some ao fechar a aba). Não passa pelo
// interceptor de refresh do app admin — o responsável não tem refresh token.
const RESP_TOKEN_KEY = "responsavel_token";

export function getRespToken(): string | null {
  return sessionStorage.getItem(RESP_TOKEN_KEY);
}
export function setRespToken(token: string): void {
  sessionStorage.setItem(RESP_TOKEN_KEY, token);
}
export function clearRespToken(): void {
  sessionStorage.removeItem(RESP_TOKEN_KEY);
}

const httpResp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: { "Content-Type": "application/json" },
});

httpResp.interceptors.request.use((config) => {
  const token = getRespToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function unwrap<T>(result: ResultViewModel<T> | undefined | null): T {
  if (!result || !result.success) {
    throw new ApiError(result?.message ?? "Falha ao processar a requisição.");
  }
  return result.data as T;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const msg =
      (error.response?.data as ResultViewModel<unknown> | undefined)?.message ??
      error.message;
    return new ApiError(msg, error.response?.status);
  }
  return error instanceof ApiError
    ? error
    : new ApiError("Erro inesperado ao conectar com o servidor.");
}

// ── Tipos do painel ─────────────────────────────────────────────────────────

export interface AcessoAluno {
  nome: string;
  faixa: number;
  polo: string;
  turma: number;
}
export interface AcessoResposta {
  token: string;
  tokenExpires: string;
  aluno: AcessoAluno;
}

export interface PresencaItem {
  id: number;
  data: string;
  presente: boolean;
  // Justificativa da falta enviada pelo responsável (null/"" = não justificada).
  justificativa: string | null;
  justificadaEm: string | null;
}

export interface PainelResponsavel {
  aluno: {
    nome: string;
    faixa: number;
    polo: string;
    turma: number;
    autorizaImagem: boolean | null;
    autorizaImagemEm: string | null;
  };
  frequencia: {
    totalAulas: number;
    presencas: number;
    faltas: number;
    percentual: number;
  };
  presencas: PresencaItem[];
  graduacoes: { data: string; faixaAnterior: number; faixaNova: number }[];
  avisos: { titulo: string; mensagem: string; data: string }[];
  eventos: {
    data: string;
    dataFim: string | null;
    titulo: string;
    descricao: string;
    tipo: number;
  }[];
  advertencias: { data: string; motivo: string }[];
  recados: { data: string; status: number; texto: string }[];
}

// ── Chamadas ────────────────────────────────────────────────────────────────

// Autentica com código + data de nascimento (YYYY-MM-DD). Guarda o token.
export async function acessar(
  codigo: string,
  dataNascimento: string,
): Promise<AcessoResposta> {
  try {
    const { data } = await httpResp.post<ResultViewModel<AcessoResposta>>(
      ApiRotas.responsavelAcesso,
      { codigo, dataNascimento },
    );
    const dados = unwrap(data);
    setRespToken(dados.token);
    return dados;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function obterPainel(): Promise<PainelResponsavel> {
  try {
    const { data } = await httpResp.get<ResultViewModel<PainelResponsavel>>(
      ApiRotas.responsavelPainel,
    );
    return unwrap(data);
  } catch (error) {
    throw toApiError(error);
  }
}

// O responsável autoriza (true) ou revoga (false) o uso de imagem do filho.
export async function autorizarImagem(
  autoriza: boolean,
): Promise<{ autorizaImagem: boolean }> {
  try {
    const { data } = await httpResp.post<
      ResultViewModel<{ autorizaImagem: boolean }>
    >(ApiRotas.responsavelAutorizarImagem, { autoriza });
    return unwrap(data);
  } catch (error) {
    throw toApiError(error);
  }
}

// O responsável justifica uma falta específica do filho. Retorna o item
// atualizado (com a justificativa e a data de registro).
export async function justificarFalta(
  presencaId: number,
  justificativa: string,
): Promise<PresencaItem> {
  try {
    const { data } = await httpResp.post<ResultViewModel<PresencaItem>>(
      ApiRotas.responsavelJustificarFalta,
      { presencaId, justificativa },
    );
    return unwrap(data);
  } catch (error) {
    throw toApiError(error);
  }
}

// ── Fila offline ──────────────────────────────────────────────────────────
// Quando o envio falha por falta de rede, guardamos a justificativa localmente
// e reenviamos quando a conexão volta. Chave por presença: a última tentativa
// para uma falta substitui a anterior.

const FILA_KEY = "responsavel_justificativas_pendentes";

export interface JustificativaPendente {
  presencaId: number;
  justificativa: string;
  em: string; // ISO de quando o responsável escreveu
}

export function lerFilaJustificativas(): JustificativaPendente[] {
  try {
    const bruto = localStorage.getItem(FILA_KEY);
    return bruto ? (JSON.parse(bruto) as JustificativaPendente[]) : [];
  } catch {
    return [];
  }
}

function gravarFila(fila: JustificativaPendente[]): void {
  localStorage.setItem(FILA_KEY, JSON.stringify(fila));
}

export function enfileirarJustificativa(item: JustificativaPendente): void {
  const fila = lerFilaJustificativas().filter((j) => j.presencaId !== item.presencaId);
  fila.push(item);
  gravarFila(fila);
}

export function removerDaFila(presencaId: number): void {
  gravarFila(lerFilaJustificativas().filter((j) => j.presencaId !== presencaId));
}

// Reenvia tudo que está pendente. Retorna os ids enviados com sucesso; os que
// falharem de novo continuam na fila para a próxima tentativa.
export async function sincronizarJustificativas(): Promise<number[]> {
  const fila = lerFilaJustificativas();
  const enviados: number[] = [];
  for (const item of fila) {
    try {
      await justificarFalta(item.presencaId, item.justificativa);
      removerDaFila(item.presencaId);
      enviados.push(item.presencaId);
    } catch {
      // Mantém na fila e para na primeira falha (provável rede caiu de novo).
      break;
    }
  }
  return enviados;
}

// Erro de rede (sem resposta do servidor) vs. erro de regra (4xx/5xx com corpo).
// Só o primeiro justifica cair na fila offline.
export function ehErroDeRede(error: unknown): boolean {
  return error instanceof ApiError && error.status === undefined;
}
