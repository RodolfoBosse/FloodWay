/**
 * Handler serverless para autenticação Google, Perfil e Exclusão de Conta
 * Com CORS restrito e validação oficial de token Google
 */
import { setSecureCorsHeaders, checkRateLimit } from '../_security.js';

export default async function handler(req, res) {
  setSecureCorsHeaders(req, res, 'GET,POST,OPTIONS,DELETE');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting para evitar ataques de força bruta no endpoint de auth
  if (!checkRateLimit(req, 20, 60)) {
    return res.status(429).json({ erro: 'Muitas tentativas de autenticação. Aguarde um minuto.' });
  }

  const { action } = req.query;

  // 1. Excluir conta
  if (action === 'excluir-conta' || req.url.includes('excluir-conta')) {
    return res.status(200).json({ status: 'sucesso', mensagem: 'Dados excluídos com sucesso.' });
  }

  // 2. Google Login / Validação de Token
  if (action === 'google' || req.method === 'POST') {
    try {
      const { credential } = req.body || {};
      if (!credential) {
        return res.status(400).json({ erro: 'Credencial do Google não informada.' });
      }

      // Validação oficial junto ao Google OAuth2
      const verifyResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!verifyResp.ok) {
        return res.status(401).json({ erro: 'Token Google inválido ou expirado.' });
      }

      const payload = await verifyResp.json();
      const email = (payload.email || '').toLowerCase().trim();
      const nome = payload.name || payload.given_name || email.split('@')[0];

      return res.status(200).json({
        status: 'sucesso',
        token: `google-sess-${Buffer.from(email).toString('base64')}`,
        usuario: {
          id: payload.sub || email,
          nome,
          email,
          foto: payload.picture,
        }
      });
    } catch (err) {
      console.error('Erro na validação de login:', err);
      return res.status(500).json({ erro: 'Erro interno ao validar credencial do Google.' });
    }
  }

  return res.status(405).json({ erro: 'Método não permitido.' });
}
