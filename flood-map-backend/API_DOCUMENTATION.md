# 📚 API Documentation - Mapa de Enchentes

Documentação completa dos endpoints REST do backend Django.

**Base URL**: `http://localhost:8000/api` (desenvolvimento)

---

## 📋 Índice de Endpoints

1. [Cotas](#cotas)
2. [Ruas](#ruas)
3. [Status do Mapa](#status-do-mapa)
4. [Histórico](#histórico)
5. [Relatórios](#relatórios)
6. [Séries Temporais](#séries-temporais)

---

## Cotas

### GET `/v1/cota/[cidade]/`

Retorna o nível atual do rio para uma cidade.

**Parâmetros de Rota:**
- `cidade` (string): Nome da cidade. Default: `lajeado`

**Exemplos de Request:**
```bash
# Lajeado
curl http://localhost:8000/api/v1/cota/lajeado/

# Usando default
curl http://localhost:8000/api/v1/cota/
```

**Resposta (200 OK):**
```json
{
  "cidade": "lajeado",
  "nivel": 14.21,
  "status": "normal",
  "timestamp": "2026-09-29T00:30:15.123456Z",
  "fonte": "nivelguaiba",
  "cota_critica": 19.0,
  "percentual_critica": 74.79,
  "ruas_bloqueadas_count": 0
}
```

**Campos de Resposta:**
- `cidade` (string): Nome da cidade
- `nivel` (float): Nível do rio em metros
- `status` (string): Estado atual (`normal`, `alerta`, `critica`, `alagado`)
- `timestamp` (datetime): Data/hora da medição
- `fonte` (string): Fonte dos dados (`nivelguaiba`, `manual`)
- `cota_critica` (float): Nível crítico (19.0m)
- `percentual_critica` (float): Percentual da cota crítica
- `ruas_bloqueadas_count` (int): Quantidade de ruas bloqueadas

**Códigos de Status:**
- `200`: Sucesso
- `404`: Cidade não encontrada

---

## Ruas

### GET `/v1/ruas/`

Retorna lista completa de ruas cadastradas.

**Parâmetros de Query:**
- `cidade` (string, optional): Filtrar por cidade. Default: `lajeado`

**Exemplos de Request:**
```bash
curl http://localhost:8000/api/v1/ruas/?cidade=lajeado
```

**Resposta (200 OK):**
```json
{
  "cidade": "lajeado",
  "cota_atual": 14.21,
  "ruas": [
    {
      "id": 1,
      "cidade": "lajeado",
      "nome": "Rua Getúlio Vargas",
      "latitude_inicio": -29.4669,
      "longitude_inicio": -51.9611,
      "latitude_fim": -29.4670,
      "longitude_fim": -51.9580,
      "altitude_min": 12.5,
      "altitude_max": 14.2,
      "cota_bloqueio": 14.5,
      "descricao": "Rua principal do centro",
      "ativa": true,
      "bloqueada": false
    },
    ...
  ],
  "total": 8
}
```

**Campos de Resposta:**
- `id` (int): ID único da rua
- `nome` (string): Nome da rua
- `latitude_inicio`, `longitude_inicio`: Coordenadas de início
- `latitude_fim`, `longitude_fim`: Coordenadas de fim
- `altitude_min` (float): Altitude mínima em metros
- `altitude_max` (float): Altitude máxima em metros
- `cota_bloqueio` (float): Cota do rio que bloqueia a rua
- `descricao` (string): Descrição da rua
- `ativa` (boolean): Se a rua está ativa no sistema
- `bloqueada` (boolean): Se está bloqueada pela cota atual

---

### GET `/v1/ruas/afetadas/`

Retorna apenas as ruas bloqueadas para uma cota específica.

**Parâmetros de Query:**
- `cidade` (string, optional): Filtrar por cidade. Default: `lajeado`
- `cota` (float, optional): Cota para verificação. Se não informado, usa a atual

**Exemplos de Request:**
```bash
# Usar cota atual
curl http://localhost:8000/api/v1/ruas/afetadas/?cidade=lajeado

# Usar cota específica (simular)
curl "http://localhost:8000/api/v1/ruas/afetadas/?cidade=lajeado&cota=15.5"
```

**Resposta (200 OK):**
```json
{
  "cidade": "lajeado",
  "cota_atual": 14.21,
  "ruas_bloqueadas": [
    {
      "id": 4,
      "nome": "Rua 7 de Setembro",
      "altitude_min": 11.8,
      "altitude_max": 13.5,
      "cota_bloqueio": 13.8,
      "bloqueada": true,
      ...
    }
  ],
  "total_bloqueadas": 2,
  "total_ruas": 8,
  "percentual_bloqueado": 25.0
}
```

---

## Status do Mapa

### GET `/v1/mapa/status/`

Retorna status completo do mapa: cotas + ruas + configuração.

**Parâmetros de Query:**
- `cidade` (string, optional): Default: `lajeado`

**Exemplos de Request:**
```bash
curl http://localhost:8000/api/v1/mapa/status/?cidade=lajeado
```

**Resposta (200 OK):**
```json
{
  "cota_atual": {
    "cidade": "lajeado",
    "nivel": 14.21,
    "status": "normal",
    "timestamp": "2026-09-29T00:30:15.123456Z",
    "fonte": "nivelguaiba",
    "cota_critica": 19.0,
    "percentual_critica": 74.79,
    "ruas_bloqueadas_count": 2
  },
  "ruas": [
    { /* objetos de rua */ },
    ...
  ],
  "config": {
    "cidade": "LAJEADO",
    "cota_critica": 19.0,
    "cota_min": 3.0,
    "cota_max": 25.0,
    "centro": [-29.4669, -51.9611],
    "bounds": {
      "sw": [-29.4865, -51.9872],
      "ne": [-29.4010, -51.8795]
    },
    "zoom_padrao": 14
  }
}
```

---

## Histórico

### GET `/v1/historico/alagamentos/`

Retorna histórico de alagamentos (quando ruas ficaram/abriram).

**Parâmetros de Query:**
- `cidade` (string, optional): Default: `lajeado`
- `dias` (int, optional): Últimos N dias. Default: `7`

**Exemplos de Request:**
```bash
# Últimos 7 dias
curl http://localhost:8000/api/v1/historico/alagamentos/?cidade=lajeado

# Últimos 30 dias
curl "http://localhost:8000/api/v1/historico/alagamentos/?cidade=lajeado&dias=30"
```

**Resposta (200 OK):**
```json
{
  "cidade": "lajeado",
  "periodo_dias": 7,
  "data_limite": "2026-09-22T00:30:00Z",
  "historico": [
    {
      "id": 1,
      "rua_nome": "Rua 7 de Setembro",
      "rua_id": 4,
      "cota_inicio": 15.2,
      "timestamp_bloqueio": "2026-09-28T14:30:00Z",
      "timestamp_reabertura": "2026-09-28T18:45:00Z",
      "duracao_minutos": 255
    },
    ...
  ],
  "total_eventos": 5,
  "duracao_media_minutos": 420
}
```

**Campos de Resposta:**
- `rua_nome` (string): Nome da rua
- `cota_inicio` (float): Cota quando começou o alagamento
- `timestamp_bloqueio` (datetime): Quando a rua foi bloqueada
- `timestamp_reabertura` (datetime, nullable): Quando reaabriu
- `duracao_minutos` (int, nullable): Duração total em minutos

---

## Relatórios

### GET `/v1/relatorio/diario/`

Retorna relatório diário de cotas e alagamentos.

**Parâmetros de Query:**
- `cidade` (string, optional): Default: `lajeado`
- `data` (string, optional): Data em formato YYYY-MM-DD. Default: hoje

**Exemplos de Request:**
```bash
# Hoje
curl http://localhost:8000/api/v1/relatorio/diario/?cidade=lajeado

# Data específica
curl "http://localhost:8000/api/v1/relatorio/diario/?cidade=lajeado&data=2026-09-28"
```

**Resposta (200 OK):**
```json
{
  "data": "2026-09-29",
  "cidade": "lajeado",
  "cotas": {
    "minima": 13.85,
    "maxima": 15.42,
    "media": 14.58,
    "total_observacoes": 96
  },
  "alagamentos": {
    "total_eventos": 3,
    "duracao_media_minutos": 245
  },
  "ruas_mais_afetadas": [
    {
      "rua__nome": "Rua 7 de Setembro",
      "total": 2
    },
    {
      "rua__nome": "Avenida Taquari",
      "total": 1
    }
  ]
}
```

---

## Séries Temporais

### GET `/v1/cotas/timeseries/`

Retorna série temporal de cotas para gráficos.

**Parâmetros de Query:**
- `cidade` (string, optional): Default: `lajeado`
- `dias` (int, optional): Últimos N dias. Default: `30`

**Exemplos de Request:**
```bash
# Últimos 30 dias
curl http://localhost:8000/api/v1/cotas/timeseries/?cidade=lajeado

# Últimos 7 dias
curl "http://localhost:8000/api/v1/cotas/timeseries/?cidade=lajeado&dias=7"
```

**Resposta (200 OK):**
```json
{
  "cidade": "lajeado",
  "periodo_dias": 30,
  "data_inicio": "2026-08-30T00:30:00Z",
  "data_fim": "2026-09-29T00:30:00Z",
  "cotas": [
    {
      "timestamp": "2026-08-30T00:15:00Z",
      "nivel": 13.42,
      "status": "normal"
    },
    {
      "timestamp": "2026-08-30T00:30:00Z",
      "nivel": 13.44,
      "status": "normal"
    },
    ...
  ],
  "total_pontos": 1440
}
```

---

## Tratamento de Erros

### Erro 400 - Bad Request
```json
{
  "erro": "Cota deve ser um número"
}
```

### Erro 404 - Not Found
```json
{
  "erro": "Nenhuma cota encontrada para lajeado"
}
```

### Erro 500 - Server Error
```json
{
  "erro": "Erro interno do servidor"
}
```

---

## Autenticação

Atualmente, a API **não requer autenticação** (aberta).

Para adicionar autenticação no futuro:
```python
# Em settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

---

## Rate Limiting

Atualmente, **sem limite de requisições**.

Para adicionar rate limiting:
```python
# Em settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
    }
}
```

---

## CORS

Configurado para aceitar requisições de:
- `http://localhost:3000`
- `http://localhost:5173`
- Ajustar em `settings.py`: `CORS_ALLOWED_ORIGINS`

---

## Exemplo de Integração (JavaScript)

```javascript
const API_BASE = 'http://localhost:8000/api'

// Carregar cota atual
async function carregarCota() {
  const response = await fetch(`${API_BASE}/v1/cota/lajeado/`)
  const data = await response.json()
  console.log(`Cota: ${data.nivel}m (${data.status})`)
  return data
}

// Carregar ruas afetadas
async function carregarRuasAfetadas(cota = null) {
  let url = `${API_BASE}/v1/ruas/afetadas/?cidade=lajeado`
  if (cota) url += `&cota=${cota}`
  
  const response = await fetch(url)
  const data = await response.json()
  console.log(`Ruas bloqueadas: ${data.total_bloqueadas}/${data.total_ruas}`)
  return data
}

// Carregar status completo
async function carregarMapaCompleto() {
  const response = await fetch(`${API_BASE}/v1/mapa/status/?cidade=lajeado`)
  const data = await response.json()
  return data
}

// Carregar série temporal
async function carregarGrafico(dias = 30) {
  const response = await fetch(`${API_BASE}/v1/cotas/timeseries/?cidade=lajeado&dias=${dias}`)
  const data = await response.json()
  console.log(`${data.total_pontos} pontos no gráfico`)
  return data
}
```

---

## Versioning

API usa versionamento em URL: `/v1/`, `/v2/`, etc.

Versão atual: **v1**

---

## Changelog

### v1.0.0 (2026-09-29)
- ✅ Endpoint de cota atual
- ✅ Endpoint de ruas
- ✅ Endpoint de ruas afetadas
- ✅ Endpoint de status do mapa
- ✅ Endpoint de histórico
- ✅ Endpoint de relatório diário
- ✅ Endpoint de série temporal

### v1.1.0 (Planejado)
- 🔄 Autenticação por token
- 🔄 Rate limiting
- 🔄 WebSocket para atualizações em tempo real
- 🔄 Documentação interativa (Swagger)

---

## Suporte

Para dúvidas ou bugs, abra uma issue no repositório.
