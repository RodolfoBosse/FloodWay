import React from "react";
import { ArrowLeft, BookOpen, AlertTriangle, ShieldCheck, Waves, MapPin, Compass } from "lucide-react";
import GoogleAdSenseBlock from "../common/GoogleAdSenseBlock";

export default function SobrePage({ onVoltar }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col items-center p-4 sm:p-6 overflow-y-auto overscroll-y-contain" style={{ touchAction: 'pan-y' }}>
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 my-4">
        {onVoltar && (
          <button
            onClick={onVoltar}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 mb-6 group transition"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao Mapa
          </button>
        )}

        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
          <div className="p-3 bg-amber-100/70 text-amber-700 rounded-xl">
            <Waves size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sobre o FloodWay & Monitoramento do Rio Taquari
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Guia informativo, dados hidrológicos oficiais e prevenção de inundações em Lajeado e Estrela - RS
            </p>
          </div>
        </div>

        {/* Conteúdo Editorial de Alto Valor para o Google AdSense */}
        <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Compass size={20} className="text-blue-600" /> A Missão do FloodWay
            </h2>
            <p>
              O <strong>FloodWay</strong> nasceu com o propósito de transformar dados hidrológicos complexos e cotas de inundação em informações simples, visuais e acessíveis para os moradores, empresários e socorristas da Bacia Hidrográfica do Rio Taquari-Antas, com foco especial na conurbação urbana de Lajeado e Estrela.
            </p>
            <p>
              Durante eventos de cheias e inundações bruscas, a principal dúvida de um cidadão não é apenas quantos metros o rio subiu na régua da balsa, mas sim: <em>"A água alcançará a minha rua? E por qual caminho seguro consigo sair ou evacuar?"</em>. O FloodWay resolve esse desafio integrando telemetria em tempo real, altimetria oficial do relevo e algoritmos de cálculo de rotas seguras por cotas elevadas.
            </p>
          </section>

          <section className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-amber-600" /> Entenda as Cotas Oficiais de Inundação em Lajeado
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <strong className="text-blue-700 block text-sm">13,00m a 17,00m • Nível Normal / Observação</strong>
                O rio corre dentro de sua calha habitual. Atividades náuticas e portuárias operam sem restrições graves.
              </div>
              <div className="p-3 bg-white rounded-lg border border-amber-200 shadow-2xs">
                <strong className="text-amber-700 block text-sm">17,00m • Cota de Atenção</strong>
                A Defesa Civil Municipal e o Corpo de Bombeiros iniciam o protocolo de monitoramento contínuo das cabeceiras (Santa Teresa, Muçum e Encantado).
              </div>
              <div className="p-3 bg-white rounded-lg border border-orange-200 shadow-2xs">
                <strong className="text-orange-700 block text-sm">19,00m • Cota de Alerta</strong>
                Preparação de equipes de remoção. As águas represam no Parque Piraí e valas de escoamento pluvial.
              </div>
              <div className="p-3 bg-white rounded-lg border border-red-200 shadow-2xs">
                <strong className="text-red-700 block text-sm">19,80m+ • Inundação Inicial das Vias</strong>
                A água começa a invadir as primeiras ruas baixas (como Décio Martins Costa no Centro e vias marginais de Carneiros).
              </div>
            </div>
          </section>

          {/* Anúncio AdSense Integrado em Conteúdo Informativo */}
          <GoogleAdSenseBlock />

          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" /> Como o FloodWay Calcula as Rotas Seguras?
            </h2>
            <p>
              Ao traçar uma rota segura pelo FloodWay, o sistema não busca apenas a menor distância geográfica. Ele analisa a <strong>cota altimétrica mínima de cada segmento de rua</strong> pelo qual o veículo passaria. Se o rio atingir ou estiver prestes a atingir o nível do asfalto em um determinado cruzamento, aquele trecho é imediatamente bloqueado na malha de navegação, forçando o trajeto pelas vias de cumeada e morros (desvios seguros pelas colinas).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-green-600" /> Fontes Oficiais de Dados
            </h2>
            <p>
              As informações disponibilizadas pelo aplicativo são alimentadas e calibradas com dados públicos das seguintes instituições:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li><strong>SGB / CPRM</strong> - Serviço Geológico do Brasil (Sistema de Alerta Hidrológico da Bacia do Taquari);</li>
              <li><strong>ANA</strong> - Agência Nacional de Águas e Saneamento Básico;</li>
              <li><strong>Defesa Civil de Lajeado e Governo do Estado do RS</strong>;</li>
              <li><strong>OpenStreetMap (OSM) & Open-Meteo</strong> para malha cartográfica e dados meteorológicos.</li>
            </ul>
          </section>

          <section className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs sm:text-sm text-amber-900">
            <strong>Aviso de Utilidade e Responsabilidade:</strong> O FloodWay é uma ferramenta de suporte à decisão e planejamento preventivo. Em situações de emergência severa com risco iminente à vida, siga rigorosamente as ordens de evacuação emitidas pelas autoridades oficiais e ligue para a Defesa Civil (199) ou Corpo de Bombeiros (193).
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>© 2026 FloodWay • Plataforma Comunitária de Alerta</span>
          {onVoltar && (
            <button onClick={onVoltar} className="text-blue-600 hover:underline font-medium">
              Fechar e Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

