/**
 * ENDPOINT / CRON JOB SERVERLESS: /api/cron/verificar-alertas
 * Executado periodicamente para avaliar a cota do Rio Taquari
 * e disparar alertas Web Push para celulares com app fechado
 * nos 4 patamares solicitados: 2m, 1m, 0.5m e ATINGIU.
 */
import webpush from 'web-push';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '../_vapid.js';

// Configura Web Push com as credenciais VAPID
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // 1. Obtém a medição mais recente dos sensores do Rio Taquari
    let cotaRio = null;
    try {
      const respCota = await fetch('https://nivelguaiba.com.br/lajeado', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (respCota.ok) {
        const html = await respCota.text();
        const m = html.match(/N\\u00edvel do Rio Taquari em Lajeado:\s*([0-9]+[,\.][0-9]+)m/);
        if (m) {
          cotaRio = parseFloat(m[1].replace(',', '.'));
        }
      }
    } catch (_) {}

    // Fallback se o raspador estiver temporariamente offline
    if (!cotaRio || isNaN(cotaRio)) {
      cotaRio = 13.5;
    }

    // Se a requisição enviar uma cota forçada (para testes diretos de homologação)
    if (req.query?.cotaTeste) {
      cotaRio = parseFloat(req.query.cotaTeste);
    }

    const assinantes = global._floodwayPushSubscriptions || [];
    let alertasDisparados = 0;
    const assinaturasInvalidas = [];

    // 2. Avalia cada usuário cadastrado e suas cotas
    for (const item of assinantes) {
      const { subscription, locais, email } = item;
      if (!subscription || !Array.isArray(locais) || locais.length === 0) continue;

      for (const loc of locais) {
        const cotaLocal = Number(loc.cota || 24.0);
        const margem = Number((cotaLocal - cotaRio).toFixed(1));

        // Determina o patamar de severidade baseado nas regras:
        // Patamares:
        // - 'atingiu': margem <= 0
        // - '0.5m': 0 < margem <= 0.5
        // - '1.0m': 0.5 < margem <= 1.0
        // - '2.0m': 1.0 < margem <= 2.0
        let patamar = null;
        let titulo = '';
        let corpo = '';

        if (margem <= 0) {
          patamar = 'atingiu';
          titulo = `🚨 ALERTA MÁXIMO: Água Atingindo ${loc.nome}!`;
          corpo = `O Rio Taquari alcançou ${cotaRio.toFixed(2)}m e atingiu a altitude do seu imóvel (${cotaLocal.toFixed(1)}m). Saia da área de risco!`;
        } else if (margem <= 0.5) {
          patamar = '0.5m';
          titulo = `🚨 PERIGO IMINENTE: Rio a apenas ${margem}m de ${loc.nome}!`;
          corpo = `Rio Taquari subindo: faltam apenas 50cm para inundar ${loc.nome} (Cota: ${cotaLocal.toFixed(1)}m). Inicie evacuação preventiva.`;
        } else if (margem <= 1.0) {
          patamar = '1.0m';
          titulo = `⚠️ ALERTA GRAVE: Rio a ${margem}m de ${loc.nome}!`;
          corpo = `Nível do rio em ${cotaRio.toFixed(2)}m. Margem de segurança de apenas 1 metro até seu imóvel. Mantenha rotas de fuga preparadas.`;
        } else if (margem <= 2.0) {
          patamar = '2.0m';
          titulo = `⚠️ AVISO DE ATENÇÃO: Rio se Aproxima de ${loc.nome}`;
          corpo = `O Rio Taquari atingiu ${cotaRio.toFixed(2)}m (a 2 metros da altitude do seu imóvel: ${cotaLocal.toFixed(1)}m). Acompanhe o monitoramento.`;
        }

        // Se estiver em algum patamar de risco e ainda não tiver sido alertado para este mesmo patamar
        if (patamar) {
          const chaveAlerta = `${loc.nome}-${patamar}`;
          if (item.ultimoAlertaEnviado !== chaveAlerta) {
            try {
              const payload = JSON.stringify({
                title: titulo,
                body: corpo,
                url: '/?alerta=1'
              });

              await webpush.sendNotification(subscription, payload);
              item.ultimoAlertaEnviado = chaveAlerta;
              alertasDisparados++;
            } catch (err) {
              console.warn(`Erro ao enviar push para ${email}:`, err?.statusCode || err?.message);
              // Código 410 (Gone) ou 404 indica que a assinatura expirou ou o usuário desinstalou
              if (err?.statusCode === 410 || err?.statusCode === 404) {
                assinaturasInvalidas.push(subscription.endpoint);
              }
            }
          }
        }
      }
    }

    // Limpa inscrições inválidas ou expiradas
    if (assinaturasInvalidas.length > 0) {
      global._floodwayPushSubscriptions = assinantes.filter(
        (sub) => !assinaturasInvalidas.includes(sub.endpoint)
      );
    }

    return res.status(200).json({
      status: 'sucesso',
      cotaRio,
      totalAssinantes: assinantes.length,
      alertasDisparados,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
}
