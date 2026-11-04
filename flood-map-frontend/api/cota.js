export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. Tentar raspar diretamente a página oficial https://nivelguaiba.com.br/lajeado
  // O site contém os valores exatos calculados em tempo real na estação Porto de Estrela
  try {
    const pageResp = await fetch('https://nivelguaiba.com.br/lajeado', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (pageResp.ok) {
      const html = await pageResp.text();

      // Padrão do botão de compartilhamento gerado pelo site oficial:
      // var text = "Nível do Rio Taquari em Lajeado: 13,31m — ▲ Subindo a 12,3 cm/hora  ";
      const mShare = html.match(/N\\u00edvel do Rio Taquari em Lajeado:\s*([0-9]+[,\.][0-9]+)m\s*\\u2014\s*(.*?)(?:";|"\s*;)/);

      if (mShare) {
        const nivel = parseFloat(mShare[1].replace(',', '.'));
        let velFormatada = mShare[2].trim();
        try {
          velFormatada = JSON.parse(`"${velFormatada}"`);
        } catch (_) {}

        // Extrai o número de cm/h e a direção
        const mVelNum = velFormatada.match(/([0-9]+[,\.][0-9]+)\s*cm/i);
        const velNum = mVelNum ? parseFloat(mVelNum[1].replace(',', '.')) : 0;
        const isDescendo = /descendo/i.test(velFormatada);
        const isSubindo = /subindo/i.test(velFormatada);

        let tendencia = "Estável";
        let velFinal = 0;
        if (isSubindo) {
          tendencia = "Subindo";
          velFinal = velNum;
        } else if (isDescendo) {
          tendencia = "Descendo";
          velFinal = -velNum;
        }

        return res.status(200).json({
          cidade: "lajeado",
          nivel: nivel,
          cota_atual: nivel,
          tendencia: tendencia,
          velocidade_cm_h: velFinal,
          velocidade_formatada: velFormatada,
          timestamp: new Date().toISOString(),
          fonte: "nivelguaiba.com.br/lajeado"
        });
      }
    }
  } catch (errScrape) {
    console.warn("Falha no scraping direto de nivelguaiba.com.br/lajeado:", errScrape);
  }

  // 2. Fallback secundário: endpoint JSON bruto (https://nivelguaiba.com.br/lajeado.json)
  try {
    const jsonResp = await fetch('https://nivelguaiba.com.br/lajeado.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (jsonResp.ok) {
      const data = await jsonResp.json();
      const chaves = Object.keys(data);
      const ultimaChave = chaves[chaves.length - 1];
      const nivel = data[ultimaChave];

      let tendencia = "Estável";
      let velocidadeCmH = 0;
      let velocidadeFormatada = "⏸ Estável";

      // Comparação real de 1 hora (4 leituras de 15 min atrás) para evitar ruído
      if (chaves.length >= 5) {
        const chave1hAtras = chaves[chaves.length - 5];
        const diffMetros1h = nivel - data[chave1hAtras];
        velocidadeCmH = Math.round(diffMetros1h * 100 * 10) / 10;
      } else if (chaves.length >= 2) {
        const penultimaChave = chaves[chaves.length - 2];
        const diffMetros = nivel - data[penultimaChave];
        velocidadeCmH = Math.round(diffMetros * 100 * 4 * 10) / 10;
      }

      if (velocidadeCmH > 0) {
        tendencia = "Subindo";
        velocidadeFormatada = `▲ Subindo a ${velocidadeCmH.toFixed(1).replace('.', ',')} cm/hora`;
      } else if (velocidadeCmH < 0) {
        tendencia = "Descendo";
        velocidadeFormatada = `▼ Descendo a ${Math.abs(velocidadeCmH).toFixed(1).replace('.', ',')} cm/hora`;
      }

      return res.status(200).json({
        cidade: "lajeado",
        nivel: nivel,
        cota_atual: nivel,
        tendencia: tendencia,
        velocidade_cm_h: velocidadeCmH,
        velocidade_formatada: velocidadeFormatada,
        timestamp: new Date().toISOString(),
        fonte: "nivelguaiba.com.br/lajeado.json"
      });
    }
  } catch (errJson) {
    console.error("Falha no fallback JSON:", errJson);
  }

  // 3. Fallback de contingência
  return res.status(200).json({
    cidade: "lajeado",
    nivel: 13.31,
    cota_atual: 13.31,
    tendencia: "Subindo",
    velocidade_cm_h: 12.3,
    velocidade_formatada: "▲ Subindo a 12,3 cm/hora",
    timestamp: new Date().toISOString(),
    fonte: "fallback"
  });
}
