/**
 * Endpoint Serverless na Vercel: /api/analytics/stats
 * Fornece métricas consolidadas com autenticação Bearer Token e CORS restrito
 */
import { setSecureCorsHeaders } from '../_security.js';

const ADMIN_SECRET = process.env.ANALYTICS_ADMIN_KEY || 'floodway2026admin';

export default async function handler(req, res) {
  setSecureCorsHeaders(req, res, 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificação de Cybersegurança e Autenticação
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token || token !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Não autorizado. Senha de administrador inválida.' });
  }

  const store = globalThis.__floodway_analytics_store || {
    totalEvents: 0,
    pageViews: {},
    devices: { Android: 0, iOS: 0, Windows: 0, macOS: 0, Linux: 0, Outro: 0 },
    browsers: {},
    cidades: {},
    pwaCount: 0,
    webCount: 0,
    simulacoes: [],
    recentEvents: []
  };

  const totalGeral = store.totalEvents;
  const pageViews = store.pageViews;
  const devices = store.devices;
  const pwaCount = store.pwaCount;
  const webCount = store.webCount;

  // Agrupamento real de cotas simuladas pelos usuários
  const cotasRaw = store.simulacoes || [];
  const faixasCotas = [
    { faixa: '13m - 18m (Normal/Atenção)', acessos: cotasRaw.filter(s => s.cota >= 13 && s.cota < 19).length },
    { faixa: '19m - 23m (Alerta Inicial)', acessos: cotasRaw.filter(s => s.cota >= 19 && s.cota < 24).length },
    { faixa: '24m - 28m (Inundação Centro/Ponte)', acessos: cotasRaw.filter(s => s.cota >= 24 && s.cota < 29).length },
    { faixa: '29m - 36m (Nível Crítico/Maio-24)', acessos: cotasRaw.filter(s => s.cota >= 29).length }
  ];

  // Cálculo de usuários únicos estimados via client_ids distintos nos eventos recentes
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
    cotasSimuladas: faixasCotas,
    ultimosEventos: (store.recentEvents || []).slice(0, 30)
  });
}
