/**
 * Utilitário de persistência leve para analytics na Vercel
 * Garante que os dados sobrevivam entre diferentes invocações serverless
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

const STORAGE_PATH = path.join(os.tmpdir(), 'floodway_analytics_v1.json');

const INITIAL_STORE = {
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

export function getAnalyticsStore() {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const content = fs.readFileSync(STORAGE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (!parsed.demografia) {
        parsed.demografia = { ...INITIAL_STORE.demografia };
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Erro ao ler store temporário:', err);
  }

  // Fallback para memória global
  if (!globalThis.__floodway_analytics_store) {
    globalThis.__floodway_analytics_store = JSON.parse(JSON.stringify(INITIAL_STORE));
  }
  return globalThis.__floodway_analytics_store;
}

export function saveAnalyticsStore(data) {
  try {
    globalThis.__floodway_analytics_store = data;
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data), 'utf8');
  } catch (err) {
    console.warn('Erro ao salvar store temporário:', err);
  }
}
