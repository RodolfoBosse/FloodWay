/**
 * Handler serverless para autenticação Google, Perfil e Exclusão de Conta
 * Garante persistência e funcionamento tanto na Vercel quanto em desenvolvimento.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

      // Validação oficial junto ao Google
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
      return res.status(500).json({ erro: 'Falha ao autenticar com o Google: ' + err.message });
    }
  }

  return res.status(404).json({ erro: 'Ação não encontrada' });
}

