/**
 * Converte chave base64 URL-safe para Uint8Array para uso na Web Push API
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registra o aparelho no servidor para receber notificações Web Push
 * mesmo com o aplicativo fechado ou telefone travado.
 */
export async function registrarWebPushServerSide(usuario) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Navegador não suporta PushManager para segundo plano.");
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) return false;

    // Obtém a chave pública VAPID oficial do servidor
    const respChave = await fetch("/api/notificacoes/inscrever");
    if (!respChave.ok) return false;
    const { publicKey } = await respChave.json();
    if (!publicKey) return false;

    // Assina com o gateway oficial Google/Apple
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    // Coleta as cotas e locais monitorados do usuário
    const locais = [];
    if (usuario?.residencia) {
      locais.push({
        nome: "Residência Principal",
        endereco: usuario.residencia.endereco || "Minha Casa",
        cota: Number(usuario.residencia.cota || 24.0),
        tipo: "residencia"
      });
    }
    if (Array.isArray(usuario?.pontosInteresse)) {
      usuario.pontosInteresse.forEach((p) => {
        locais.push({
          nome: p.nome,
          endereco: p.endereco,
          cota: Number(p.cota || 24.0),
          tipo: "ponto"
        });
      });
    }

    // Envia assinatura para o servidor
    const respSalvar = await fetch("/api/notificacoes/inscrever", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription,
        usuario: { email: usuario?.email || "anonimo@floodway.app", nome: usuario?.nome || "Morador" },
        locais
      })
    });

    return respSalvar.ok;
  } catch (err) {
    console.warn("Falha ao registrar Web Push Server-Side:", err);
    return false;
  }
}

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
