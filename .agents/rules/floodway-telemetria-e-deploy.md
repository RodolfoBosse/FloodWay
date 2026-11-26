---
trigger: model_decision
description: Diretrizes de telemetria, fontes diretas de dados meteorológicos/hidrológicos e runtime ESM da Vercel no projeto FloodWay.
---

# Regras de Telemetria, Clima e Serverless (FloodWay)

1. **Priorizar Fontes Oficiais Diretas:**
   - Sempre buscar dados meteorológicos, de satélite, radar e alertas diretamente das fontes primárias (ex: **Open-Meteo**, **NOAA GOES-19**, **INMET**, **Defesa Civil RS**, **ANA HidroWeb**), evitando depender de agregadores terceiros quando houver endpoint ou link oficial direto.

2. **Runtime ESM nas Funções Serverless da Vercel (`flood-map-frontend/api/*.js`):**
   - O projeto frontend utiliza ES Modules (`"type": "module"`).
   - **NUNCA** usar `require(...)` dentro de `flood-map-frontend/api/*.js` (causa `ReferenceError: require is not defined` em produção na Vercel).
   - Usar sempre `fetch` nativo com `AbortController` para timeouts.

3. **Cálculo de Velocidade do Rio ($\Delta t$ Real) e Proteção contra Dados Defasados:**
   - Nunca assumir intervalos fixos (como 15 minutos / multiplicador `× 4`) entre leituras telemétricas. Calcular sempre usando a diferença real de timestamps em horas.
   - Se o intervalo entre leituras for superior a 3 horas, ou a última leitura tiver mais de 2 horas de atraso, ou a taxa calculada for fisicamente anômala ($\vert v \vert > 25\text{ cm/h}$ com nível $< 18\text{ m}$), neutralizar a velocidade e exibir alerta de **sem leitura recente / sinal instável**.
