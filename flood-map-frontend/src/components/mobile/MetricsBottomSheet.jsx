import React, { useState, useRef, useEffect } from "react";
import { CloudRain, MoreHorizontal } from "lucide-react";
import BannerPatrocinador from "./BannerPatrocinador";
import GoogleAdBlock from "./GoogleAdBlock";

const MetricsBottomSheet = ({
  cotaReal = 13.84,
  cotaInundacao = 19.0,
  cotaAlerta = 23.0,
  suaCota = 26.0,
  dadosRota = null,
  temperatura = "13°",
  onAbrirRotas,
}) => {
  // Alturas em pixels: min = 60px, mid = 245px, max = 85vh (calculado dinamicamente)
  const [currentHeight, setCurrentHeight] = useState(245);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(245);

  const isInundacao = cotaReal >= cotaInundacao;
  const temBloqueios = dadosRota?.bloqueada || isInundacao;
  const qtdBloqueios = dadosRota?.pontosBloqueio?.length || (isInundacao ? 22 : 0);

  const getMaxHeight = () => Math.round(window.innerHeight * 0.84);
  const getMidHeight = () => 245;
  const getMinHeight = () => 60;

  // Início do arrasto com o dedo ou mouse
  const handleTouchStart = (e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    startHeightRef.current = currentHeight;
    setIsDragging(true);
  };

  // Movimento de arrasto em tempo real (acompanha o dedo)
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = startYRef.current - clientY; // Arrastar para cima = delta positivo
    const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, getMinHeight()), getMaxHeight());
    setCurrentHeight(newHeight);
  };

  // Fim do arrasto (Snap automático para o estado mais próximo)
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const minH = getMinHeight();
    const midH = getMidHeight();
    const maxH = getMaxHeight();

    // Calcula qual estado está mais próximo
    const distMin = Math.abs(currentHeight - minH);
    const distMid = Math.abs(currentHeight - midH);
    const distMax = Math.abs(currentHeight - maxH);

    if (distMax <= distMid && distMax <= distMin) {
      setCurrentHeight(maxH);
    } else if (distMin <= distMid) {
      setCurrentHeight(minH);
    } else {
      setCurrentHeight(midH);
    }
  };

  // Alterna com clique caso o usuário dê apenas um toque
  const toggleSnap = () => {
    const midH = getMidHeight();
    const maxH = getMaxHeight();
    const minH = getMinHeight();

    if (currentHeight >= maxH - 20) {
      setCurrentHeight(midH);
    } else if (currentHeight >= midH - 20) {
      setCurrentHeight(maxH);
    } else {
      setCurrentHeight(midH);
    }
  };

  const isExpanded = currentHeight > 380;
  const isMinimized = currentHeight < 100;

  return (
    <div className="pointer-events-none">
      {/* BANNER VERMELHO DE BLOQUEIOS (SE HOUVER) */}
      {temBloqueios && !isMinimized && (
        <div
          style={{
            zIndex: 1150,
            bottom: `${currentHeight + 46}px`,
            transition: isDragging ? "none" : "bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onClick={onAbrirRotas}
          className="fixed left-0 right-0 pointer-events-auto bg-red-600 text-white px-5 py-2.5 rounded-t-3xl flex items-center justify-between text-xs font-semibold shadow-lg cursor-pointer"
        >
          <span className="font-medium text-white tracking-wide">Sua rota está com bloqueios</span>
          <span className="w-5 h-5 rounded-full bg-white text-red-600 flex items-center justify-center text-[11px] font-bold shadow-sm">
            {qtdBloqueios}
          </span>
        </div>
      )}

      {/* GAVETA INFERIOR (BOTTOM SHEET COM DRAG CONTÍNUO) */}
      <div
        style={{
          zIndex: 1140,
          height: `${currentHeight}px`,
          transition: isDragging ? "none" : "height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className="fixed bottom-14 left-0 right-0 bg-white/90 backdrop-blur-xl rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.1)] border-t border-white/20 px-6 pt-2 pb-5 pointer-events-auto select-none overflow-hidden flex flex-col"
      >
        {/* ÁREA DE ARRASTO (HANDLE) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onClick={toggleSnap}
          className="w-full py-3 flex justify-center cursor-grab active:cursor-grabbing touch-none"
        >
          <div className={`w-12 h-1.5 rounded-full transition-all duration-300 ${isDragging ? "bg-blue-500 w-16" : "bg-gray-300 hover:bg-gray-400"}`} />
        </div>

        {/* CABEÇALHO (Lajeado RS + Clima) */}
        <div
          onClick={toggleSnap}
          className="w-full flex items-center justify-between cursor-pointer mb-6 transition-opacity duration-300"
          style={{ opacity: isMinimized ? 0.5 : 1 }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Lajeado RS</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium bg-white/50 backdrop-blur-sm border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
              <CloudRain size={16} className="text-blue-500" />
              <span className="text-sm font-bold">{temperatura}</span>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100/50 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleSnap();
              }}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* MÉTRICAS PRINCIPAIS (ESTILO NOVO LAYOUT) */}
        {!isMinimized && (
          <div className="flex flex-col gap-y-6 pt-1">
            {/* Cota Atual em Destaque */}
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[12px] text-gray-500 font-medium mb-1">Cota atual</p>
                <p className="text-[48px] font-black text-gray-900 leading-none tracking-tighter">
                  {cotaReal ? Number(cotaReal).toFixed(2) : "13.84"}m
                </p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${isInundacao ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                {isInundacao ? "Inundação" : "Normal"}
              </div>
            </div>

            {/* BARRA DE RISCO GRADIENTE */}
            <div className="relative w-full h-3 bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 rounded-full overflow-visible">
              {/* Marcadores de Referência */}
              <div className="absolute top-5 left-[40%] text-[10px] font-bold text-gray-400">16.00m</div>
              <div className="absolute top-5 left-[60%] text-[10px] font-bold text-gray-400">19.00m</div>
              <div className="absolute top-5 right-0 text-[10px] font-bold text-gray-400">26.00m (Casa)</div>

              {/* Indicador da Cota Atual (Bolinha) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-md transition-all duration-500"
                style={{
                  left: `${Math.min(Math.max(((Number(cotaReal) - 13) / (26 - 13)) * 100, 0), 100)}%`,
                  marginLeft: '-8px'
                }}
              />
            </div>

            {/* TRENDS & STATUS */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Última hora</span>
                <span className="text-lg font-bold text-gray-900">+0,35m</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">Rio estável</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-gray-500 font-medium">Ruas bloqueadas</span>
                <span className={`text-lg font-bold ${temBloqueios ? "text-red-600" : "text-gray-900"}`}>
                  {qtdBloqueios}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ESPAÇOS DE MONETIZAÇÃO QUANDO A GAVETA FOR EXPANDIDA */}
        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-gray-100 overflow-y-auto space-y-3 pb-6">
            {/* 1. Anúncio Patrocinado Oficial (Empresas Locais / Parceiros) */}
            <BannerPatrocinador
              titulo="Apoiador Oficial da Prevenção"
              nome="Sicredi Integração RS/MG"
              descricao="Apoiando iniciativas de prevenção, reconstrução e monitoramento no Vale do Taquari."
              link="https://www.sicredi.com.br"
              iniciais="SI"
              corLogo="bg-emerald-600"
            />

            {/* 2. Bloco Google AdSense (Monetização Automática) */}
            <GoogleAdBlock
              client="ca-pub-XXXXXXXXXXXXXXXX"
              slot="1234567890"
              format="auto"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsBottomSheet;
