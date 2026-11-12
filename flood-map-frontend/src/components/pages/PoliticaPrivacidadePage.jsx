import React from "react";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Database } from "lucide-react";
import GoogleAdSenseBlock from "../common/GoogleAdSenseBlock";

export default function PoliticaPrivacidadePage({ onVoltar }) {
  return (
    <div className="w-full bg-slate-50 text-slate-800 flex flex-col items-center p-4 sm:p-6">
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
          <div className="p-3 bg-blue-100/70 text-blue-700 rounded-xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Política de Privacidade & LGPD
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Última atualização: Novembro de 2026 • Em conformidade com a Lei Federal nº 13.709/2018 (LGPD) e Políticas de Editores do Google
            </p>
          </div>
        </div>

        {/* Bloco de Conteúdo Editorial */}
        <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Eye size={20} className="text-blue-600" /> 1. Introdução e Compromisso
            </h2>
            <p>
              O <strong>FloodWay</strong> (disponível em floodway.vercel.app e domínios associados) é uma plataforma civil de utilidade pública dedicada ao monitoramento hidrológico do Rio Taquari (Lajeado e Estrela - RS), simulação preventiva de inundações e roteamento de fuga seguro. Nós respeitamos profundamente a privacidade de nossos usuários e tratamos seus dados pessoais com total transparência e segurança.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database size={20} className="text-blue-600" /> 2. Dados Coletados e Finalidade
            </h2>
            <p>
              Para a utilização básica do mapa e visualização das cotas do rio, nenhum dado cadastral é exigido. No entanto, para funcionalidades personalizadas, coletamos:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Autenticação Opcional (Google Sign-In ou E-mail):</strong> Nome público, endereço de e-mail e foto de perfil, unicamente para identificação da sua conta pessoal.
              </li>
              <li>
                <strong>Localização de Residência e Pontos de Interesse:</strong> Endereço fornecido voluntariamente pelo usuário (Rua, Número, Bairro ou CEP) para calcular se sua casa está segura ou em risco de alagamento com base na cota do terreno em metros.
              </li>
              <li>
                <strong>Rotas Salvas:</strong> Origens e destinos favoritados para cálculo de caminhos que evitam vias alagadas.
              </li>
            </ul>
          </section>

          {/* Anúncio AdSense Integrado em Conteúdo Editorial Legítimo */}
          <GoogleAdSenseBlock />

          <section className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lock size={20} className="text-blue-700" /> 3. Cookies e Publicidade do Google (Google AdSense)
            </h2>
            <p className="mt-2 text-slate-700">
              Este site pode veicular anúncios fornecidos pelo <strong>Google AdSense</strong>. O Google, como fornecedor terceirizado, utiliza cookies para veicular anúncios com base nas visitas anteriores do usuário a este ou a outros websites.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-slate-700 text-xs sm:text-sm">
              <li>
                O uso de cookies de publicidade pelo Google permite que ele e seus parceiros veiculem anúncios para os usuários com base nas visitas feitas aos seus sites e/ou a outros sites na Internet.
              </li>
              <li>
                Os usuários podem desativar a publicidade personalizada acessando as <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Configurações de Anúncios do Google</a>.
              </li>
              <li>
                Alternativamente, você pode desativar o uso de cookies de terceiros para publicidade personalizada visitando <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">www.aboutads.info</a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> 4. Direitos do Titular sob a LGPD
            </h2>
            <p>
              Conforme o art. 18 da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você possui o direito a qualquer momento de:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmar a existência de tratamento de dados;</li>
              <li>Acessar seus dados salvos em seu perfil;</li>
              <li>Corrigir dados incompletos ou inexatos;</li>
              <li>
                <strong>Excluir completamente sua conta e dados associados</strong> diretamente no painel "Minha Conta" do aplicativo ou solicitando via canal de contato.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">5. Contato e Encarregado de Proteção de Dados (DPO)</h2>
            <p>
              Dúvidas ou solicitações sobre esta política podem ser enviadas diretamente pelo formulário de suporte ou através de nosso canal de atendimento ao usuário.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
          <span>© 2026 FloodWay • Lajeado/RS</span>
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

