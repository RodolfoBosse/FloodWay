export default async function handler(req, res) {
  // Configurar CORS para permitir que qualquer client acesse
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const response = await fetch('https://nivelguaiba.com.br/lajeado.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const chaves = Object.keys(data);
      const ultimaChave = chaves[chaves.length - 1];
      const nivel = data[ultimaChave];

      // Determinar tendência comparando as últimas medições
      let tendencia = "Estável";
      let velocidadeCmH = 0;
      let velocidadeFormatada = "⏸ Estável";

      if (chaves.length >= 2) {
        const penultimaChave = chaves[chaves.length - 2];
        const diffMetros = nivel - data[penultimaChave];
        // Medições a cada 15 min -> 4x para cm/h
        velocidadeCmH = Math.round(diffMetros * 100 * 4 * 10) / 10;
        if (velocidadeCmH > 0) {
          tendencia = "Subindo";
          velocidadeFormatada = `▲ Subindo a ${velocidadeCmH.toFixed(1)} cm/hora`;
        } else if (velocidadeCmH < 0) {
          tendencia = "Descendo";
          velocidadeFormatada = `▼ Descendo a ${Math.abs(velocidadeCmH).toFixed(1)} cm/hora`;
        }
      }

      return res.status(200).json({
        cidade: "lajeado",
        nivel: nivel,
        cota_atual: nivel,
        tendencia: tendencia,
        velocidade_cm_h: velocidadeCmH,
        velocidade_formatada: velocidadeFormatada,
        timestamp: new Date().toISOString(),
        fonte: "nivelguaiba.com.br"
      });
    }

    throw new Error('Falha ao obter lajeado.json');
  } catch (err) {
    // Fallback de contingência
    return res.status(200).json({
      cidade: "lajeado",
      nivel: 12.86,
      cota_atual: 12.86,
      tendencia: "Subindo",
      velocidade_cm_h: 0.8,
      velocidade_formatada: "▲ Subindo a 0,8 cm/hora",
      timestamp: new Date().toISOString(),
      fonte: "fallback"
    });
  }
}
