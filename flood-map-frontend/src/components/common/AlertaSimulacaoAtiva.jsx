import React from 'react';
import { AlertTriangle, X, Undo2 } from 'lucide-react';

export default function AlertaSimulacaoAtiva({
  cotaSimulada,
  cotaReal,
  onResetarCota,
  onAbrirRotas
}) {
  const delta = Math.round((cotaSimulada - cotaReal) * 10) / 10;
  const isAcima = delta > 0;

  return (
    <div className="fixed top-16 left-3 right-3 max-w-md mx-auto z-[2400] pointer-events-auto animate-in slide-in-from-top-3 duration-300">
      <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-slate-700/80 flex items-center justify-between gap-2.5">
        
        {/* Ícone e Texto */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <AlertTriangle size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                Simulação Ativa
              </span>
              <span className="font-bold text-sm text-white tabular-nums">
                {Number(cotaSimulada).toFixed(2)} m
              </span>
              <span className="text-[11px] text-amber-400 font-medium">
                ({isAcima ? `+${delta}m` : `${delta}m`} sobre o rio)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight truncate">
              Mancha e rotas calculando desvios sobre este nível.
            </p>
          </div>
        </div>

        {/* Botão de Restaurar Cota Real */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onResetarCota}
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-900 active:scale-95 text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-sm transition cursor-pointer"
            title="Voltar para a cota oficial do Rio Taquari"
          >
            <Undo2 size={13} strokeWidth={2} />
            <span>Ao Vivo</span>
          </button>
        </div>

      </div>
    </div>
  );
}
