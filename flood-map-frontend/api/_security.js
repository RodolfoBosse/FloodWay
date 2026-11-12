/**
 * Utilitário central de segurança para funções Serverless na Vercel
 * Aplica CORS restrito ao domínio oficial do FloodWay e controle de taxa (Rate Limiting)
 */

// Armazena janelas de contagem de requisições por IP na memória da instância
const rateLimitMap = new Map();

/**
 * Configura CORS seguro permitindo apenas o domínio de produção e ambientes locais de teste
 */
export function setSecureCorsHeaders(req, res, allowedMethods = 'GET,POST,OPTIONS') {
  const origin = req.headers['origin'] || '';
  const allowedOrigins = [
    'https://flood-way.vercel.app',
    'https://floodway.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ];

  // Se a origem fizer parte da lista confiável, libera o header. Caso contrário, restringe a flood-way.vercel.app
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://flood-way.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', allowedMethods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

/**
 * Rate Limiter simples em memória por IP (Token Bucket / Sliding Window)
 * @param {Request} req
 * @param {number} maxRequests - Máximo de requisições permitidas na janela
 * @param {number} windowSeconds - Duração da janela em segundos
 * @returns {boolean} true se permitido, false se exceder o limite
 */
export function checkRateLimit(req, maxRequests = 60, windowSeconds = 60) {
  // Pega o IP real provido pelo Vercel Edge Proxy
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.headers['x-real-ip'] || 
                   '127.0.0.1';

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  
  const record = rateLimitMap.get(clientIp);

  if (!record) {
    rateLimitMap.set(clientIp, { count: 1, startTime: now });
    return true;
  }

  // Se a janela de tempo expirou, reseta o contador
  if (now - record.startTime > windowMs) {
    rateLimitMap.set(clientIp, { count: 1, startTime: now });
    return true;
  }

  // Incrementa contagem dentro da janela atual
  record.count++;
  if (record.count > maxRequests) {
    return false; // Bloqueado por excesso de requisições
  }

  return true;
}
