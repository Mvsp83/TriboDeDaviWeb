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

export interface PainelResponsavel {
  aluno: { nome: string; faixa: number; polo: string; turma: number };
  frequencia: {
    totalAulas: number;
    presencas: number;
    faltas: number;
    percentual: number;
  };
  presencas: { data: string; presente: boolean }[];
  graduacoes: { data: string; faixaAnterior: number; faixaNova: number }[];
  avisos: { titulo: string; mensagem: string; data: string }[];
  eventos: {
    data: string;
    dataFim: string | null;
    titulo: string;
    descricao: string;
    tipo: number;
  }[];
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
