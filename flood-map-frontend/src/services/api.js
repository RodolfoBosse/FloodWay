import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Adicionar interceptor para erros
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const floodAPI = {
  // Cota atual
  getCotaAtual: (cidade = 'lajeado') => 
    api.get(`/v1/cota/${cidade}/`),
  
  // Ruas
  getRuas: (cidade = 'lajeado') =>
    api.get(`/v1/ruas/`, { params: { cidade } }),
  
  getRuasAfetadas: (cidade = 'lajeado', cota = null) => {
    const params = { cidade }
    if (cota !== null) params.cota = cota
    return api.get(`/v1/ruas/afetadas/`, { params })
  },
  
  // Mapa completo
  getMapaStatus: (cidade = 'lajeado') =>
    api.get(`/v1/mapa/status/`, { params: { cidade } }),
  
  // Histórico
  getHistoricoAlagamentos: (cidade = 'lajeado', dias = 7) =>
    api.get(`/v1/historico/alagamentos/`, { params: { cidade, dias } }),
  
  // Relatório
  getRelatorioDiario: (cidade = 'lajeado', data = null) => {
    const params = { cidade }
    if (data) params.data = data
    return api.get(`/v1/relatorio/diario/`, { params })
  },
  
  // Série temporal
  getCotasTimeseries: (cidade = 'lajeado', dias = 30) =>
    api.get(`/v1/cotas/timeseries/`, { params: { cidade, dias } }),
}

export default api
