import React from 'react';
import { FlaskConical, AlertTriangle, Bell, Sliders, X, CheckCircle, Navigation } from 'lucide-react';

export default function ModoTesteBar({
  cotaSimulada,
  setCotaSimulada,
  onDispararNotificacaoTeste,
  onDesativar,
  onAbrirRotasTeste
}) {
  return (
    <div className="fixed top-14 left-2 right-2 max-w-md mx-auto z-[2500] pointer-events-auto animate-in slide-in-from-top-3 duration-300">
      <div className="bg-slate-900/95 text-white border border-amber-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs">
            <FlaskConical size={16} className="text-amber-400 animate-pulse" />
            <span>Laboratório de Testes & Simulação</span>
          </div>

          <button
            onClick={onDesativar}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            title="Sair do modo de teste"
          >
            <X size={15} />
          </button>
        </div>

        {/* Régua Rápida de Teste */}
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Cota Forçada no Mapa:</span>
            <span className="font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
              {Number(cotaSimulada).toFixed(1)}m
            </span>
          </div>

          {/* Botões rápidos de cenários de emergência */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={() => setCotaSimulada(13.2)}
              className={`py-1 px-1 rounded-lg text-[10px] font-bold transition ${
                cotaSimulada < 18 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              13.2m (Normal)
            </button>
            <button
              onClick={() => setCotaSimulada(19.0)}
              className={`py-1 px-1 rounded-lg text-[10px] font-bold transition ${
                cotaSimulada >= 18 && cotaSimulada < 23 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              19m (Atenção)
            </button>
            <button
              onClick={() => setCotaSimulada(24.5)}
              className={`py-1 px-1 rounded-lg text-[10px] font-bold transition ${
                cotaSimulada >= 23 && cotaSimulada < 29 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              24.5m (Centro)
            </button>
            <button
              onClick={() => setCotaSimulada(29.8)}
              className={`py-1 px-1 rounded-lg text-[10px] font-bold transition ${
                cotaSimulada >= 29 ? 'bg-red-600 text-white shadow-sm shadow-red-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              29.8m (Maio/24)
            </button>
          </div>
        </div>

        {/* Ações de Teste de Notificações e Rotas */}
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5">
          <button
            onClick={onDispararNotificacaoTeste}
            className="flex-1 py-1.5 px-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 shadow transition active:scale-95 cursor-pointer"
          >
            <Bell size={13} />
            <span>Disparar Notificação Celular</span>
          </button>

          {onAbrirRotasTeste && (
            <button
              onClick={onAbrirRotasTeste}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-xl flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              <Navigation size={12} />
              <span>Testar Rotas</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
