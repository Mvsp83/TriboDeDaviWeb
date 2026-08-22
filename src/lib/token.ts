// Guarda o JWT em localStorage para que a sessão sobreviva ao fechamento do
// app — requisito do uso offline (PWA): o professor reabre no tatame, sem
// internet, e ainda precisa acessar a chamada. A validade continua sendo
// respeitada (sessaoDoToken confere o `exp`), então um token vencido força
// novo login assim que houver conexão.
//
// O refresh token acompanha o JWT (mesmo armazenamento) e serve para renovar a
// sessão silenciosamente QUANDO HÁ REDE, sem novo login. Ele é revogável no
// servidor — é o que permite "sair de todos os aparelhos" e desativar um
// usuário. Offline, o app segue usando o JWT ainda válido; ao voltar a
// conexão, o refresh renova.
const TOKEN_KEY = "jwt_token";
const REFRESH_KEY = "refresh_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

// Limpa toda a sessão (JWT + refresh). Usado no logout e ao cair a sessão.
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
