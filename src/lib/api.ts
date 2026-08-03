import axios, { AxiosError } from "axios";
import { clearToken, getToken } from "@/lib/token";

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
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Sessão expirada/invalida: limpa o token e volta ao login
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
