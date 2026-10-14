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
    <div
      style={{ zIndex: 1100 }}
      className="absolute top-3 left-3 right-3 flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-gray-100 px-4 py-2.5 pointer-events-auto"
    >
      <button
        onClick={onBuscarClick}
        className="flex-1 flex items-center text-left text-gray-400 text-xs outline-none bg-transparent"
      >
        <Search size={16} className="text-gray-400 mr-2 shrink-0" />
        <span className="truncate text-gray-500 font-normal">
          {textoBusca || "Pesquisar rota, local, ponto..."}
        </span>
      </button>

      <div className="flex items-center gap-3 ml-2 shrink-0">
        <button
          onClick={onNotifClick}
          className="text-gray-700 hover:text-blue-600 p-0.5 active:scale-95 transition"
          title="Alertas e Rotas"
        >
          <Bell size={19} strokeWidth={1.8} />
        </button>

        <button
          onClick={onPerfilClick}
          className="text-gray-700 hover:text-blue-600 p-0.5 active:scale-95 transition"
          title={usuario ? usuario.nome || "Minha Conta" : "Entrar"}
        >
          <User size={19} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
};

export default TopSearchBar;
