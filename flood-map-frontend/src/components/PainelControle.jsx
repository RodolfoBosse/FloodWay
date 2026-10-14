import React, { useState } from 'react'
import { AlertCircle, Navigation2, MapPin, TrendingUp, Clock } from 'lucide-react'

const PainelControle = ({ cotaAtual, ruasAfetadas, onAbrirGoogleMaps, onAbrirWaze }) => {
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)
  const [filtroRua, setFiltroRua] = useState('')

  const ruasAbertas = ruasAfetadas?.filter(r => !r.bloqueada) || []
  const ruasBloqueadas = ruasAfetadas?.filter(r => r.bloqueada) || []

  const getIconStatus = (status) => {
    switch (status) {
      case 'alagado':
        return '🚨'
      case 'critica':
        return '⚠️'
      case 'alerta':
        return '⚡'
      default:
        return '✅'
    }
  }

  const handleAbrirRota = (latitude, longitude) => {
    // Coordenadas de exemplo do centro de Lajeado
    const origem = [-29.4669, -51.9611]
    onAbrirGoogleMaps(origem, [latitude, longitude])
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      {/* Status Geral */}
      <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Status da Cidade</h2>
          <span className="text-3xl">{getIconStatus(cotaAtual?.status)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-600">Cota Atual</p>
            <p className="text-2xl font-bold text-blue-600">
              {cotaAtual?.nivel.toFixed(2)}m
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Status</p>
            <p className={`text-lg font-bold ${
              cotaAtual?.status === 'alagado' ? 'text-red-600' :
              cotaAtual?.status === 'critica' ? 'text-red-500' :
              cotaAtual?.status === 'alerta' ? 'text-amber-500' :
              'text-green-600'
            }`}>
              {cotaAtual?.status.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-600">Crítica em</p>
            <p className="text-sm font-semibold text-gray-900">
              {(19.0 - cotaAtual?.nivel).toFixed(2)}m
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">% da Crítica</p>
            <p className="text-sm font-semibold text-gray-900">
              {((cotaAtual?.nivel / 19.0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {cotaAtual?.status !== 'normal' && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 flex gap-3 ${
          cotaAtual?.status === 'alagado' ? 'bg-red-50 border-red-500' :
          cotaAtual?.status === 'critica' ? 'bg-red-50 border-red-500' :
          'bg-amber-50 border-amber-500'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
            cotaAtual?.status === 'alagado' || cotaAtual?.status === 'critica'
              ? 'text-red-600'
              : 'text-amber-600'
          }`} />
          <div>
            <p className={`font-semibold text-sm ${
              cotaAtual?.status === 'alagado' || cotaAtual?.status === 'critica'
                ? 'text-red-900'
                : 'text-amber-900'
            }`}>
              {cotaAtual?.status === 'alagado' && 'NÍVEL CRÍTICO! Cidades em risco de alagamento.'}
              {cotaAtual?.status === 'critica' && 'ALERTA CRÍTICO: Ruas começarão a alagar em breve.'}
              {cotaAtual?.status === 'alerta' && 'ALERTA: Monitore a situação de perto.'}
            </p>
          </div>
        </div>
      )}

      {/* Estatísticas de Ruas */}
      <div className="mb-6 space-y-3">
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="text-xs text-gray-600">Ruas Abertas</p>
          <p className="text-2xl font-bold text-green-600">
            {ruasAbertas.length}
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-xs text-gray-600">Ruas Bloqueadas</p>
          <p className="text-2xl font-bold text-red-600">
            {ruasBloqueadas.length}
          </p>
        </div>
      </div>

      {/* Lista de Ruas Afetadas */}
      {ruasBloqueadas.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              Ruas Bloqueadas ({ruasBloqueadas.length})
            </h3>
            <button
              onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              {mostrarDetalhes ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {mostrarDetalhes && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-200 max-h-48 overflow-y-auto space-y-2">
              {ruasBloqueadas.map(rua => (
                <div
                  key={rua.id}
                  className="bg-white p-2 rounded border-l-2 border-red-500 text-sm"
                >
                  <p className="font-semibold text-gray-900">{rua.nome}</p>
                  <p className="text-xs text-gray-600">
                    Alt: {rua.altitude_min.toFixed(1)}-{rua.altitude_max.toFixed(1)}m
                  </p>
                  <p className="text-xs text-red-600 font-semibold">
                    Bloqueio em {rua.cota_bloqueio.toFixed(2)}m
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botões de Ação */}
      <div className="space-y-3">
        <button
          onClick={() => onAbrirGoogleMaps([-29.4669, -51.9611], [-29.4670, -51.9600])}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Navigation2 className="w-4 h-4" />
          Calcular Rota (Google Maps)
        </button>

        <button
          onClick={() => onAbrirWaze([-29.4669, -51.9611])}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
        >
          <Navigation2 className="w-4 h-4" />
          Abrir no Waze
        </button>

        <button
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg text-sm transition"
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Histórico (últimos 7 dias)
        </button>
      </div>

      {/* Info de Atualização */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          <TrendingUp className="w-3 h-3 inline mr-1" />
          Atualizado automaticamente a cada 15 minutos
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Última atualização: agora
        </p>
      </div>
    </div>
  )
}

export default PainelControle
