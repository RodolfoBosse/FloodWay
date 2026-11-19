import React from 'react';
import { AlertTriangle, X, Undo2, Navigation } from 'lucide-react';
import { estimarCotaTerreno } from '../../services/locaisLajeado';

export default function AlertaSimulacaoAtiva({
  cotaSimulada,
  cotaReal,
  onResetarCota,
  onAbrirRotas,
  usuario = null,
  ruas = []
}) {
  const delta = Math.round((cotaSimulada - cotaReal) * 10) / 10;
  const isAcima = delta > 0;

  // Verifica se a residência ou algum ponto monitorado está atingido pela simulação
  let localAtingido = null;
  if (usuario?.residencia?.cota && cotaSimulada >= Number(usuario.residencia.cota)) {
    const diff = Number((cotaSimulada - usuario.residencia.cota).toFixed(1));
    localAtingido = {
      nome: 'Sua Residência',
      detalhe: `Água atingindo a cota por +${diff}m`,
      tipo: 'residencia'
    };
  } else if (Array.isArray(usuario?.pontosInteresse)) {
    const ptInundado = usuario.pontosInteresse.find((p) => {
      let cotaRealista = Number(p.cota);
      if (p.coords && Array.isArray(p.coords)) {
        const cotaGPS = estimarCotaTerreno(p.coords[0], p.coords[1], p.endereco || p.nome, ruas);
        if (cotaGPS && (isNaN(cotaRealista) || cotaRealista === 29.2 || cotaRealista === 24.0)) {
          cotaRealista = cotaGPS;
        }
      }
      return cotaRealista && cotaSimulada >= cotaRealista;
    });

    if (ptInundado) {
      let cotaRealista = Number(ptInundado.cota);
      if (ptInundado.coords && Array.isArray(ptInundado.coords)) {
        const cotaGPS = estimarCotaTerreno(ptInundado.coords[0], ptInundado.coords[1], ptInundado.endereco || ptInundado.nome, ruas);
        if (cotaGPS && (isNaN(cotaRealista) || cotaRealista === 29.2 || cotaRealista === 24.0)) {
          cotaRealista = cotaGPS;
        }
      }
      const diff = Number((cotaSimulada - cotaRealista).toFixed(1));
      localAtingido = {
        nome: ptInundado.nome,
        detalhe: `Água atingindo o local por +${diff}m`,
        tipo: 'ponto'
      };
    }
  }

  const isEmergencia = !!localAtingido;

  return (
    <div className="fixed top-16 left-3 right-3 max-w-md mx-auto z-[2400] pointer-events-auto animate-in slide-in-from-top-3 duration-300">
      <div className={`text-white backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-xl border flex items-center justify-between gap-2.5 transition-all ${
        isEmergencia
          ? "bg-rose-950/95 border-rose-600/80 ring-2 ring-rose-500/30"
          : "bg-slate-900/95 border-slate-700/80"
      }`}>
        
        {/* Ícone e Texto */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
            isEmergencia
              ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
          }`}>
            <AlertTriangle size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                isEmergencia
                  ? "bg-rose-900/80 text-rose-200 border-rose-700"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              }`}>
                {isEmergencia ? "🚨 Local Atingido" : "Simulação Ativa"}
              </span>
              <span className="font-bold text-sm text-white tabular-nums">
                {Number(cotaSimulada).toFixed(2)} m
              </span>
              {!isEmergencia && (
                <span className="text-[11px] text-amber-400 font-medium">
                  ({isAcima ? `+${delta}m` : `${delta}m`})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 leading-tight truncate mt-0.5">
              {isEmergencia
                ? `${localAtingido.nome}: ${localAtingido.detalhe}`
                : "Mancha e rotas calculando desvios sobre este nível."}
            </p>
          </div>
        </div>

        {/* Botão de Ação: Se atingido permite ir para rotas de fuga, senão restaura cota real */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isEmergencia && onAbrirRotas && (
            <button
              onClick={onAbrirRotas}
              className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white active:scale-95 text-xs font-semibold px-2 py-1.5 rounded-xl shadow-sm transition cursor-pointer"
              title="Calcular rotas de fuga imediatamente"
            >
              <Navigation size={12} strokeWidth={2.5} />
              <span>Rotas</span>
            </button>
          )}

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
