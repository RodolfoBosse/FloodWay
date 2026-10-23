import React, { useEffect } from 'react';

/**
 * Componente para renderizar blocos do Google AdSense
 * Suporta formatos responsivos padrão: banner horizontal (display), in-feed ou fluido.
 */
export default function GoogleAdBlock({
  client = "ca-pub-XXXXXXXXXXXXXXXX", // Substitua pelo seu ID AdSense quando aprovado
  slot = "1234567890",              // ID do bloco criado no AdSense
  format = "auto",
  responsive = "true",
  className = "",
}) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      // Ignora erro em desenvolvimento/localhost ou bloqueador de anúncios
    }
  }, []);

  return (
    <div className={`w-full text-center my-3 overflow-hidden ${className}`}>
      <span className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1 font-semibold">
        Publicidade
      </span>

      {/* Bloco Oficial do Google AdSense */}
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: "60px", background: "#f8fafc", borderRadius: "12px" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
