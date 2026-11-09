import React from "react";
import { 
  ArrowRight, 
  Map, 
  Waves, 
  Compass, 
  ShieldCheck, 
  AlertTriangle, 
  Navigation, 
  BarChart3, 
  BookOpen, 
  CheckCircle2, 
  FileText, 
  Lock, 
  ExternalLink 
} from "lucide-react";
import GoogleAdSenseBlock from "../common/GoogleAdSenseBlock";

export default function PortalEditorialPage({ 
  cotaAtual, 
  onIniciarNavegacao, 
  onAbrirPolitica, 
  onAbrirTermos 
}) {
  const nivelRio = cotaAtual?.nivel || 13.24;
  const statusRio = cotaAtual?.status || "Normal";
  const tendenciStatus = cotaAtual?.tendencia || "Estável";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center overflow-y-auto selection:bg-blue-600 selection:text-white">
      {/* CABEÇALHO HERO COM IDENTIDADE OFICIAL */}
      <header className="w-full bg-gradient-to-b from-blue-950 via-slate-900 to-slate-900 border-b border-slate-800/80 px-4 pt-8 pb-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 shadow-xs">
          <Waves size={14} className="animate-pulse" />
          <span>Monitor Hidrológico do Vale do Taquari • Lajeado e Estrela / RS</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl leading-tight">
          Prevenção de Inundações & <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Rotas Seguras</span> em Tempo Real
        </h1>

        <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
          O <strong>FloodWay</strong> analisa a telemetria hidrológica do Rio Taquari cruzada com a altimetria precisa de cada rua, calculando rotas seguras de desvio pelas colinas e avisos preventivos para sua residência.
        </p>

        {/* CARTÃO DE STATUS DO RIO EM DESTAQUE */}
        <div className="mt-6 w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Nível Atual do Rio Taquari</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-cyan-400">{Number(nivelRio).toFixed(2)}m</span>
              <span className="text-xs text-slate-400 font-medium">({tendenciStatus})</span>
            </div>
            <span className="text-xs text-slate-300 block mt-1">Cota normal: 13,00m • Alerta: 19,00m</span>
          </div>

          <div className="text-right">
            <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {statusRio}
            </span>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL DE ENTRADA NO MAPA */}
        <div className="mt-7 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
          <button
            onClick={onIniciarNavegacao}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-base py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/25 active:scale-98 transition transform cursor-pointer"
          >
            <Map size={22} />
            <span>Abrir Mapa Interativo & Rotas</span>
            <ArrowRight size={20} />
          </button>
        </div>
        <span className="text-[11px] text-slate-400 mt-2 block">
          Acesso livre e gratuito para toda a comunidade
        </span>
      </header>

      {/* BLOCO EDITORIAL DE ALTO VALOR (ADSENSE COMPLIANT) */}
      <main className="w-full max-w-4xl px-4 py-8 space-y-10">
        
        {/* ARTIGO 1: COMO FUNCIONA O SISTEMA */}
        <section className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-cyan-400">
            <Compass size={24} />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Como o FloodWay calcula o risco de inundação?
            </h2>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Diferente de consultas manuais de réguas pluviométricas, o FloodWay mapeia trecho a trecho as vias de Lajeado e Estrela. Quando o nível do Rio Taquari sobe ou entra em projeção de enchente, o algoritmo identifica as vias que atingiram sua <em>cota de bloqueio</em> e remove-as do grafo de navegação, sugerindo caminhos de fuga alternativos por bairros e colinas mais elevadas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="text-blue-400 font-black text-lg flex items-center gap-1.5 mb-1">
                <Navigation size={18} /> Rotas pelas Colinas
              </div>
              <p className="text-xs text-slate-400">
                Desvios calculados por vias de cumeada acima de 30m, 40m e 50m para garantir tráfego sem represamento.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="text-amber-400 font-black text-lg flex items-center gap-1.5 mb-1">
                <ShieldCheck size={18} /> Cota da Residência
              </div>
              <p className="text-xs text-slate-400">
                Altimetria calibrada por número predial, mostrando quantos metros o rio precisa subir para afetar o imóvel.
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="text-cyan-400 font-black text-lg flex items-center gap-1.5 mb-1">
                <BarChart3 size={18} /> Histórico & Projeções
              </div>
              <p className="text-xs text-slate-400">
                Comparativo com as cheias históricas (1941, Set/23, Nov/23 e Maio/24 a 29,80m).
              </p>
            </div>
          </div>
        </section>

        {/* BLOCO DE ANÚNCIO EDITORIAL ADSENSE (ENTRE ARTIGOS) */}
        <div className="w-full bg-slate-800/30 rounded-2xl p-2 border border-slate-800">
          <GoogleAdSenseBlock />
        </div>

        {/* ARTIGO 2: GUIA OFICIAL DE COTAS DO RIO TAQUARI */}
        <section className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle size={24} />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Tabela Oficial de Cotas de Cheia em Lajeado
            </h2>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Acompanhe o significado das marcas na régua oficial do Rio Taquari para saber exatamente quando agir e iniciar a retirada preventiva de pertences e veículos:
          </p>

          <div className="space-y-3">
            <div className="p-4 bg-slate-900/90 rounded-2xl border-l-4 border-l-blue-500 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-blue-400 font-bold text-sm block">13,00m a 17,00m • Situação Normal</span>
                <span className="text-xs text-slate-400">Navegação sem perigo. O rio escoa sem bloqueio de vias públicas.</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-blue-500/10 text-blue-300 rounded self-start sm:self-center">Observação</span>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-2xl border-l-4 border-l-amber-500 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-amber-400 font-bold text-sm block">17,00m • Cota de Atenção da Defesa Civil</span>
                <span className="text-xs text-slate-400">A Defesa Civil Municipal e o Corpo de Bombeiros entram em plantão e monitoram afluentes.</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-amber-500/10 text-amber-300 rounded self-start sm:self-center">Atenção</span>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-2xl border-l-4 border-l-orange-500 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-orange-400 font-bold text-sm block">19,00m • Cota de Alerta</span>
                <span className="text-xs text-slate-400">Famílias de áreas ribeirinhas baixas devem iniciar a preparação para evacuação segura.</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-orange-500/10 text-orange-300 rounded self-start sm:self-center">Alerta</span>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-2xl border-l-4 border-l-red-500 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-red-400 font-bold text-sm block">19,80m+ • Início do Alagamento de Ruas</span>
                <span className="text-xs text-slate-400">A água extravasa sobre as vias Décio Martins Costa e Parque Piraí, exigindo interdições.</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-red-500/10 text-red-300 rounded self-start sm:self-center">Inundação</span>
            </div>
          </div>
        </section>

        {/* ARTIGO 3: CHECKLIST DE PREVENÇÃO & FONTES OFICIAIS */}
        <section className="bg-slate-800/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 size={24} />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Fontes Oficiais & Telefones Úteis de Emergência
            </h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            O FloodWay agrega telemetria de sensores oficiais do <strong>Serviço Geológico do Brasil (SGB/CPRM)</strong>, <strong>ANA</strong> e boletins da <strong>Defesa Civil de Lajeado</strong>. Em caso de necessidade de socorro, mantenha sempre à mão:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xl font-black text-red-400 block">199</span>
              <span className="text-[11px] text-slate-400 font-medium">Defesa Civil</span>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xl font-black text-red-400 block">193</span>
              <span className="text-[11px] text-slate-400 font-medium">Bombeiros</span>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xl font-black text-blue-400 block">190</span>
              <span className="text-[11px] text-slate-400 font-medium">Brigada Militar</span>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xl font-black text-emerald-400 block">192</span>
              <span className="text-[11px] text-slate-400 font-medium">SAMU</span>
            </div>
          </div>
        </section>

        {/* CHAMADA DE AÇÃO FINAL */}
        <div className="text-center pt-4 pb-6 space-y-4">
          <button
            onClick={onIniciarNavegacao}
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base py-3.5 px-8 rounded-2xl shadow-lg shadow-blue-600/30 active:scale-98 transition transform cursor-pointer"
          >
            <Map size={20} />
            <span>Acessar o Mapa Interativo de Enchentes</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </main>

      {/* RODAPÉ INSTITUCIONAL CLÁSSICO COM LINKS LGPD E ADSENSE */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="font-bold text-slate-300 text-sm block">FloodWay Brasil</span>
            <span>Tecnologia cidadã de prevenção hidrológica e rotas de segurança • Lajeado/RS</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <button onClick={onAbrirPolitica} className="hover:text-blue-400 underline transition cursor-pointer">
              Política de Privacidade
            </button>
            <span>•</span>
            <button onClick={onAbrirTermos} className="hover:text-blue-400 underline transition cursor-pointer">
              Termos de Uso
            </button>
            <span>•</span>
            <button onClick={onIniciarNavegacao} className="hover:text-blue-400 underline transition cursor-pointer">
              Mapa & Rotas
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-900 text-[11px] text-slate-600">
          © 2026 FloodWay • Este portal disponibiliza dados de utilidade pública sem finalidade lucrativa direta.
        </div>
      </footer>
    </div>
  );
}
