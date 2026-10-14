import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const GraficoCotas = ({ dados, cotaCritica = 19.0 }) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Carregando dados de série temporal...
      </div>
    )
  }

  // Processar dados para o gráfico
  const dadosProcessados = dados.map(ponto => ({
    timestamp: format(new Date(ponto.timestamp), 'HH:mm', { locale: ptBR }),
    data: format(new Date(ponto.timestamp), 'dd/MM', { locale: ptBR }),
    cota: parseFloat(ponto.nivel),
    status: ponto.status,
  }))

  // Definir cores por status
  const getCorStatus = (status) => {
    switch (status) {
      case 'alagado':
        return '#7c2d12'
      case 'critica':
        return '#ef4444'
      case 'alerta':
        return '#f59e0b'
      default:
        return '#10b981'
    }
  }

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-sm">
          <p className="font-semibold text-gray-900">{data.data} {data.timestamp}</p>
          <p className="text-blue-600">
            Cota: <strong>{data.cota.toFixed(2)}m</strong>
          </p>
          <p className="text-gray-600">
            Status: <strong>{data.status.toUpperCase()}</strong>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">📈 Série Temporal de Cotas</h2>
        <p className="text-sm text-gray-600">Últimos 30 dias</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={dadosProcessados}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCota" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="data"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{ value: 'Cota (m)', angle: -90, position: 'insideLeft' }}
          />

          {/* Referência de cota crítica */}
          <ReferenceLine
            y={cotaCritica}
            stroke="#ef4444"
            strokeDasharray="5 5"
            label={{
              value: `Crítica: ${cotaCritica}m`,
              position: 'right',
              fill: '#ef4444',
              fontSize: 12,
            }}
          />

          {/* Referência de alerta */}
          <ReferenceLine
            y={cotaCritica - 2}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{
              value: `Alerta: ${(cotaCritica - 2).toFixed(1)}m`,
              position: 'right',
              fill: '#f59e0b',
              fontSize: 12,
            }}
          />

          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cota"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCota)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Estatísticas */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-gray-600">Mínima</p>
          <p className="text-lg font-bold text-blue-600">
            {Math.min(...dadosProcessados.map(d => d.cota)).toFixed(2)}m
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-gray-600">Máxima</p>
          <p className="text-lg font-bold text-blue-600">
            {Math.max(...dadosProcessados.map(d => d.cota)).toFixed(2)}m
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-gray-600">Média</p>
          <p className="text-lg font-bold text-blue-600">
            {(dadosProcessados.reduce((a, b) => a + b.cota, 0) / dadosProcessados.length).toFixed(2)}m
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-gray-600">Total de pontos</p>
          <p className="text-lg font-bold text-blue-600">
            {dadosProcessados.length}
          </p>
        </div>
      </div>
    </div>
  )
}

export default GraficoCotas
