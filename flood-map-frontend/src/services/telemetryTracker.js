import { hasAnalyticsConsent } from '../components/common/CookieConsentBanner';

const INGEST_ENDPOINT = '/api/analytics/ingest';
const LOCAL_QUEUE_KEY = 'floodway_analytics_queue';
const CLIENT_ID_KEY = 'floodway_analytics_cid';

// Gera ou recupera um ID pseudoanônimo local (UUID v4 simplificado)
function getOrCreateClientId() {
  if (typeof window === 'undefined') return 'unknown';
  try {
    let cid = localStorage.getItem(CLIENT_ID_KEY);
    if (!cid) {
      cid = 'fw_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(CLIENT_ID_KEY, cid);
    }
    return cid;
  } catch {
    return 'fw_anonymous';
  }
}

// Coleta metadados técnicos do dispositivo de forma passiva e anônima
function getDeviceContext() {
  if (typeof window === 'undefined') return {};
  const ua = navigator.userAgent || '';
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  
  // Detecção de OS simplificada
  let os = 'Outro';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Detecção simplificada de Navegador
  let browser = 'Outro';
  if (/chrome|crios/i.test(ua) && !/edge|opr/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  // Tipo de conexão (quando disponível na API Network Information)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const connectionType = conn ? (conn.effectiveType || conn.type || 'unknown') : 'unknown';

  return {
    os,
    browser,
    isPWA,
    screenWidth: window.screen ? window.screen.width : 0,
    screenHeight: window.screen ? window.screen.height : 0,
    viewportWidth: window.innerWidth || 0,
    viewportHeight: window.innerHeight || 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    connectionType,
    language: navigator.language || 'pt-BR'
  };
}

class TelemetryTracker {
  constructor() {
    this.queue = [];
    this.timer = null;
    this.batchIntervalMs = 6000; // Envia lotes a cada 6 segundos
    this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    // Resgata possíveis itens que sobraram da sessão anterior no localStorage
    try {
      const stored = localStorage.getItem(LOCAL_QUEUE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.queue.push(...parsed);
          localStorage.removeItem(LOCAL_QUEUE_KEY);
        }
      }
    } catch {}

    // Flush de segurança ao descarregar a página usando sendBeacon
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });

    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    // Se o usuário autorizar consentimento no meio da navegação
    window.addEventListener('cookie_consent_changed', (e) => {
      if (e.detail?.analytics) {
        this.track('consent_granted', { method: 'banner' });
      }
    });
  }

  track(eventType, eventData = {}) {
    // Respeito integral à LGPD: se o usuário não consentiu com telemetria, não armazena
    if (!hasAnalyticsConsent()) {
      return;
    }

    const payload = {
      event_id: 'evt_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      event_type: eventType,
      client_id: getOrCreateClientId(),
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      url_path: typeof window !== 'undefined' ? window.location.pathname : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      device: getDeviceContext(),
      data: eventData
    };

    this.queue.push(payload);

    // Salva na fila local temporária
    try {
      localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(this.queue.slice(-50)));
    } catch {}

    // Dispara envio por lote se atingir 5 eventos ou reinicia o temporizador
    if (this.queue.length >= 5) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, this.batchIntervalMs);
    }
  }

  async flush(useBeacon = false) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    // Remove os itens da fila local para processamento
    const eventsToSend = [...this.queue];
    this.queue = [];
    try {
      localStorage.removeItem(LOCAL_QUEUE_KEY);
    } catch {}

    const payloadString = JSON.stringify({ events: eventsToSend });

    // 1. Tenta navigator.sendBeacon se a página estiver fechando/em background
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([payloadString], { type: 'application/json' });
        const success = navigator.sendBeacon(INGEST_ENDPOINT, blob);
        if (success) return;
      } catch (e) {
        // Fallback para fetch
      }
    }

    // 2. Envio padrão assíncrono via fetch
    try {
      const resp = await fetch(INGEST_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payloadString,
        keepalive: true
      });

      if (!resp.ok) {
        // Reinsere na fila se falhar a rede (máximo 50 itens)
        this.queue = [...eventsToSend.slice(-30), ...this.queue];
      }
    } catch (err) {
      // Falha de rede: readiciona até 30 eventos para reenvio futuro
      this.queue = [...eventsToSend.slice(-30), ...this.queue];
    }
  }
}

// Instância singleton
export const telemetry = new TelemetryTracker();

// Helpers rápidos para rastreamento de domínios específicos do FloodWay
export function trackPageView(pageName) {
  telemetry.track('page_view', { page: pageName });
}

export function trackSimulacao(cotaSimulada, cotaReal) {
  telemetry.track('river_simulation', {
    cota_simulada: cotaSimulada,
    cota_real: cotaReal,
    delta: Math.round((cotaSimulada - cotaReal) * 100) / 100
  });
}

export function trackBuscaRota(origem, destino, cotaCorte, sucesso = true) {
  telemetry.track('route_calculated', {
    tem_origem: !!origem,
    tem_destino: !!destino,
    cota_corte: cotaCorte,
    sucesso
  });
}

export function trackCasaSalva(bairro, cotaTerreno) {
  telemetry.track('home_configured', {
    bairro: bairro || 'Lajeado',
    cota_terreno: cotaTerreno
  });
}
