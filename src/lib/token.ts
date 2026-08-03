// Guarda o JWT em sessionStorage — mesma estratégia do portal Blazor
// (o token vive só enquanto a aba está aberta).
const TOKEN_KEY = "jwt_token";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}
