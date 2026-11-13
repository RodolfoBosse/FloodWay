/**
 * Endpoint Serverless na Vercel: /api/analytics/ingest
 * Recebe lotes de eventos telemétricos com Rate Limiting e CORS seguro
 */
import { setSecureCorsHeaders, checkRateLimit } from '../_security.js';
import { getAnalyticsStore, saveAnalyticsStore } from './_store.js';

export default async function handler(req, res) {
  setSecureCorsHeaders(req, res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Rate Limiting: Máximo de 60 envios por minuto por IP
  if (!checkRateLimit(req, 60, 60)) {
    return res.status(429).json({ error: 'Muitas requisições. Rate limit excedido.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const rawEvents = Array.isArray(body?.events) ? body.events : (body?.event_type ? [body] : []);
    const sanitizedEvents = rawEvents.slice(0, 50);

    const memoryStore = getAnalyticsStore();

    const clientCity = req.headers['x-vercel-ip-city'] || 'Lajeado';
    const clientRegion = req.headers['x-vercel-ip-country-region'] || 'RS';
    const clientCountry = req.headers['x-vercel-ip-country'] || 'BR';

    for (const evt of sanitizedEvents) {
      if (!evt || !evt.event_type) continue;

      memoryStore.totalEvents++;

      // Agregação de Páginas
      if (evt.event_type === 'page_view') {
        const p = String(evt.data?.page || 'desconhecida').substring(0, 40);
        memoryStore.pageViews[p] = (memoryStore.pageViews[p] || 0) + 1;
      }

      // Dispositivos e PWA
      if (evt.device?.os) {
        const os = String(evt.device.os).substring(0, 20);
        memoryStore.devices[os] = (memoryStore.devices[os] || 0) + 1;
      }
      if (evt.device?.browser) {
        const b = String(evt.device.browser).substring(0, 20);
        memoryStore.browsers[b] = (memoryStore.browsers[b] || 0) + 1;
      }
      if (evt.device?.isPWA) {
        memoryStore.pwaCount++;
      } else {
        memoryStore.webCount++;
      }

      // Demografia Opt-in
      if (evt.event_type === 'demografia_optin' && evt.data) {
        if (!memoryStore.demografia) {
          memoryStore.demografia = {
            faixas: { '18-24': 0, '25-34': 0, '35-49': 0, '50-64': 0, '65+': 0 },
            genero: { 'Feminino': 0, 'Masculino': 0, 'Outro': 0 }
          };
        }
        const faixa = String(evt.data.faixa_etaria || '').trim();
        const gen = String(evt.data.genero || '').trim();
        if (faixa && memoryStore.demografia.faixas[faixa] !== undefined) {
          memoryStore.demografia.faixas[faixa]++;
        }
        if (gen && memoryStore.demografia.genero[gen] !== undefined) {
          memoryStore.demografia.genero[gen]++;
        }
      }

      // Geo / Cidades
      const locKey = `${decodeURIComponent(clientCity)}/${clientRegion}`.substring(0, 50);
      memoryStore.cidades[locKey] = (memoryStore.cidades[locKey] || 0) + 1;

      // Simulações de Cota
      if (evt.event_type === 'river_simulation' && evt.data?.cota_simulada) {
        memoryStore.simulacoes.push({
          cota: Number(evt.data.cota_simulada) || 0,
          delta: Number(evt.data.delta) || 0,
          timestamp: evt.timestamp || new Date().toISOString()
        });
        if (memoryStore.simulacoes.length > 200) {
          memoryStore.simulacoes.shift();
        }
      }

      // Guarda os últimos 100 eventos detalhados
      memoryStore.recentEvents.unshift({
        ...evt,
        geo: {
          city: decodeURIComponent(clientCity),
          region: clientRegion,
          country: clientCountry
        },
        server_received_at: new Date().toISOString()
      });
      if (memoryStore.recentEvents.length > 100) {
        memoryStore.recentEvents.pop();
      }
    }

    // Salva estado consolidado no store persistente
    saveAnalyticsStore(memoryStore);

    return res.status(200).json({ status: 'ok', received: sanitizedEvents.length });
  } catch (err) {
    console.error('Erro ao processar ingestão analítica:', err);
    return res.status(500).json({ error: 'Erro interno ao processar telemetria' });
  }
}
