import React from "react";
import { Compass, Route, SlidersHorizontal, BookOpen } from "lucide-react";

const BottomNavigation = ({
  abaAtiva = "mapa",
  onMapaClick,
  onRotasClick,
  onGraficosClick,
  onSimularClick,
  onInfoClick,
  isSimulando = false,
  painelRotaAberto = false,
}) => {
  return (
    <div
      style={{ zIndex: 1200 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-2 px-6 flex justify-around items-center pointer-events-auto shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
    >
      {/* 1. Mapa */}
      <button
        onClick={onMapaClick}
        className={`flex flex-col items-center gap-1 transition ${
          abaAtiva === "mapa" && !painelRotaAberto ? "text-slate-900 font-semibold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Compass size={21} strokeWidth={abaAtiva === "mapa" && !painelRotaAberto ? 2.2 : 1.7} />
        <span className="text-[11px] tracking-tight">Mapa</span>
      </button>

      {/* 2. Rotas */}
      <button
        onClick={onRotasClick}
        className={`flex flex-col items-center gap-1 transition ${
          painelRotaAberto ? "text-slate-900 font-semibold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Route size={21} strokeWidth={painelRotaAberto ? 2.2 : 1.7} />
        <span className="text-[11px] tracking-tight">Rotas</span>
      </button>

      {/* 3. Simular */}
      <button
        onClick={onSimularClick}
        className={`flex flex-col items-center gap-1 transition ${
          isSimulando ? "text-blue-600 font-semibold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <SlidersHorizontal size={21} strokeWidth={isSimulando ? 2.2 : 1.7} />
        <span className="text-[11px] tracking-tight">Simular</span>
      </button>

      {/* 4. Guia / Sobre */}
      <button
        onClick={onInfoClick}
        className={`flex flex-col items-center gap-1 transition ${
          abaAtiva === "info" ? "text-slate-900 font-semibold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <BookOpen size={21} strokeWidth={abaAtiva === "info" ? 2.2 : 1.7} />
        <span className="text-[11px] tracking-tight">Guia & Info</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
