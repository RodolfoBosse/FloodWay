import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { 
  Activity, Users, Smartphone, Globe, ArrowLeft, RefreshCw, 
  ShieldCheck, MapPin, Gauge, Layers, Filter 
} from 'lucide-react';

const COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboard({ onVoltar }) {
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState(null);
  const [erro, setErro] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('visao_geral'); // visao_geral | simulacoes | eventos

  const carregarMetricas = async () => {
    setLoading(true);
    setErro(null);
    try {
      const resp = await fetch('/api/analytics/stats');
      if (!resp.ok) throw new Error('Não foi possível carregar as métricas.');
      const data = await resp.json();
      setMetricas(data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMetricas();
    // Atualiza a cada 30 segundos automaticamente
    const interval = setInterval(carregarMetricas, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Barra de Topo do Painel */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-20 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onVoltar}
              className="p-2 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white"
              title="Voltar ao portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  FloodWay Analytics & Telemetria
                </h1>
                <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Admin Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monitoramento de acessos, simulações de cota e adoção de rotas em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregarMetricas}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-xs font-semibold rounded-lg text-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>

        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* Abas */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setAbaAtiva('visao_geral')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
              abaAtiva === 'visao_geral'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Visão Geral & Dispositivos
          </button>
          <button
            onClick={() => setAbaAtiva('simulacoes')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
              abaAtiva === 'simulacoes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Comportamento & Cotas Simuladas
          </button>
          <button
            onClick={() => setAbaAtiva('eventos')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
              abaAtiva === 'eventos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Feed de Telemetria (Logs)
          </button>
        </div>

        {/* Cartões de Indicadores Chave (KPIs) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Eventos Rastreados</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                {metricas?.resumo?.totalEventos || '--'}
              </p>
              <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
                <span>↑ Em tempo real</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Usuários Únicos Estimados</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                {metricas?.resumo?.usuariosEstimados || '--'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Baseado em client_id
              </p>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Instalações PWA Ativas</span>
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                {metricas?.resumo?.pwaInstalados || '--'}
              </p>
              <p className="text-[11px] text-amber-400/90 mt-0.5">
                {metricas?.resumo?.taxaPWA || '0%'} do total de acessos
              </p>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Conformidade LGPD</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-300">
                100% Opt-in
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Banner de cookies ativo
              </p>
            </div>
          </div>

        </div>

        {/* Conteúdo da Aba: Visão Geral */}
        {abaAtiva === 'visao_geral' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gráfico 1: Acessos por Tela / Página */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg flex flex-col">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Acessos por Tela e Seção
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Distribuição de navegação entre o Portal Editorial e o Mapa Interativo
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricas?.paginas || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="nome" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="views" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Sistemas Operacionais & Dispositivos */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg flex flex-col">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Distribuição de Dispositivos (OS)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Proporção de acessos via Mobile (Android/iOS) vs Desktop (Windows/macOS)
              </p>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metricas?.dispositivos?.filter(d => d.valor > 0) || []}
                      dataKey="valor"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {(metricas?.dispositivos || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* Conteúdo da Aba: Simulações & Comportamento */}
        {abaAtiva === 'simulacoes' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    Cotas Mais Testadas no Simulador de Enchente
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Revela o nível de preocupação e cenários de cheia que os cidadãos de Lajeado estão prevenindo
                  </p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricas?.cotasSimuladas || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="faixa" type="category" stroke="#94a3b8" fontSize={11} width={180} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="acessos" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba: Eventos em Tempo Real (Logs) */}
        {abaAtiva === 'eventos' && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm sm:text-base font-bold text-white mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Feed Recente de Telemetria Anônima
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Últimas interações registradas no frontend com localização aproximada via Vercel Edge
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Horário</th>
                    <th className="py-2.5 px-3">Evento</th>
                    <th className="py-2.5 px-3">Dispositivo / App</th>
                    <th className="py-2.5 px-3">Localização (Edge)</th>
                    <th className="py-2.5 px-3">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {(metricas?.ultimosEventos && metricas.ultimosEventos.length > 0) ? (
                    metricas.ultimosEventos.map((evt, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/30 transition">
                        <td className="py-2 px-3 text-slate-400">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString('pt-BR') : '--'}
                        </td>
                        <td className="py-2 px-3 font-semibold text-blue-400">
                          {evt.event_type}
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {evt.device?.os || 'Outro'} ({evt.device?.browser || 'Web'})
                          {evt.device?.isPWA && <span className="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded">PWA</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {evt.geo ? `${evt.geo.city}/${evt.geo.region}` : 'Lajeado/RS'}
                        </td>
                        <td className="py-2 px-3 text-slate-400 truncate max-w-xs">
                          {JSON.stringify(evt.data || {})}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">
                        Nenhum evento registrado no buffer ainda nesta sessão. Os acessos ao site serão listados aqui.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
