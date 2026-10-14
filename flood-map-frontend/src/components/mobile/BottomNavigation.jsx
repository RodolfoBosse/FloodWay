import React from "react";
import { Home, Milestone, LineChart, Sliders } from "lucide-react";

const BottomNavigation = ({
  abaAtiva = "mapa",
  onMapaClick,
  onRotasClick,
  onGraficosClick,
  onSimularClick,
  isSimulando = false,
  painelRotaAberto = false,
}) => {
  return (
    <div
      style={{ zIndex: 1200 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-1.5 px-4 flex justify-around items-center pointer-events-auto shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
    >
      {/* 1. Mapa */}
      <button
        onClick={onMapaClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition ${
          abaAtiva === "mapa" && !painelRotaAberto ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-700"
        }`}
      >
        <Home size={20} strokeWidth={abaAtiva === "mapa" && !painelRotaAberto ? 2.2 : 1.6} />
        <span className="text-[10px]">Mapa</span>
      </button>

      {/* 2. Rotas */}
      <button
        onClick={onRotasClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition ${
          painelRotaAberto ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-700"
        }`}
      >
        <Milestone size={20} strokeWidth={painelRotaAberto ? 2.2 : 1.6} />
        <span className="text-[10px]">Rotas</span>
      </button>

      {/* 3. Gráficos */}
      <button
        onClick={onGraficosClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition ${
          abaAtiva === "graficos" ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-700"
        }`}
      >
        <LineChart size={20} strokeWidth={abaAtiva === "graficos" ? 2.2 : 1.6} />
        <span className="text-[10px]">Gráficos</span>
      </button>

      {/* 4. Simular */}
      <button
        onClick={onSimularClick}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 transition ${
          isSimulando ? "text-amber-600 font-bold" : "text-gray-400 hover:text-gray-700"
        }`}
      >
        <Sliders size={20} strokeWidth={isSimulando ? 2.2 : 1.6} />
        <span className="text-[10px]">Simular</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
