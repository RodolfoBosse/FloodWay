import React from "react";
import { 
  ArrowRight, 
  MapPin, 
  Compass, 
  ShieldCheck, 
  AlertTriangle, 
  Navigation, 
  BarChart3, 
  CheckCircle2, 
  CloudRain, 
  TrendingUp, 
  Info,
  ChevronRight,
  PhoneCall,
  Map as MapIcon
} from "lucide-react";
import GoogleAdSenseBlock from "../common/GoogleAdSenseBlock";

export default function PortalEditorialPage({ 
  cotaAtual, 
  onIniciarNavegacao, 
  onAbrirPolitica, 
  onAbrirTermos,
  onAbrirAnalytics
}) {
  const nivelRio = cotaAtual?.nivel || 13.23;
  const statusRio = cotaAtual?.status || "Normal";
  const tendenciStatus = cotaAtual?.velocidade_formatada || "Estável";

  return (
    <div className="w-full min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center selection:bg-blue-600 selection:text-white" style={{ touchAction: 'auto' }}>
      
      {/* BARRA SUPERIOR CLEAN NO PADRÃO DO APP */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm font-black text-sm">
            FW
          </div>
          <div>
            <h1 className="font-extrabold text-base text-gray-900 tracking-tight leading-none">
              FloodWay
            </h1>
            <span className="text-[10px] text-gray-500 font-medium">Lajeado & Estrela / RS</span>
          </div>
        </div>

        <button
          onClick={onIniciarNavegacao}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <MapIcon size={14} />
          <span>Ver no Mapa</span>
        </button>
      </header>

      {/* CONTEÚDO PRINCIPAL (LAYOUT CLEAN, CARD COM BORDAS ARREDONDADAS E SOMBRA LEVE) */}
      <main className="w-full max-w-xl px-4 py-6 space-y-5">
        
        {/* CARD PRINCIPAL DE STATUS DO RIO (MESMO ESTILO DO METRICS BOTTOM SHEET) */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Nível do Rio Taquari
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                  {Number(nivelRio).toFixed(2)}m
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                {statusRio}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                {tendenciStatus}
              </span>
            </div>
          </div>

          {/* RÉGUA VISUAL DE COTAS */}
          <div className="pt-2">
            <div className="relative w-full h-2.5 bg-gradient-to-r from-emerald-500 via-yellow-400 via-50% via-orange-500 to-red-600 rounded-full shadow-inner">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-900 rounded-full shadow-md transition-all"
                style={{
                  left: `${Math.min(Math.max(((Number(nivelRio) - 10) / 30) * 100, 0), 100)}%`,
                  marginLeft: "-8px",
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2">
              <span>10m</span>
              <span className="text-yellow-600">19m (Atenção)</span>
              <span className="text-orange-600">24m</span>
              <span className="text-red-600">29.8m (Maio/24)</span>
              <span>40m</span>
            </div>
          </div>

          {/* BOTÃO PRINCIPAL DE ACESSO AO MAPA */}
          <div className="pt-2">
            <button
              onClick={onIniciarNavegacao}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm py-3 px-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Abrir Mapa Interativo de Ruas</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* ARTIGO EDITORIAL 1: O QUE É O FLOODWAY */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-blue-600 font-extrabold text-sm">
            <Compass size={18} />
            <span>Sobre a Plataforma</span>
          </div>
          <h2 className="text-lg font-black text-gray-900 leading-snug">
            Monitoramento de cheias e rotas de desvio pelas colinas
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            O <strong>FloodWay</strong> é um serviço de utilidade pública criado para transformar números brutos de réguas fluviométricas em decisões práticas para os moradores de Lajeado e Estrela. Ao cruzar as medições oficiais do Rio Taquari com a altimetria precisa de cada rua, o sistema calcula quais vias estão seguras e projeta caminhos livres de alagamento por vias mais altas.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="text-xs font-bold text-gray-900 block mb-1">Rotas Seguras</span>
              <p className="text-[11px] text-gray-500">
                Desvios automáticos evitando cruzamentos que atingiram cota de bloqueio.
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="text-xs font-bold text-gray-900 block mb-1">Cota por Residência</span>
              <p className="text-[11px] text-gray-500">
                Altimetria calibrada por número predial e margem de segurança ao vivo.
              </p>
            </div>
          </div>
        </section>

        {/* ANÚNCIO EDITORIAL ADSENSE PERFEITAMENTE INTEGRADO */}
        <div className="bg-white rounded-3xl p-2 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <GoogleAdSenseBlock />
        </div>

        {/* ARTIGO EDITORIAL 2: GUIA DE COTAS OFICIAIS */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 font-extrabold text-sm">
            <AlertTriangle size={18} />
            <span>Entenda as Cotas da Defesa Civil</span>
          </div>
          <h2 className="text-lg font-black text-gray-900 leading-snug">
            Níveis de referência da régua em Lajeado
          </h2>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 block">13m a 17m • Normal</span>
                <span className="text-[11px] text-blue-700">Fluxo habitual dentro da calha do rio.</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Seguro</span>
            </div>

            <div className="p-3 bg-yellow-50/60 border border-yellow-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-yellow-900 block">17,00m • Cota de Atenção</span>
                <span className="text-[11px] text-yellow-700">Equipes de socorro monitoram as cabeceiras.</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">Atenção</span>
            </div>

            <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-orange-900 block">19,00m • Cota de Alerta</span>
                <span className="text-[11px] text-orange-700">Moradores de áreas ribeirinhas iniciam preparativos.</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">Alerta</span>
            </div>

            <div className="p-3 bg-red-50/60 border border-red-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-red-900 block">19,80m+ • Início do Alagamento de Ruas</span>
                <span className="text-[11px] text-red-700">Primeiras águas atingem a Décio Martins Costa.</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Inundação</span>
            </div>
          </div>
        </section>

        {/* CONTATOS DE EMERGÊNCIA */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-gray-900 font-extrabold text-sm">
            <PhoneCall size={18} className="text-red-500" />
            <span>Telefones Úteis de Emergência</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-base font-black text-red-600 block">199</span>
              <span className="text-[10px] text-gray-500 font-semibold">Defesa Civil</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-base font-black text-red-600 block">193</span>
              <span className="text-[10px] text-gray-500 font-semibold">Bombeiros</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-base font-black text-blue-600 block">190</span>
              <span className="text-[10px] text-gray-500 font-semibold">Brigada</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-base font-black text-emerald-600 block">192</span>
              <span className="text-[10px] text-gray-500 font-semibold">SAMU</span>
            </div>
          </div>
        </section>

        {/* BOTÃO FINAL INICIAR */}
        <div className="pt-2 text-center">
          <button
            onClick={onIniciarNavegacao}
            className="w-full bg-gray-900 hover:bg-black active:scale-[0.98] text-white font-bold text-sm py-3.5 px-4 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <MapIcon size={18} />
            <span>Acessar Mapa & Rotas</span>
          </button>
        </div>

      </main>

      {/* RODAPÉ LIMPO E FORMAL */}
      <footer className="w-full border-t border-gray-200/80 bg-white py-6 px-4 mt-6 text-center text-xs text-gray-500">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3 font-semibold text-gray-600">
            <button onClick={onAbrirPolitica} className="hover:text-blue-600 underline transition cursor-pointer">
              Política de Privacidade
            </button>
            <span>•</span>
            <button onClick={onAbrirTermos} className="hover:text-blue-600 underline transition cursor-pointer">
              Termos de Uso
            </button>
            <span>•</span>
            <button onClick={onIniciarNavegacao} className="hover:text-blue-600 underline transition cursor-pointer">
              Mapa
            </button>
          </div>
          <span className="text-[11px] text-gray-400">
            © 2026 FloodWay • Plataforma de Prevenção e Rotas no Vale do Taquari
          </span>
        </div>
      </footer>
    </div>
  );
}
