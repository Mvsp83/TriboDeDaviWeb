import { apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { AuthData } from "@/types";

export interface LoginRequest {
  login: string;
  password: string;
}

export function login(request: LoginRequest): Promise<AuthData> {
  return apiPost<AuthData>(ApiRotas.login, request);
}
