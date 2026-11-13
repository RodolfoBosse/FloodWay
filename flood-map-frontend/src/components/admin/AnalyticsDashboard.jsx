import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';
import { 
  Activity, Users, Smartphone, ArrowLeft, RefreshCw, 
  ShieldCheck, Gauge, Layers, Lock, KeyRound, AlertCircle
} from 'lucide-react';

const COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const ADMIN_STORAGE_KEY = 'fw_adm_token_session';

export default function AnalyticsDashboard({ onVoltar }) {
  const [autenticado, setAutenticado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [metricas, setMetricas] = useState(null);
  const [erro, setErro] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('visao_geral'); // visao_geral | simulacoes | eventos

  // Verifica se já estava logado na sessão do navegador
  useEffect(() => {
    const tokenSalvo = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (tokenSalvo) {
      setAutenticado(true);
      carregarMetricas(tokenSalvo);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!senhaInput.trim()) return;
    setLoadingLogin(true);
    setErroLogin('');

    try {
      const resp = await fetch('/api/analytics/stats', {
        headers: {
          'Authorization': `Bearer ${senhaInput.trim()}`
        }
      });

      if (resp.status === 401) {
        throw new Error('Senha de administrador incorreta.');
      }

      if (!resp.ok) {
        throw new Error('Erro ao autenticar. Tente novamente.');
      }

      const data = await resp.json();
      sessionStorage.setItem(ADMIN_STORAGE_KEY, senhaInput.trim());
      setAutenticado(true);
      setMetricas(data);
    } catch (err) {
      setErroLogin(err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  const carregarMetricas = async (customToken) => {
    const token = customToken || sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (!token) return;

    setLoading(true);
    setErro(null);
    try {
      const resp = await fetch('/api/analytics/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (resp.status === 401) {
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
        setAutenticado(false);
        throw new Error('Sessão expirada. Digite a senha novamente.');
      }
      if (!resp.ok) throw new Error('Não foi possível carregar as métricas.');
      const data = await resp.json();
      setMetricas(data);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Se não estiver autenticado, exibe a tela de bloqueio com chave secreta
  if (!autenticado) {
    return (
      <div 
        className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Painel Reservado</h2>
            <p className="text-xs text-slate-400">
              Digite a chave mestre de administrador para acessar a telemetria e o tráfego do FloodWay.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="••••••••••••"
                  autoFocus
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-600 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {erroLogin && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroLogin}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loadingLogin || !senhaInput}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loadingLogin ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Desbloquear Painel'}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-800/80">
            <button
              onClick={onVoltar}
              className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao FloodWay</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white"
      style={{ touchAction: 'auto' }}
    >
      
      {/* Barra de Topo do Painel */}
      <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/60 sticky top-0 z-20 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onVoltar}
              className="p-2 hover:bg-slate-700 rounded-xl transition text-slate-300 hover:text-white cursor-pointer"
              title="Voltar ao mapa"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  FloodWay Analytics & Telemetria
                </h1>
                <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Admin Restrito
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monitoramento de acessos, simulações de cota e adoção de rotas em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => carregarMetricas()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-xs font-semibold rounded-lg text-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem(ADMIN_STORAGE_KEY);
                setAutenticado(false);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition cursor-pointer"
              title="Bloquear painel"
            >
              Bloquear
            </button>
          </div>

        </div>
      </header>

      {/* Conteúdo Principal com Rolagem Livre */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* Abas */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setAbaAtiva('visao_geral')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              abaAtiva === 'visao_geral'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Visão Geral & Dispositivos
          </button>
          <button
            onClick={() => setAbaAtiva('simulacoes')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              abaAtiva === 'simulacoes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Comportamento & Cotas Simuladas
          </button>
          <button
            onClick={() => setAbaAtiva('eventos')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
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
              <span className="text-xs font-medium">Usuários Estimados</span>
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
