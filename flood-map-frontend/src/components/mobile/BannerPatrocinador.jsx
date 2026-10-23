import React from 'react';

/**
 * Componente para Anúncios Patrocinados Diretos (Parceiros Locais / Regionais)
 * Perfeito para empresas de Lajeado e Vale do Taquari (Unimed, Sicredi, Imec, Construtoras, etc.)
 */
export default function BannerPatrocinador({
  titulo = "Apoiador Oficial da Prevenção",
  nome = "Sicredi Integração RS/MG",
  descricao = "Apoiando iniciativas de prevenção, reconstrução e monitoramento no Vale do Taquari.",
  link = "https://www.sicredi.com.br",
  logoUrl = null,
  iniciais = "SI",
  corLogo = "bg-emerald-600",
  tag = "Parceiro Oficial",
}) {
  return (
    <div className="w-full bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/50 border border-emerald-200/80 rounded-2xl p-3.5 my-2.5 shadow-xs select-none transition hover:border-emerald-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px]">🤝</span>
          <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wide">
            {titulo}
          </span>
        </div>
        <span className="text-[9px] bg-emerald-100/80 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
          {tag}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Logo da Empresa */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={nome}
            className="w-11 h-11 rounded-xl object-contain bg-white border border-gray-100 p-1 shrink-0 shadow-xs"
          />
        ) : (
          <div className={`w-11 h-11 rounded-xl ${corLogo} text-white font-black flex items-center justify-center shrink-0 shadow-xs text-sm tracking-wider`}>
            {iniciais}
          </div>
        )}

        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs font-bold text-gray-900 truncate leading-tight">{nome}</h4>
          <p className="text-[11px] text-gray-600 leading-snug line-clamp-2 mt-0.5">
            {descricao}
          </p>
        </div>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-xs transition shrink-0"
        >
          Visitar
        </a>
      </div>
    </div>
  );
}
