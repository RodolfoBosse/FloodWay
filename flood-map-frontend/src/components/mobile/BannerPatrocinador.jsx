import React from 'react';

/**
 * Componente modular para Anúncios / Patrocínios Locais.
 * Pode ser configurado com:
 * 1. Patrocínio direto (ex: Sicredi, Imec, Unimed, empresas de Lajeado e região)
 * 2. Google AdSense (basta inserir o código / clientId)
 */
export default function BannerPatrocinador({
  titulo = "Apoiador Oficial da Prevenção",
  nome = "Empresa Parceira do Vale",
  descricao = "Juntos pela segurança e reconstrução de Lajeado e região.",
  link = "#",
  tag = "Patrocinado",
}) {
  return (
    <div className="w-full bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200/80 rounded-2xl p-3 my-3 shadow-sm select-none">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{titulo}</span>
        <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-semibold">{tag}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Placeholder do Logo da Empresa ou Imagem de Anúncio */}
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-sm">
          SP
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-gray-900 truncate">{nome}</h4>
          <p className="text-[11px] text-gray-500 leading-tight line-clamp-2">{descricao}</p>
        </div>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 shrink-0"
        >
          Conhecer
        </a>
      </div>
    </div>
  );
}

