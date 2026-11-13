/**
 * Hub Serverless Unificado de Analytics & Telemetria do FloodWay
 * Agrupa Ingestão (POST) e Leitura/Dashboard (GET) no MESMO arquivo/container Serverless,
 * garantindo que toda a telemetria, visitas e demografia fiquem 100% sincronizadas.
 */
import { setSecureCorsHeaders, checkRateLimit } from './_security.js';

const ADMIN_SECRET = process.env.ANALYTICS_ADMIN_KEY || 'floodway2026admin';

// Armazenamento em memória compartilhada dentro da instância
const store = globalThis.__floodway_telemetry_shared_store || {
  totalEvents: 0,
  pageViews: {},
  devices: { Android: 0, iOS: 0, Windows: 0, macOS: 0, Linux: 0, Outro: 0 },
  browsers: {},
  cidades: {},
  demografia: {
    faixas: { '18-24': 0, '25-34': 0, '35-49': 0, '50-64': 0, '65+': 0 },
    genero: { 'Feminino': 0, 'Masculino': 0, 'Outro': 0 }
  },
  pwaCount: 0,
  webCount: 0,
  simulacoes: [],
  recentEvents: []
};
globalThis.__floodway_telemetry_shared_store = store;

export default async function handler(req, res) {
  setSecureCorsHeaders(req, res, 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ==========================================
  // ROTA 1: INGESTÃO DE TELEMETRIA (POST)
  // ==========================================
  if (req.method === 'POST') {
    if (!checkRateLimit(req, 120, 60)) {
      return res.status(429).json({ error: 'Muitas requisições. Rate limit excedido.' });
    }

    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (_) { body = {}; }
      }

      const rawEvents = Array.isArray(body?.events) ? body.events : (body?.event_type ? [body] : []);
      const sanitizedEvents = rawEvents.slice(0, 50);

      const clientCity = req.headers['x-vercel-ip-city'] || 'Lajeado';
      const clientRegion = req.headers['x-vercel-ip-country-region'] || 'RS';
      const clientCountry = req.headers['x-vercel-ip-country'] || 'BR';

      for (const evt of sanitizedEvents) {
        if (!evt || !evt.event_type) continue;

        store.totalEvents++;

        // Páginas
        if (evt.event_type === 'page_view') {
          const p = String(evt.data?.page || 'desconhecida').substring(0, 40);
          store.pageViews[p] = (store.pageViews[p] || 0) + 1;
        }

        // Dispositivos
        if (evt.device?.os) {
          const os = String(evt.device.os).substring(0, 20);
          store.devices[os] = (store.devices[os] || 0) + 1;
        }
        if (evt.device?.browser) {
          const b = String(evt.device.browser).substring(0, 20);
          store.browsers[b] = (store.browsers[b] || 0) + 1;
        }
        if (evt.device?.isPWA) {
          store.pwaCount++;
        } else {
          store.webCount++;
        }

        // Demografia (Idade e Sexo informados)
        if (evt.event_type === 'demografia_optin' && evt.data) {
          const faixa = String(evt.data.faixa_etaria || '').trim();
          const gen = String(evt.data.genero || '').trim();
          if (faixa && store.demografia.faixas[faixa] !== undefined) {
            store.demografia.faixas[faixa]++;
          }
          if (gen && store.demografia.genero[gen] !== undefined) {
            store.demografia.genero[gen]++;
          }
        }

        // Cidades aproximadas
        const locKey = `${decodeURIComponent(clientCity)}/${clientRegion}`.substring(0, 50);
        store.cidades[locKey] = (store.cidades[locKey] || 0) + 1;

        // Simulações de Cota
        if (evt.event_type === 'river_simulation' && evt.data?.cota_simulada) {
          store.simulacoes.push({
            cota: Number(evt.data.cota_simulada) || 0,
            delta: Number(evt.data.delta) || 0,
            timestamp: evt.timestamp || new Date().toISOString()
          });
          if (store.simulacoes.length > 200) store.simulacoes.shift();
        }

        // Log recente
        store.recentEvents.unshift({
          ...evt,
          geo: {
            city: decodeURIComponent(clientCity),
            region: clientRegion,
            country: clientCountry
          },
          server_received_at: new Date().toISOString()
        });
        if (store.recentEvents.length > 100) store.recentEvents.pop();
      }

      return res.status(200).json({ status: 'ok', received: sanitizedEvents.length, total: store.totalEvents });
    } catch (err) {
      console.error('Erro ao processar ingestão:', err);
      return res.status(500).json({ error: 'Erro interno ao processar telemetria' });
    }
  }

  // ==========================================
  // ROTA 2: DASHBOARD STATS / ADMIN (GET)
  // ==========================================
  if (req.method === 'GET') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || token !== ADMIN_SECRET) {
      return res.status(401).json({ error: 'Não autorizado. Senha de administrador inválida.' });
    }

    const totalGeral = store.totalEvents;
    const pageViews = store.pageViews;
    const devices = store.devices;
    const pwaCount = store.pwaCount;
    const webCount = store.webCount;

    const cotasRaw = store.simulacoes || [];
    const faixasCotas = [
      { faixa: '13m - 18m (Normal/Atenção)', acessos: cotasRaw.filter(s => s.cota >= 13 && s.cota < 19).length },
      { faixa: '19m - 23m (Alerta Inicial)', acessos: cotasRaw.filter(s => s.cota >= 19 && s.cota < 24).length },
      { faixa: '24m - 28m (Inundação Centro/Ponte)', acessos: cotasRaw.filter(s => s.cota >= 24 && s.cota < 29).length },
      { faixa: '29m - 36m (Nível Crítico/Maio-24)', acessos: cotasRaw.filter(s => s.cota >= 29).length }
    ];

    const uniqueClients = new Set();
    (store.recentEvents || []).forEach(e => {
      if (e.client_id) uniqueClients.add(e.client_id);
    });
    const usuariosEstimados = uniqueClients.size > 0 ? uniqueClients.size : (totalGeral > 0 ? 1 : 0);

    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      resumo: {
        totalEventos: totalGeral,
        usuariosEstimados: usuariosEstimados,
        pwaInstalados: pwaCount,
        navegadoresWeb: webCount,
        taxaPWA: (pwaCount + webCount > 0) ? Math.round((pwaCount / (pwaCount + webCount)) * 100) + '%' : '0%'
      },
      paginas: Object.entries(pageViews).map(([nome, views]) => ({ nome, views })),
      dispositivos: Object.entries(devices).map(([nome, valor]) => ({ nome, valor })),
      cidades: Object.entries(store.cidades).map(([cidade, total]) => ({ cidade, total })),
      demografia: store.demografia || {
        faixas: { '18-24': 0, '25-34': 0, '35-49': 0, '50-64': 0, '65+': 0 },
        genero: { 'Feminino': 0, 'Masculino': 0, 'Outro': 0 }
      },
      cotasSimuladas: faixasCotas,
      ultimosEventos: (store.recentEvents || []).slice(0, 30)
    });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
