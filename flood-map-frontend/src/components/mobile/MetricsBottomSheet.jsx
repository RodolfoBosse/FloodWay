import React, { useState, useRef, useEffect } from "react";
import { CloudRain, MoreHorizontal } from "lucide-react";
import BannerPatrocinador from "./BannerPatrocinador";

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
          transition: isDragging ? "none" : "height 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="fixed bottom-14 left-0 right-0 bg-white rounded-t-[30px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-100 px-6 pt-2 pb-5 pointer-events-auto select-none overflow-hidden flex flex-col"
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
          className="w-full py-2 flex justify-center cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition" />
        </div>

        {/* CABEÇALHO (Lajeado RS + Clima) */}
        <div
          onClick={toggleSnap}
          className="w-full flex items-center justify-between cursor-pointer mb-3"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Lajeado RS</h2>
            {isMinimized && (
              <span className="text-xs text-gray-500 font-semibold ml-1">
                • {cotaReal ? Number(cotaReal).toFixed(2) : "--"}m ({isInundacao ? "Inundação" : "Normal"})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-700 font-medium">
              <CloudRain size={16} className="text-gray-600" />
              <span className="text-sm font-semibold">{temperatura}</span>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleSnap();
              }}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* GRID DE MÉTRICAS */}
        {!isMinimized && (
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-left pt-1">
            {/* Linha 1 */}
            <div>
              <p className="text-[12px] text-gray-500 font-medium">Cota atual</p>
              <p className="text-[22px] font-bold text-gray-900 leading-tight">
                {cotaReal ? Number(cotaReal).toFixed(2) : "13.84"}m
              </p>
            </div>

            <div>
              <p className="text-[12px] text-transparent select-none font-medium">Status</p>
              <p className={`text-[20px] font-bold leading-tight ${isInundacao ? "text-red-500" : "text-emerald-500"}`}>
                {isInundacao ? "Inundação" : "Normal"}
              </p>
            </div>

            {/* Linha 2 */}
            <div>
              <p className="text-[12px] text-gray-500 font-medium">Cota de inundação</p>
              <p className="text-base font-bold text-gray-900 leading-tight">
                {Number(cotaInundacao).toFixed(2)}m
              </p>
            </div>

            <div>
              <p className="text-[12px] text-gray-500 font-medium">Ruas bloqueadas</p>
              <p className={`text-base font-bold leading-tight ${temBloqueios && qtdBloqueios > 0 ? "text-red-500" : "text-gray-900"}`}>
                {qtdBloqueios}
              </p>
            </div>

            {/* Linha 3 */}
            <div>
              <p className="text-[12px] text-gray-500 font-medium">Sua cota</p>
              <p className="text-base font-bold text-gray-900 leading-tight">
                {typeof suaCota === "number" ? suaCota.toFixed(2) + "m" : suaCota}
              </p>
            </div>

            <div>
              <p className="text-[12px] text-gray-500 font-medium">Nível de alerta</p>
              <p className="text-base font-bold text-gray-900 leading-tight">
                {Number(cotaAlerta).toFixed(2)}m
              </p>
            </div>
          </div>
        )}

        {/* ESPAÇO DE ANÚNCIO / PATROCÍNIO REGIONAL QUANDO EXPANDIDO */}
        {isExpanded && (
          <div className="mt-4 pt-2 border-t border-gray-100 overflow-y-auto">
            <BannerPatrocinador
              titulo="Apoiador Oficial da Prevenção"
              nome="Sicredi Integração RS/MG"
              descricao="Apoiando iniciativas de prevenção e monitoramento no Vale do Taquari."
              link="https://www.sicredi.com.br"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsBottomSheet;
