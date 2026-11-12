/**
 * Handler serverless na Vercel para /api/v1/perfil/salvar/
 * Com CORS restrito e validação de dados
 */
import { setSecureCorsHeaders, checkRateLimit } from './_security.js';

export default async function handler(req, res) {
  setSecureCorsHeaders(req, res, 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // Rate limit: máx 30 atualizações de perfil por minuto
    if (!checkRateLimit(req, 30, 60)) {
      return res.status(429).json({ erro: 'Muitas requisições. Aguarde um instante.' });
    }

    try {
      const data = req.body || {};
      const { email, nome, whatsapp, endereco_completo, bairro, latitude, longitude, cota_terreno } = data;

      const cota = cota_terreno && parseFloat(cota_terreno) > 0 ? parseFloat(cota_terreno) : 29.2;

      return res.status(200).json({
        status: 'sucesso',
        perfil: {
          nome: String(nome || 'Usuário').substring(0, 100),
          email: String(email || '').substring(0, 100),
          whatsapp: String(whatsapp || '').substring(0, 30),
          endereco: String(endereco_completo || '').substring(0, 200),
          bairro: String(bairro || '').substring(0, 80),
          latitude: latitude || null,
          longitude: longitude || null,
          cota_terreno: Math.round(cota * 10) / 10
        }
      });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
