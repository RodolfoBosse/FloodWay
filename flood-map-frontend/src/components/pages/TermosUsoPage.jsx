import React from "react";
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Scale } from "lucide-react";
import GoogleAdSenseBlock from "../common/GoogleAdSenseBlock";

export default function TermosUsoPage({ onVoltar }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center p-4 sm:p-6 overflow-y-auto">
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
          <div className="p-3 bg-purple-100/70 text-purple-700 rounded-xl">
            <Scale size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Termos e Condições de Uso
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Última atualização: Novembro de 2026 • Condições gerais de navegação no FloodWay
            </p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle size={20} className="text-purple-600" /> 1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar ou utilizar a plataforma FloodWay em quaisquer de seus dispositivos (web, desktop ou mobile), você concorda expressamente com os presentes Termos e com a nossa Política de Privacidade. Se você não concordar com qualquer termo, recomendamos que descontinue o uso do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600" /> 2. Natureza Informativa e Limitação de Responsabilidade
            </h2>
            <p>
              O FloodWay agrega dados de telemetria de sensores públicos (CPRM, ANA, Defesa Civil) e modelos digitais de elevação do terreno (DEM). Embora nos esforcemos ao máximo para garantir acurácia e atualização contínua:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                Inundações podem sofrer variações causadas por entupimento de bueiros, refluxo de arroios locais, escorregamento de encostas ou represamentos pontuais não detectados por sensores fluviais principais.
              </li>
              <li>
                O serviço é fornecido <em>"no estado em que se encontra" (as-is)</em>. A decisão final de trafegar por uma via, evacuar ou permanecer em uma residência cabe exclusivamente ao cidadão e às ordens das autoridades competentes.
              </li>
            </ul>
          </section>

          <GoogleAdSenseBlock />

          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-purple-600" /> 3. Propriedade Intelectual e Uso Aceitável
            </h2>
            <p>
              A marca FloodWay, código de interface, algoritmos de cálculo de rotas e identidade visual são protegidos por legislação de propriedade intelectual. É concedida ao usuário uma licença de uso pessoal, não comercial e gratuita para consulta individual e proteção comunitária.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">4. Modificações do Serviço</h2>
            <p>
              Reservamo-nos o direito de aprimorar, atualizar ou modificar recursos da plataforma a qualquer momento para garantir a resiliência e estabilidade do sistema durante crises hidrológicas.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>© 2026 FloodWay</span>
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
