import { apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { AuthData, LoginResposta } from "@/types";

export interface LoginRequest {
  login: string;
  password: string;
  // Segundo fator, enviado só na segunda etapa (quando o usuário tem 2FA).
  codigo2fa?: string;
}

export function login(request: LoginRequest): Promise<LoginResposta> {
  return apiPost<LoginResposta>(ApiRotas.login, request);
}

export interface PrimeiroAcessoRequest {
  login: string;
  password: string;
  email: string;
  // Só exigido quando a API tem "Setup:Token" configurado (produção).
  token?: string;
}

// Cria o primeiro administrador (bootstrap). Só funciona enquanto não existe
// nenhum usuário no sistema.
export function primeiroAcesso(request: PrimeiroAcessoRequest): Promise<unknown> {
  return apiPost(ApiRotas.usuarioSetup, request);
}

// Renova a sessão a partir do refresh token (rotação no servidor).
export function refresh(refreshToken: string): Promise<AuthData> {
  return apiPost<AuthData>(ApiRotas.refresh, { refreshToken });
}

// Revoga o refresh token no servidor (logout de verdade, não só local).
export function logout(refreshToken: string): Promise<unknown> {
  return apiPost(ApiRotas.logout, { refreshToken });
}

// ── 2FA (TOTP) ────────────────────────────────────────────────────────────

export interface Setup2FA {
  secret: string;
  uri: string;
}

export function status2FA(): Promise<{ ativo: boolean }> {
  return apiGet<{ ativo: boolean }>(ApiRotas.doisFatoresStatus);
}

export function iniciar2FA(): Promise<Setup2FA> {
  return apiPost<Setup2FA>(ApiRotas.doisFatoresIniciar);
}

export function confirmar2FA(codigo: string): Promise<unknown> {
  return apiPost(ApiRotas.doisFatoresConfirmar, { codigo });
}

export function desativar2FA(codigo: string): Promise<unknown> {
  return apiPost(ApiRotas.doisFatoresDesativar, { codigo });
}
