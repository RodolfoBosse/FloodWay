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
      <div className="bg-amber-500/95 text-white backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border border-amber-400 flex items-center justify-between gap-2.5">
        
        {/* Ícone e Texto */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wide bg-black/25 px-1.5 py-0.5 rounded text-amber-100">
                Simulação Ativa
              </span>
              <span className="font-extrabold text-sm text-white">
                {Number(cotaSimulada).toFixed(2)}m
              </span>
              <span className="text-[10px] text-amber-100 font-semibold">
                ({isAcima ? `+${delta}m` : `${delta}m`} sobre o rio real)
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-50 leading-tight truncate">
              Ruas e rotas calculando desvios sobre esta cota de teste.
            </p>
          </div>
        </div>

        {/* Botão de Restaurar Cota Real */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onResetarCota}
            className="flex items-center gap-1 bg-white text-amber-900 hover:bg-amber-50 active:scale-95 text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-sm transition cursor-pointer"
            title="Voltar para a cota oficial do Rio Taquari"
          >
            <Undo2 size={13} strokeWidth={2.5} />
            <span>Voltar ao Vivo</span>
          </button>
        </div>

      </div>
    </div>
  );
}
