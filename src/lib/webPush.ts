import { apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

// Opt-in de Web Push no app da equipe. O service worker (registrado pelo
// vite-plugin-pwa) recebe as notificações; aqui cuidamos de permissão,
// assinatura no navegador e sincronização com a API.

export interface EstadoPush {
  suportado: boolean; // o navegador tem Push API + service worker?
  configurado: boolean; // o servidor tem chaves VAPID?
  permissao: NotificationPermission; // "default" | "granted" | "denied"
  inscrito: boolean; // este dispositivo já está inscrito?
}

// O navegador suporta Web Push? (iOS só a partir do 16.4 e apenas instalado.)
export function pushSuportado(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Converte a chave VAPID (base64url) para o Uint8Array que o subscribe espera.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base);
  // ArrayBuffer explícito para o tipo ser Uint8Array<ArrayBuffer> — o que
  // applicationServerKey (BufferSource) exige.
  const saida = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) saida[i] = raw.charCodeAt(i);
  return saida;
}

async function chavePublica(): Promise<{ publicKey: string; configurado: boolean }> {
  return apiGet<{ publicKey: string; configurado: boolean }>(ApiRotas.pushVapidPublicKey);
}

async function registrationPronta(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready;
}

// Estado atual para desenhar o toggle: suporte, configuração do servidor,
// permissão e se este dispositivo já está inscrito.
export async function obterEstadoPush(): Promise<EstadoPush> {
  const suportado = pushSuportado();
  if (!suportado) {
    return { suportado: false, configurado: false, permissao: "denied", inscrito: false };
  }

  let configurado = false;
  try {
    configurado = (await chavePublica()).configurado;
  } catch {
    configurado = false;
  }

  let inscrito = false;
  try {
    const reg = await registrationPronta();
    inscrito = (await reg.pushManager.getSubscription()) != null;
  } catch {
    inscrito = false;
  }

  return { suportado, configurado, permissao: Notification.permission, inscrito };
}

// Extrai endpoint + chaves p256dh/auth de uma PushSubscription do navegador.
function dadosDaInscricao(sub: PushSubscription) {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  };
}

// Pede permissão, assina no navegador e registra na API. Lança se a permissão
// for negada ou o servidor não estiver configurado.
export async function ativarPush(): Promise<void> {
  if (!pushSuportado()) throw new Error("Este navegador não suporta notificações.");

  const { publicKey, configurado } = await chavePublica();
  if (!configurado || !publicKey) {
    throw new Error("As notificações ainda não foram configuradas no servidor.");
  }

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    throw new Error("Permissão de notificação negada.");
  }

  const reg = await registrationPronta();
  // Reaproveita a inscrição existente, se houver; senão cria uma nova.
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await apiPost(ApiRotas.pushInscrever, dadosDaInscricao(sub));
}

// Desassina no navegador e remove da API. Idempotente.
export async function desativarPush(): Promise<void> {
  if (!pushSuportado()) return;
  const reg = await registrationPronta();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const { endpoint } = dadosDaInscricao(sub);
  await sub.unsubscribe();
  await apiPost(ApiRotas.pushDesinscrever, { endpoint });
}

// Dispara um push de teste para os dispositivos do usuário. Retorna quantos.
export async function testarPush(): Promise<number> {
  const r = await apiPost<{ enviados: number }>(ApiRotas.pushTestar);
  return r.enviados;
}
