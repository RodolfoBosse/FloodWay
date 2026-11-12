import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, ChevronRight, X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'floodway_cookie_consent_v1';

export function getCookieConsentStatus() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent() {
  const consent = getCookieConsentStatus();
  return consent && consent.analytics === true;
}

export default function CookieConsentBanner({ onAbrirPolitica }) {
  const [visivel, setVisivel] = useState(false);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);

  useEffect(() => {
    const status = getCookieConsentStatus();
    if (!status) {
      // Pequeno delay para animação suave após carregamento da tela
      const timer = setTimeout(() => setVisivel(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const salvarDecisao = (analyticsAceito) => {
    const decisao = {
      essential: true, // Essenciais sempre ativos (sessão, PWA, cache de cota)
      analytics: analyticsAceito,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(decisao));
      // Dispara evento customizado para que o serviço de telemetria saiba da autorização na hora
      window.dispatchEvent(new CustomEvent('cookie_consent_changed', { detail: decisao }));
    } catch (e) {
      console.warn('Erro ao salvar consentimento de cookies:', e);
    }
    setVisivel(false);
  };

  if (!visivel) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[12000] p-3 sm:p-4 pointer-events-none animate-in fade-in slide-in-from-bottom duration-300">
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-4 sm:p-5 pointer-events-auto text-slate-800">
        
        {/* Cabeçalho */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Privacidade & Cookies
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  LGPD
                </span>
              </h3>
              <button 
                onClick={() => salvarDecisao(false)}
                className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
                aria-label="Fechar e manter apenas essenciais"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              O <strong>FloodWay</strong> utiliza cookies e telemetria anônima para compreender as áreas de maior risco simuladas em Lajeado, otimizar rotas e melhorar o tempo de resposta em enchentes. Seus dados nunca são vendidos.
            </p>

            {/* Alternar detalhes */}
            <button
              onClick={() => setDetalhesAbertos(!detalhesAbertos)}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <span>{detalhesAbertos ? 'Ocultar detalhes' : 'Ver finalidades e cookies'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${detalhesAbertos ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Detalhes expansíveis */}
        {detalhesAbertos && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Essenciais & Segurança (Obrigatórios)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Salvam offline as configurações do seu endereço, cota de inundação segura e autenticação Google.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                i
              </div>
              <div>
                <p className="font-semibold text-slate-800">Métricas & Telemetria Anônima (Opcionais)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Coletam resoluções de tela, cotas simuladas mais pesquisadas e desempenho de rotas para apoiar a Defesa Civil e a evolução do app.
                </p>
              </div>
            </div>

            {onAbrirPolitica && (
              <p className="text-[11px] text-slate-500 pt-1">
                Para saber mais, leia nossa{' '}
                <button
                  onClick={() => onAbrirPolitica()}
                  className="text-blue-600 hover:underline font-medium inline"
                >
                  Política de Privacidade Completa
                </button>.
              </p>
            )}
          </div>
        )}

        {/* Ações / Botões */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => salvarDecisao(false)}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
          >
            Apenas Essenciais
          </button>
          
          <button
            onClick={() => salvarDecisao(true)}
            className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-500/20 transition-all text-center"
          >
            Aceitar Todos e Continuar
          </button>
        </div>

      </div>
    </div>
  );
}
