/**
 * Handler serverless para Rotas Favoritas do Usuário na Vercel
 * Salvar, Listar e Excluir rotas salvas
 */
let _rotasMemoria = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, email, id } = req.query;

  // 1. Listar rotas por e-mail
  if (req.method === 'GET' || action === 'listar') {
    const userEmail = (email || '').toLowerCase().trim();
    if (!userEmail) {
      return res.status(200).json({ rotas: [] });
    }
    const filtradas = _rotasMemoria.filter(r => r.email === userEmail);
    return res.status(200).json({ rotas: filtradas });
  }

  // 2. Salvar rota
  if (req.method === 'POST' && (action === 'salvar' || !action)) {
    try {
      const data = req.body || {};
      const { email: rEmail, nome, origem_nome, origem_coords, destino_nome, destino_coords, distancia, tempo } = data;

      if (!rEmail) {
        return res.status(400).json({ erro: 'E-mail é obrigatório' });
      }

      const novaRota = {
        id: Date.now(),
        email: rEmail.toLowerCase().trim(),
        nome: nome || 'Minha Rota',
        origem_nome: origem_nome || '',
        origem_coords: origem_coords || null,
        destino_nome: destino_nome || '',
        destino_coords: destino_coords || null,
        distancia: distancia || '0',
        tempo: tempo || 5,
        criado_em: new Date().toISOString()
      };

      _rotasMemoria.unshift(novaRota);
      return res.status(200).json({ status: 'sucesso', id: novaRota.id, rota: novaRota });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // 3. Excluir rota
  if (action === 'excluir' || req.method === 'DELETE') {
    const idNum = parseInt(id, 10);
    _rotasMemoria = _rotasMemoria.filter(r => r.id !== idNum);
    return res.status(200).json({ status: 'sucesso' });
  }

  return res.status(404).json({ erro: 'Ação não encontrada' });
}
