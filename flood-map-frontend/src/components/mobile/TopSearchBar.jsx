import React from "react";
import { Search, Bell, User, X, Navigation } from "lucide-react";

const TopSearchBar = ({
  textoBusca = "",
  onBuscarClick,
  onNotifClick,
  onPerfilClick,
  onGpsClick,
  obtendoGPS = false,
  usuario = null,
  temRotaAtiva = false,
  onLimparRota,
}) => {
  return (
    <header
      style={{ zIndex: 1200 }}
      className="fixed top-3 left-3 right-3 max-w-md mx-auto flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.08)] border border-slate-200/80 px-3.5 py-2 pointer-events-auto transition-all"
    >
      <button
        type="button"
        onClick={onBuscarClick}
        className="flex-1 flex items-center text-left text-slate-400 text-xs outline-none bg-transparent py-0.5"
      >
        <Search size={16} className="text-slate-400 mr-2.5 shrink-0" strokeWidth={1.8} />
        <span className="truncate text-slate-600 font-medium text-xs">
          {textoBusca || (temRotaAtiva ? "Rota Ativa no Mapa" : "Para onde deseja ir?")}
        </span>
      </button>

      {temRotaAtiva && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onLimparRota) onLimparRota();
          }}
          className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl text-xs font-semibold active:scale-95 transition mr-1.5 shadow-sm"
          title="Encerrar navegação e limpar trajeto"
        >
          <X size={13} strokeWidth={2.2} />
          <span>Encerrar</span>
        </button>
      )}

      <div className="flex items-center gap-1.5 ml-1.5 shrink-0 border-l border-slate-200 pl-2">
        {onGpsClick && (
          <button
            type="button"
            onClick={onGpsClick}
            disabled={obtendoGPS}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-95 ${
              obtendoGPS
                ? "bg-blue-50 text-blue-600 animate-spin"
                : "text-slate-600 hover:text-blue-600 hover:bg-slate-100 bg-slate-50"
            }`}
            title="Minha Localização GPS"
          >
            <Navigation size={16} strokeWidth={1.8} className={obtendoGPS ? "animate-spin" : "transform rotate-45"} />
          </button>
        )}

        <button
          type="button"
          onClick={onNotifClick}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-slate-100 active:scale-95 transition"
          title="Alertas e Notificações"
        >
          <Bell size={16} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={onPerfilClick}
          className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition ${
            usuario
              ? "bg-slate-900 text-white font-semibold text-xs shadow-sm"
              : "text-slate-600 hover:text-blue-600 hover:bg-slate-100 bg-slate-50"
          }`}
          title={usuario ? usuario.nome || "Minha Conta" : "Entrar com Google ou E-mail"}
        >
          {usuario ? (
            <span>{usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}</span>
          ) : (
            <User size={16} strokeWidth={1.8} />
          )}
        </button>
      </div>
    </header>
  );
};

export default TopSearchBar;
