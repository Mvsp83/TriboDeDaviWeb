// Guarda o JWT em localStorage para que a sessão sobreviva ao fechamento do
// app — requisito do uso offline (PWA): o professor reabre no tatame, sem
// internet, e ainda precisa acessar a chamada. A validade continua sendo
// respeitada (sessaoDoToken confere o `exp`), então um token vencido força
// novo login assim que houver conexão.
const TOKEN_KEY = "jwt_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
