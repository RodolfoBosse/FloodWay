/**
 * Handler serverless para Rotas Favoritas do Usuário na Vercel
 * Com CORS restrito e sanitização
 */
import { setSecureCorsHeaders, checkRateLimit } from './_security.js';

let _rotasMemoria = [];

export default async function handler(req, res) {
  setSecureCorsHeaders(req, res, 'GET,POST,OPTIONS,DELETE');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate Limiting: máx 40 requisições de rotas por minuto
  if (!checkRateLimit(req, 40, 60)) {
    return res.status(429).json({ erro: 'Muitas requisições. Aguarde um instante.' });
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
        email: String(rEmail).toLowerCase().trim().substring(0, 100),
        nome: String(nome || 'Minha Rota').substring(0, 80),
        origem_nome: String(origem_nome || '').substring(0, 150),
        origem_coords: origem_coords || null,
        destino_nome: String(destino_nome || '').substring(0, 150),
        destino_coords: destino_coords || null,
        distancia: String(distancia || '0').substring(0, 20),
        tempo: Number(tempo) || 5,
        criado_em: new Date().toISOString()
      };

      _rotasMemoria.push(novaRota);
      if (_rotasMemoria.length > 300) {
        _rotasMemoria.shift();
      }

      return res.status(201).json({ status: 'sucesso', rota: novaRota });
    } catch (err) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // 3. Excluir rota
  if (req.method === 'DELETE' || action === 'excluir') {
    const rotaId = parseInt(id, 10);
    _rotasMemoria = _rotasMemoria.filter(r => r.id !== rotaId);
    return res.status(200).json({ status: 'sucesso', mensagem: 'Rota removida' });
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}
