import React, { useState, useEffect } from "react";
import { RefreshCw, Sparkles, X } from "lucide-react";

/**
 * Componente que monitora atualizações do Service Worker e exibe
 * um alerta discreto ou recarrega a página automaticamente para
 * garantir que o PWA/celular sempre rode a versão mais recente.
 */
export default function AutoUpdateNotifier() {
  const [temAtualizacao, setTemAtualizacao] = useState(false);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    const registrarSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        // Verifica atualizações a cada 60 segundos automaticamente
        setInterval(() => {
          reg.update().catch(() => {});
        }, 60000);

        // Se o usuário alternar para o app (visibilidade volta à tona), checa imediatamente
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            reg.update().catch(() => {});
          }
        });

        // Caso já haja um worker esperando
        if (reg.waiting) {
          setTemAtualizacao(true);
        }

        reg.addEventListener("updatefound", () => {
          const novoWorker = reg.installing;
          if (novoWorker) {
            novoWorker.addEventListener("statechange", () => {
              if (novoWorker.state === "installed" && navigator.serviceWorker.controller) {
                // Nova versão disponível!
                setTemAtualizacao(true);
              }
            });
          }
        });
      } catch (err) {
        console.debug("Erro registro SW:", err);
      }
    };

    registrarSW();

    // Escuta mensagem enviada pelo próprio SW quando ativado
    const handleMessage = (event) => {
      if (event.data && event.data.type === "SW_UPDATED") {
        setTemAtualizacao(true);
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  const aplicarAtualizacao = () => {
    setAtualizando(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ action: "skipWaiting" });
        } else {
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  };

  if (!temAtualizacao) return null;

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed top-4 left-4 right-4 max-w-sm mx-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 rounded-2xl shadow-2xl border border-blue-400/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 bg-white/20 rounded-xl shrink-0">
          <Sparkles size={18} className="text-yellow-300 animate-pulse" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight truncate">Nova versão disponível!</p>
          <p className="text-[10px] text-blue-100 leading-tight">Toque para atualizar o app</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={aplicarAtualizacao}
          disabled={atualizando}
          className="bg-white text-blue-700 hover:bg-blue-50 active:scale-95 text-xs font-black px-3 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw size={12} className={atualizando ? "animate-spin" : ""} />
          <span>{atualizando ? "Atualizando..." : "Atualizar"}</span>
        </button>
        <button
          onClick={() => setTemAtualizacao(false)}
          className="text-white/70 hover:text-white p-1 rounded-lg"
          title="Dispensar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
