function fetchWithTimeout(url, headers = {}, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', ...headers } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        text: () => Promise.resolve(data)
      }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Timeout de ${timeoutMs}ms ao conectar em ${url}`));
    });
  });
}

function calcularVelocidadeDeltaT(data) {
  const chaves = Object.keys(data).sort();
  if (chaves.length < 2) return null;

  const ultimaChave = chaves[chaves.length - 1];
  const penultimaChave = chaves[chaves.length - 2];

  const nivelAtual = Number(data[ultimaChave]);
  const nivelAnterior = Number(data[penultimaChave]);

  // Formato: "YYYY-MM-DD HH:mm"
  const tAtual = new Date(ultimaChave.replace(' ', 'T') + ':00-03:00').getTime();
  const tAnterior = new Date(penultimaChave.replace(' ', 'T') + ':00-03:00').getTime();

  const diffHoras = (tAtual - tAnterior) / (1000 * 60 * 60);
  if (diffHoras <= 0) return null;

  const diffCm = (nivelAtual - nivelAnterior) * 100;

  // Se o intervalo entre medições for superior a 3 horas, a velocidade instantânea não é válida
  if (diffHoras > 3.0) {
    return {
      nivel: nivelAtual,
      velocidade_cm_h: 0,
      velocidade_formatada: "⏸ Sem leitura recente",
      tendencia: "Estável",
      intervalo_horas: Math.round(diffHoras * 10) / 10,
      data_leitura: ultimaChave
    };
  }

  const velCmHora = Math.round((diffCm / diffHoras) * 10) / 10;
  let tendencia = "Estável";
  let formatada = "⏸ Estável";

  if (velCmHora > 0.5) {
    tendencia = "Subindo";
    formatada = `▲ Subindo a ${velCmHora.toFixed(1).replace('.', ',')} cm/hora`;
  } else if (velCmHora < -0.5) {
    tendencia = "Descendo";
    formatada = `▼ Descendo a ${Math.abs(velCmHora).toFixed(1).replace('.', ',')} cm/hora`;
  }

  return {
    nivel: nivelAtual,
    velocidade_cm_h: velCmHora,
    velocidade_formatada: formatada,
    tendencia,
    intervalo_horas: Math.round(diffHoras * 10) / 10,
    data_leitura: ultimaChave
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const errosDebug = [];
  try {
    const pageResp = await fetchWithTimeout('https://nivelguaiba.com.br/lajeado', {}, 3500);
    if (pageResp.ok) {
      const html = await pageResp.text();

      // Extrair var text de compartilhamento
      const mText = html.match(/var text\s*=\s*(".*?");/);
      let textDecoded = null;
      if (mText) {
        try {
          textDecoded = JSON.parse(mText[1]);
        } catch (_) {}
      }

      // Extrair dataModified do Schema.org para identificar hora real da medição
      let dataModified = null;
      const sSchema = html.indexOf('{"@context":"https://schema.org"');
      if (sSchema !== -1) {
        const eSchema = html.indexOf('</script>', sSchema);
        if (eSchema !== -1) {
          try {
            const schemaDoc = JSON.parse(html.slice(sSchema, eSchema));
            const datasetItem = schemaDoc['@graph']?.find(x => x['@id'] && x['@id'].includes('#dataset'));
            if (datasetItem?.dateModified) {
              dataModified = datasetItem.dateModified;
            }
          } catch (_) {}
        }
      }

      if (textDecoded) {
        // Extrai o nível em metros
        const mNivel = textDecoded.match(/([0-9]+[,\.][0-9]+)\s*m/i);
        if (mNivel) {
          const nivel = parseFloat(mNivel[1].replace(',', '.'));
          const isStale = /sem leitura/i.test(textDecoded) || /atrasad/i.test(textDecoded);

          // Extrai velocidade se estiver presente no texto
          const mVelNum = textDecoded.match(/([0-9]+[,\.][0-9]+)\s*cm/i);
          const velNum = mVelNum ? parseFloat(mVelNum[1].replace(',', '.')) : 0;
          const isDescendo = /descendo/i.test(textDecoded);
          const isSubindo = /subindo/i.test(textDecoded);

          let tendencia = "Estável";
          let velFinal = 0;
          let velFormatada = isStale ? "⏸ Sem leitura recente" : "⏸ Estável";

          if (!isStale) {
            if (isSubindo) {
              tendencia = "Subindo";
              velFinal = velNum;
              velFormatada = `▲ Subindo a ${velNum.toFixed(1).replace('.', ',')} cm/hora`;
            } else if (isDescendo) {
              tendencia = "Descendo";
              velFinal = -velNum;
              velFormatada = `▼ Descendo a ${velNum.toFixed(1).replace('.', ',')} cm/hora`;
            }
          }

          // Idade da leitura em minutos
          let minutosAtras = null;
          if (dataModified) {
            minutosAtras = Math.max(0, Math.round((Date.now() - new Date(dataModified).getTime()) / 60000));
          }

          return res.status(200).json({
            cidade: "lajeado",
            nivel,
            cota_atual: nivel,
            tendencia,
            velocidade_cm_h: velFinal,
            velocidade_formatada: velFormatada,
            timestamp: new Date().toISOString(),
            data_leitura: dataModified,
            minutos_atras: minutosAtras,
            estacao_offline: isStale || (minutosAtras !== null && minutosAtras > 120),
            fonte: "nivelguaiba.com.br/lajeado"
          });
        }
      }
    }
  } catch (errScrape) {
    errosDebug.push(`Scrape: ${errScrape.message}`);
    console.warn("Falha no scraping HTML:", errScrape.message);
  }

  // 2. Fallback: API Oficial ANA (Estação 86879300 - Porto Fluvial de Estrela)
  try {
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const ano = now.getFullYear();
    const dataStr = `${dia}/${mes}/${ano}`;

    const urlAna = `https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=${dataStr}&dataFim=${dataStr}`;
    const anaResp = await fetchWithTimeout(urlAna, {}, 3500);

    if (anaResp.ok) {
      const xml = await anaResp.text();
      const niveis = xml.match(/<Nivel>([0-9\.]+)<\/Nivel>/g);
      const horas = xml.match(/<DataHora>([^<]+)<\/DataHora>/g);

      if (niveis && horas && niveis.length > 0) {
        const nivelCm = parseFloat(niveis[0].replace(/<\/?Nivel>/g, ''));
        const dataHora = horas[0].replace(/<\/?DataHora>/g, '').trim();
        const nivelMetros = nivelCm / 100;

        let velCmH = 0;
        let tendencia = "Estável";
        let velFormatada = "⏸ Estável";

        if (niveis.length >= 2) {
          const nivelAnteriorCm = parseFloat(niveis[1].replace(/<\/?Nivel>/g, ''));
          const dataHoraAnterior = horas[1].replace(/<\/?DataHora>/g, '').trim();
          const t0 = new Date(dataHoraAnterior.replace(' ', 'T') + ':00-03:00').getTime();
          const t1 = new Date(dataHora.replace(' ', 'T') + ':00-03:00').getTime();
          const diffH = (t1 - t0) / (1000 * 60 * 60);

          if (diffH > 0 && diffH <= 3.0) {
            velCmH = Math.round(((nivelCm - nivelAnteriorCm) / diffH) * 10) / 10;
            if (velCmH > 0.5) {
              tendencia = "Subindo";
              velFormatada = `▲ Subindo a ${velCmH.toFixed(1).replace('.', ',')} cm/hora`;
            } else if (velCmH < -0.5) {
              tendencia = "Descendo";
              velFormatada = `▼ Descendo a ${Math.abs(velCmH).toFixed(1).replace('.', ',')} cm/hora`;
            }
          }
        }

        const tLeitura = new Date(dataHora.replace(' ', 'T') + ':00-03:00').getTime();
        const minutosAtras = Math.max(0, Math.round((Date.now() - tLeitura) / 60000));

        return res.status(200).json({
          cidade: "lajeado",
          nivel: nivelMetros,
          cota_atual: nivelMetros,
          tendencia,
          velocidade_cm_h: velCmH,
          velocidade_formatada: velFormatada,
          timestamp: new Date().toISOString(),
          data_leitura: dataHora,
          minutos_atras: minutosAtras,
          estacao_offline: minutosAtras > 120,
          fonte: "telemetria.ana.gov.br (86879300)"
        });
      }
    }
  } catch (errAna) {
    errosDebug.push(`ANA: ${errAna.message}`);
    console.warn("Falha na consulta oficial ANA:", errAna.message);
  }

  // 3. Fallback: JSON Histórico (lajeado.json) com validação delta-t real
  try {
    const jsonResp = await fetchWithTimeout('https://nivelguaiba.com.br/lajeado.json', {}, 3000);
    if (jsonResp.ok) {
      const data = JSON.parse(await jsonResp.text());
      const calc = calcularVelocidadeDeltaT(data);
      if (calc) {
        const tLeitura = new Date(calc.data_leitura.replace(' ', 'T') + ':00-03:00').getTime();
        const minutosAtras = Math.max(0, Math.round((Date.now() - tLeitura) / 60000));

        return res.status(200).json({
          cidade: "lajeado",
          nivel: calc.nivel,
          cota_atual: calc.nivel,
          tendencia: calc.tendencia,
          velocidade_cm_h: calc.velocidade_cm_h,
          velocidade_formatada: calc.velocidade_formatada,
          timestamp: new Date().toISOString(),
          data_leitura: calc.data_leitura,
          minutos_atras: minutosAtras,
          estacao_offline: minutosAtras > 120,
          fonte: "nivelguaiba.com.br/lajeado.json"
        });
      }
    }
  } catch (errJson) {
    errosDebug.push(`JSON: ${errJson.message}`);
    console.warn("Falha no JSON secundário:", errJson.message);
  }

  // 4. Contingência final segura
  return res.status(200).json({
    cidade: "lajeado",
    nivel: 13.46,
    cota_atual: 13.46,
    tendencia: "Estável",
    velocidade_cm_h: 0,
    velocidade_formatada: "⏸ Sem leitura recente",
    timestamp: new Date().toISOString(),
    data_leitura: null,
    minutos_atras: null,
    estacao_offline: true,
    fonte: "contingencia",
    erros_debug: errosDebug
  });
}
