import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

/**
 * Componente GoogleAdBanner
 * Banner do Google AdSense recolhível / minimizável fixado acima da navegação inferior.
 * Cliente ID: ca-pub-3566074526946852
 */
export default function GoogleAdBanner({ slotId = null, className = "" }) {
  const [minimizado, setMinimizado] = useState(false);
  const adRef = useRef(null);
  const adIniciadoRef = useRef(false);

  useEffect(() => {
    if (!minimizado && !adIniciadoRef.current) {
      try {
        if (typeof window !== "undefined") {
          window.adsbygoogle = window.adsbygoogle || [];
          window.adsbygoogle.push({});
          adIniciadoRef.current = true;
        }
      } catch (err) {
        // Ignora erros de inicialização se os anúncios já estiverem preenchidos ou bloqueados
        console.debug("AdSense push:", err);
      }
    }
  }, [minimizado]);

  return (
    <div
      style={{ zIndex: 1250 }}
      className={`fixed bottom-[48px] left-0 right-0 flex flex-col items-center pointer-events-none transition-all duration-300 ${className}`}
    >
      {/* Botão de Minimizar / Expandir */}
      <div className="w-full max-w-md flex justify-end px-3">
        <button
          onClick={() => setMinimizado(!minimizado)}
          className="pointer-events-auto bg-gray-900/90 hover:bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5 rounded-t-lg shadow-md flex items-center gap-1 border border-b-0 border-gray-700/50 backdrop-blur-sm transition-all"
          title={minimizado ? "Mostrar Anúncio" : "Minimizar Anúncio"}
        >
          <span className="opacity-75">Anúncio</span>
          {minimizado ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Caixa do Anúncio */}
      <div
        className={`pointer-events-auto w-full max-w-md bg-white border-t border-gray-200 shadow-xl overflow-hidden transition-all duration-300 ${
          minimizado ? "h-0 opacity-0 py-0 border-transparent" : "h-[60px] opacity-100 flex items-center justify-center"
        }`}
      >
        {!minimizado && (
          <div ref={adRef} className="w-full h-[50px] flex items-center justify-center overflow-hidden">
            {slotId ? (
              <ins
                className="adsbygoogle"
                style={{ display: "inline-block", width: "320px", height: "50px" }}
                data-ad-client="ca-pub-3566074526946852"
                data-ad-slot={slotId}
              />
            ) : (
              /* Bloco Banner Responsivo / Auto */
              <ins
                className="adsbygoogle"
                style={{ display: "block", width: "100%", height: "50px" }}
                data-ad-client="ca-pub-3566074526946852"
                data-ad-format="horizontal"
                data-full-width-responsive="true"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
