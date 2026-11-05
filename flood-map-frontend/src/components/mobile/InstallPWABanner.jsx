import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

export default function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visivel, setVisivel] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [mostraGuiaIOS, setMostraGuiaIOS] = useState(false);

  useEffect(() => {
    // 1. Não mostra se já estiver rodando instalado como PWA standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return;

    // 2. Não mostra se o usuário fechou recentemente
    const dispensado = localStorage.getItem('floodway_pwa_dismissed');
    if (dispensado && Date.now() - parseInt(dispensado, 10) < 86400000 * 3) {
      return; // 3 dias de folga se dispensar
    }

    // 3. Detecção iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    if (iosDevice) {
      // No iOS, se não estiver standalone, exibe o banner após 2 segundos
      const timer = setTimeout(() => setVisivel(true), 2000);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome / Edge nativo: escuta beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisivel(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Fallback: mesmo se o evento demorar no Android, exibe o convite após 3s
    const fallbackTimer = setTimeout(() => {
      if (!isStandalone) {
        setVisivel(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstalar = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisivel(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setMostraGuiaIOS(true);
    } else {
      // Dispositivos onde o navegador gerencia pelo menu
      alert('Para instalar o FloodWay:\n1. Toque nos 3 pontinhos (⋮) do seu navegador.\n2. Escolha "Instalar aplicativo" ou "Adicionar à tela inicial".');
    }
  };

  const dispensar = () => {
    setVisivel(false);
    localStorage.setItem('floodway_pwa_dismissed', Date.now().toString());
  };

  if (!visivel) return null;

  return (
    <div
      style={{ zIndex: 3200 }}
      className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-blue-400/30 backdrop-blur-md animate-in slide-in-from-top duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <Smartphone className="w-5 h-5 text-blue-300" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs text-white leading-tight">
              Instalar o FloodWay no Celular
            </h4>
            <p className="text-[10px] text-blue-200 truncate mt-0.5">
              Acesso rápido com ícone e alertas em tempo real
            </p>
          </div>
        </div>

        <button
          onClick={dispensar}
          className="text-gray-400 hover:text-white p-1 rounded-full transition shrink-0"
          title="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <button
          onClick={handleInstalar}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
        >
          <Download size={13} />
          <span>Instalar Agora</span>
        </button>
        <button
          onClick={dispensar}
          className="px-2.5 py-1.5 text-gray-300 hover:text-white text-[11px] font-medium"
        >
          Mais tarde
        </button>
      </div>

      {/* Guia visual caso seja iPhone/iPad (Safari não suporta prompt via código) */}
      {mostraGuiaIOS && (
        <div className="mt-3 pt-2.5 border-t border-blue-700/50 text-[11px] text-blue-100 space-y-1.5 animate-in fade-in">
          <p className="font-semibold text-white">No iPhone / iPad:</p>
          <p className="flex items-center gap-1.5">
            1. Toque no botão de <strong>Compartilhar</strong> <Share size={13} className="inline text-blue-300" />
          </p>
          <p className="flex items-center gap-1.5">
            2. Selecione <strong>"Adicionar à Tela de Início"</strong> <PlusSquare size={13} className="inline text-blue-300" />
          </p>
        </div>
      )}
    </div>
  );
}

