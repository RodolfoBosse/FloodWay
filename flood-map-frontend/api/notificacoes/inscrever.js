/**
 * ENDPOINT SERVERLESS: /api/notificacoes/inscrever
 * Salva a assinatura Web Push vinculada às cotas do usuário
 */
import { setSecureCorsHeaders, checkRateLimit } from '../_security.js';
import { VAPID_PUBLIC_KEY } from '../_vapid.js';

// Memória persistida no runtime da Vercel
let assinaturasPushMemoria = global._floodwayPushSubscriptions || [];
global._floodwayPushSubscriptions = assinaturasPushMemoria;

export default async function handler(req, res) {
  setSecureCorsHeaders(req, res, 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Retorna a chave pública VAPID para o frontend
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      publicKey: VAPID_PUBLIC_KEY
    });
  }

  // POST: Registra ou atualiza a assinatura do celular do usuário
  if (req.method === 'POST') {
    if (!checkRateLimit(req, 60, 60)) {
      return res.status(429).json({ erro: 'Muitas requisições. Aguarde um instante.' });
    }

    try {
      const data = req.body || {};
      const { subscription, usuario, locais } = data;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ erro: 'Assinatura inválida (subscription ausente).' });
      }

      const emailUsuario = usuario?.email || 'anonimo@floodway.app';
      const locaisFormatados = Array.isArray(locais) ? locais : [];

      // Remove qualquer assinatura anterior do mesmo endpoint para evitar duplicação
      assinaturasPushMemoria = assinaturasPushMemoria.filter(
        (sub) => sub.endpoint !== subscription.endpoint
      );

      const novaSub = {
        endpoint: subscription.endpoint,
        subscription,
        email: emailUsuario,
        locais: locaisFormatados,
        ultimoAlertaEnviado: null,
        criadoEm: new Date().toISOString()
      };

      assinaturasPushMemoria.push(novaSub);
      global._floodwayPushSubscriptions = assinaturasPushMemoria;

      return res.status(200).json({
        status: 'sucesso',
        mensagem: 'Assinatura de alertas registrada com sucesso.',
        totalAssinantes: assinaturasPushMemoria.length
      });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
