import React from "react";

/**
 * Componente GoogleAdSenseBlock
 * Durante a fase de aprovação de domínio pelo Google AdSense, as tags manuais <ins>
 * sem slot aprovado não devem ser renderizadas (pois geram erro de bloco vazio e tela sem conteúdo).
 * O Google AdSense opera nesta fase exclusivamente via script no <head> com Anúncios Automáticos (Auto Ads).
 * Uma vez aprovado o site e criados blocos de anúncio manuais com data-ad-slot, este componente
 * renderizará o bloco específico.
 */
export default function GoogleAdSenseBlock({ slotId = null, format = "auto", responsive = true, className = "" }) {
  if (!slotId) {
    return null;
  }

  return (
    <div className={`my-6 p-3 bg-gray-50/80 rounded-xl border border-gray-200 text-center overflow-hidden ${className}`}>
      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-2">Publicidade</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3566074526946852"
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
