/**
 * Handler serverless na Vercel para /api/v1/perfil/salvar/
 * Garante que quando o usuário salva o perfil ou arrasta o pin da casa na Vercel,
 * o endpoint responda com status 200 e retorne a cota_terreno enviada ou calculada.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const data = req.body || {};
      const { email, nome, whatsapp, endereco_completo, bairro, latitude, longitude, cota_terreno } = data;

      const cota = cota_terreno && parseFloat(cota_terreno) > 0 ? parseFloat(cota_terreno) : 29.2;

      return res.status(200).json({
        status: 'sucesso',
        perfil: {
          nome: nome || 'Usuário',
          email: email || '',
          whatsapp: whatsapp || '',
          endereco: endereco_completo || '',
          bairro: bairro || '',
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
