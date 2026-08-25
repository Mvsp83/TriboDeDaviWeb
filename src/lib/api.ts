import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearToken,
  getRefreshToken,
  getToken,
  setRefreshToken,
  setToken,
} from "@/lib/token";
import { ApiRotas } from "@/lib/apiRoutes";
import type { AuthData } from "@/types";

// Envelope padrão da API (ResultViewModel<T>)
export interface ResultViewModel<T> {
  message: string;
  success: boolean;
  data: T | null;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Em dev, baseURL vazia => caminhos relativos passam pelo proxy do Vite.
// Em produção, VITE_API_BASE_URL aponta para a API pública.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Uploads (FormData): remove o Content-Type JSON padrão para o navegador
  // definir multipart/form-data com o boundary correto — senão a API rejeita
  // o upload com 415 Unsupported Media Type.
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});

// Renovação single-flight: várias requisições que tomam 401 ao mesmo tempo
// compartilham um único /refresh. Devolve o novo access token, ou null se não
// deu (sem refresh token, ou o refresh também falhou).
let renovacaoEmAndamento: Promise<string | null> | null = null;

async function renovarSessao(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      try {
        const { data } = await http.post<ResultViewModel<AuthData>>(
          ApiRotas.refresh,
          { refreshToken },
        );
        if (!data?.success || !data.data) return null;
        setToken(data.data.token);
        if (data.data.refreshToken) setRefreshToken(data.data.refreshToken);
        return data.data.token;
      } catch {
        return null;
      } finally {
        renovacaoEmAndamento = null;
      }
    })();
  }
  return renovacaoEmAndamento;
}

type ConfigComRetry = InternalAxiosRequestConfig & { _retry?: boolean };

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as ConfigComRetry | undefined;
    const url = original?.url ?? "";
    const ehAuth = url.includes("/auth/refresh") || url.includes("/auth/login");

    // 401 numa chamada normal: tenta renovar a sessão uma vez e repetir. Só
    // funciona online (o /refresh precisa de rede); offline, o erro segue e o
    // app continua com o que tem em cache.
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !ehAuth
    ) {
      original._retry = true;
      const novoToken = await renovarSessao();
      if (novoToken) {
        original.headers.Authorization = `Bearer ${novoToken}`;
        return http(original);
      }

      // Refresh indisponível/negado: encerra a sessão e volta ao login.
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

// Extrai o Data do envelope, lançando ApiError quando success = false
function unwrap<T>(result: ResultViewModel<T> | undefined | null): T {
  if (!result || !result.success) {
    throw new ApiError(result?.message ?? "Falha ao processar a requisição.");
  }
  return result.data as T;
}

export function toApiError(error: unknown): ApiError {
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

export async function apiGet<T>(url: string): Promise<T> {
  try {
    const { data } = await http.get<ResultViewModel<T>>(url);
    return unwrap(data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  try {
    const { data } = await http.post<ResultViewModel<T>>(url, body);
    return unwrap(data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  try {
    const { data } = await http.put<ResultViewModel<T>>(url, body);
    return unwrap(data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiDelete<T>(url: string): Promise<T> {
  try {
    const { data } = await http.delete<ResultViewModel<T>>(url);
    return unwrap(data);
  } catch (error) {
    throw toApiError(error);
  }
}

// Variante que devolve Success + Message da API sem lançar (ex.: sincronização).
export async function apiPostMensagem(
  url: string,
  body?: unknown,
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const { data } = await http.post<ResultViewModel<unknown>>(url, body);
    return {
      sucesso: data?.success ?? false,
      mensagem: data?.message ?? "Sem resposta do servidor.",
    };
  } catch (error) {
    return { sucesso: false, mensagem: toApiError(error).message };
  }
}
