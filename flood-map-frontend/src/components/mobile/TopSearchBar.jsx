import React from "react";
import { Search, Bell, User, X } from "lucide-react";

const TopSearchBar = ({
  textoBusca = "",
  onBuscarClick,
  onNotifClick,
  onPerfilClick,
  usuario = null,
  temRotaAtiva = false,
  onLimparRota,
}) => {
  return (
    <header
      style={{ zIndex: 1200 }}
      className="fixed top-3 left-3 right-3 max-w-md mx-auto flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-200/80 px-3.5 py-1.5 pointer-events-auto transition-all"
    >
      <button
        type="button"
        onClick={onBuscarClick}
        className="flex-1 flex items-center text-left text-gray-400 text-xs outline-none bg-transparent py-0.5"
      >
        <Search size={15} className="text-gray-400 mr-2 shrink-0" />
        <span className="truncate text-gray-500 font-normal text-[11px] sm:text-xs">
          {textoBusca || (temRotaAtiva ? "Rota Ativa no Mapa" : "Pesquisar rota, local, ponto...")}
        </span>
      </button>

      {temRotaAtiva && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onLimparRota) onLimparRota();
          }}
          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-full text-[11px] font-bold active:scale-95 transition mr-1.5 shadow-sm"
          title="Apagar e remover rota do mapa"
        >
          <X size={13} strokeWidth={2.5} />
          <span>Limpar Rota</span>
        </button>
      )}

      <div className="flex items-center gap-2.5 ml-2 shrink-0 border-l border-gray-100 pl-2.5">
        <button
          type="button"
          onClick={onNotifClick}
          className="text-gray-600 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100 active:scale-95 transition"
          title="Alertas e Rotas"
        >
          <Bell size={17} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={onPerfilClick}
          className={`p-1 rounded-full active:scale-95 transition flex items-center justify-center ${
            usuario
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100 ring-1 ring-blue-300"
              : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
          }`}
          title={usuario ? usuario.nome || "Minha Conta" : "Entrar com Google ou E-mail"}
        >
          {usuario ? (
            <span className="w-4 h-4 flex items-center justify-center font-bold text-[10px] leading-none">
              {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "U"}
            </span>
          ) : (
            <User size={17} strokeWidth={2} />
          )}
        </button>
      </div>
    </header>
  );
};

export default TopSearchBar;
