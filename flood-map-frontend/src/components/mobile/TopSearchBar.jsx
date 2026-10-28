import React from "react";
import { Search, Bell, User } from "lucide-react";

const TopSearchBar = ({
  textoBusca = "",
  onBuscarClick,
  onNotifClick,
  onPerfilClick,
  usuario = null,
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
          {textoBusca || "Pesquisar rota, local, ponto..."}
        </span>
      </button>

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
