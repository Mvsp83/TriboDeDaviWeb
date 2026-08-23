// Handler de Web Push do service worker. É importado pelo SW gerado pelo
// Workbox (vite.config.ts → workbox.importScripts), então NÃO mexe no
// precache/offline: só adiciona os listeners de push e de clique.

self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { title: "Tribo de Davi", body: event.data ? event.data.text() : "" };
  }

  const titulo = dados.title || "Tribo de Davi";
  const opcoes = {
    body: dados.body || "",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    // A URL de destino viaja no data para o clique saber para onde ir.
    data: { url: dados.url || "/" },
    lang: "pt-BR",
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/";

  // Foca uma aba já aberta do app, se houver; senão abre uma nova.
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientes) => {
        for (const cliente of clientes) {
          if ("focus" in cliente) {
            cliente.navigate(destino);
            return cliente.focus();
          }
        }
        return self.clients.openWindow(destino);
      }),
  );
});
