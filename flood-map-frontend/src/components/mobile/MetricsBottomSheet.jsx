import React, { useState } from "react";
import { CloudRain, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
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
  // 'min' = recolhido, 'mid' = padrão (foto 1 e 2), 'max' = tela quase cheia (foto 3)
  const [snap, setSnap] = useState("mid");
  const [touchStartY, setTouchStartY] = useState(null);

  const isInundacao = cotaReal >= cotaInundacao;
  const temBloqueios = dadosRota?.bloqueada || isInundacao;
  const qtdBloqueios = dadosRota?.pontosBloqueio?.length || (isInundacao ? 22 : 0);

  // Manipulação de gesto de arrasto (Swipe)
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStartY === null) return;
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (diff > 35) {
      // Arrastou para cima
      setSnap((prev) => (prev === "min" ? "mid" : "max"));
    } else if (diff < -35) {
      // Arrastou para baixo
      setSnap((prev) => (prev === "max" ? "mid" : "min"));
    }
    setTouchStartY(null);
  };

  const toggleSnap = () => {
    setSnap((prev) => (prev === "max" ? "mid" : prev === "mid" ? "max" : "mid"));
  };

  return (
    <div className="pointer-events-none">
      {/* BANNER VERMELHO DE BLOQUEIOS (SE HOUVER) */}
      {temBloqueios && snap !== "min" && (
        <div
          style={{
            zIndex: 1150,
            bottom: snap === "max" ? "calc(88vh - 8px)" : "238px",
          }}
          onClick={onAbrirRotas}
          className="fixed left-0 right-0 pointer-events-auto bg-red-600 text-white px-5 py-2.5 rounded-t-3xl flex items-center justify-between text-xs font-semibold shadow-lg transition-all duration-300 cursor-pointer"
        >
          <span className="font-medium text-white tracking-wide">Sua rota está com bloqueios</span>
          <span className="w-5 h-5 rounded-full bg-white text-red-600 flex items-center justify-center text-[11px] font-bold shadow-sm">
            {qtdBloqueios}
          </span>
        </div>
      )}

      {/* GAVETA INFERIOR (BOTTOM SHEET) */}
      <div
        style={{
          zIndex: 1140,
          transform: snap === "min" ? "translateY(calc(100% - 56px))" : "translateY(0)",
          height: snap === "max" ? "88vh" : "245px",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed bottom-14 left-0 right-0 bg-white rounded-t-[30px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-gray-100 px-6 pt-2 pb-5 pointer-events-auto select-none"
      >
        {/* PUXADOR DE ARRASTO */}
        <div
          onClick={toggleSnap}
          className="w-full py-1 flex justify-center cursor-pointer active:opacity-60"
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-2" />
        </div>

        {/* CABEÇALHO (Lajeado RS + Clima) */}
        <div
          onClick={toggleSnap}
          className="w-full flex items-center justify-between cursor-pointer mb-3"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Lajeado RS</h2>
            {snap === "min" && (
              <span className="text-xs text-gray-500 font-semibold ml-1">
                • {cotaReal ? cotaReal.toFixed(2) : "--"}m ({isInundacao ? "Inundação" : "Normal"})
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-700 font-medium">
              <CloudRain size={16} className="text-gray-600" />
              <span className="text-sm font-semibold">{temperatura}</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-1" onClick={(e) => { e.stopPropagation(); toggleSnap(); }}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* GRID DE MÉTRICAS */}
        {snap !== "min" && (
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
        {snap === "max" && (
          <div className="mt-4 pt-2 border-t border-gray-100">
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
