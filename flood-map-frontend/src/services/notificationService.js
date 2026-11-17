/**
 * SERVIÇO CENTRALIZADO DE NOTIFICAÇÕES NATIVAS (PUSH / LOCAL)
 * Suporta ServiceWorker (background/PWA) e fallback direto via Window Notification API.
 */

export async function solicitarPermissaoNotificacao() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (e) {
    console.warn("Erro ao pedir permissao de notificacao:", e);
    return "denied";
  }
}

export async function dispararAlertaLocal(titulo, mensagem, tag = "alerta-floodway") {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  // Se ainda não tiver permissão, tenta solicitar
  if (Notification.permission !== "granted") {
    if (Notification.permission !== "denied") {
      const perm = await solicitarPermissaoNotificacao();
      if (perm !== "granted") return false;
    } else {
      return false;
    }
  }

  try {
    // 1. Tenta via ServiceWorker primeiro (padrão Android/PWA)
    if ("serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(titulo, {
            body: mensagem,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            vibrate: [300, 100, 300, 100, 300],
            tag: tag,
            renotify: true,
          });
          return true;
        }
      } catch (swErr) {
        console.warn("ServiceWorker showNotification falhou, tentando fallback window:", swErr);
      }
    }

    // 2. Fallback direto via new Notification
    try {
      new Notification(titulo, {
        body: mensagem,
        icon: "/icon-192.png",
        tag: tag,
      });
    } catch (winErr) {
      console.warn("new Notification falhou:", winErr);
    }
    return true;
  } catch (err) {
    console.warn("Erro ao disparar notificacao local:", err);
    return false;
  }
}
