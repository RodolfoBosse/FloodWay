import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, Phone, CheckCircle, AlertCircle, X, ChevronRight, FileText } from 'lucide-react';
import { API_BASE } from '../../services/config';

export default function AuthLGPDModal({ isOpen, onClose, onLoginSucesso }) {
  const [modo, setModo] = useState('login'); // 'login' | 'cadastro' | 'termos'
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [aceitouLGPD, setAceitouLGPD] = useState(false);
  
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setErro('');
    setSucesso('');
    setNome('');
    setEmail('');
    setSenha('');
    setWhatsapp('');
    setAceitouLGPD(false);
  };

  const handleTrocaModo = (novoModo) => {
    setErro('');
    setSucesso('');
    setModo(novoModo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (modo === 'cadastro' && !aceitouLGPD) {
      setErro('Você precisa aceitar os Termos de Privacidade e LGPD para criar uma conta.');
      return;
    }

    setCarregando(true);
    try {
      const endpoint = modo === 'cadastro' 
        ? `${API_BASE}/api/v1/auth/cadastro/`
        : `${API_BASE}/api/v1/auth/login/`;

      const payload = modo === 'cadastro' 
        ? { nome, email, senha, whatsapp, aceitou_lgpd: aceitouLGPD }
        : { email, senha };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.erro || 'Falha ao processar a requisição.');
      }

      // Salva sessão localmente
      if (data.token) {
        localStorage.setItem('sentinela_token', data.token);
      }
      if (data.usuario) {
        localStorage.setItem('usuario_sentinela', JSON.stringify(data.usuario));
        if (onLoginSucesso) {
          onLoginSucesso(data.usuario);
        }
      }

      setSucesso(modo === 'cadastro' ? 'Conta criada com sucesso!' : 'Login realizado!');
      setTimeout(() => {
        resetForm();
        onClose();
      }, 700);

    } catch (err) {
      setErro(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ zIndex: 3500 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all max-h-[92vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌊</span>
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                Sentinela Lajeado
              </h3>
              <p className="text-[11px] text-gray-500">
                Segurança hidrológica e rotas de fuga
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODO TERMOS LGPD */}
        {modo === 'termos' ? (
          <div className="mt-4 text-xs text-gray-600 space-y-3">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Política de Privacidade & LGPD</span>
            </div>
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 max-h-60 overflow-y-auto space-y-2.5 text-[11px] leading-relaxed">
              <p>
                <strong>1. Compromisso com sua Privacidade:</strong> Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), o Sentinela Lajeado coleta exclusivamente as informações estritamente necessárias para a prestação de serviços de alerta preventivo contra enchentes e cálculo de rotas seguras de fuga.
              </p>
              <p>
                <strong>2. Dados Coletados:</strong> Nome, e-mail para autenticação, número de WhatsApp (opcional, para avisos de emergência quando o rio atinge a cota de atenção) e localização da residência/empresa para comparação com a altimetria do terreno.
              </p>
              <p>
                <strong>3. Segurança e Criptografia:</strong> Suas credenciais são armazenadas com hash criptográfico irreversível. Nenhuma informação pessoal ou de localização é comercializada ou compartilhada com terceiros para fins de marketing.
              </p>
              <p>
                <strong>4. Seus Direitos (Art. 18 da LGPD):</strong> Você pode a qualquer momento consultar seus dados, solicitar correção ou requerer a exclusão completa e definitiva de sua conta e histórico em nosso sistema.
              </p>
            </div>
            <button
              onClick={() => setModo('cadastro')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Voltar ao Cadastro
            </button>
          </div>
        ) : (
          /* MODO LOGIN OU CADASTRO */
          <div className="mt-4">
            {/* Seletor de Abas */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => handleTrocaModo('login')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  modo === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => handleTrocaModo('cadastro')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  modo === 'cadastro' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Criar Nova Conta
              </button>
            </div>

            {/* Mensagens de Sucesso ou Erro */}
            {erro && (
              <div className="mb-3.5 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{erro}</span>
              </div>
            )}
            {sucesso && (
              <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{sucesso}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {modo === 'cadastro' && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Ex: Carlos Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                  Senha {modo === 'cadastro' && <span className="text-gray-400 font-normal">(mínimo 6 caracteres)</span>}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {modo === 'cadastro' && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    WhatsApp para Alertas <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      placeholder="(51) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Termos de Aceite LGPD */}
              {modo === 'cadastro' && (
                <div className="pt-1.5 pb-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={aceitouLGPD}
                      onChange={(e) => setAceitouLGPD(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] text-gray-600 leading-tight">
                      Li e concordo com o uso dos meus dados para alertas e rotas de segurança conforme a{' '}
                      <button
                        type="button"
                        onClick={() => setModo('termos')}
                        className="text-blue-600 underline font-semibold hover:text-blue-800"
                      >
                        Política de Privacidade (LGPD)
                      </button>.
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-xs shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {carregando ? (
                  <span>Processando...</span>
                ) : modo === 'login' ? (
                  <>
                    <span>Entrar na Minha Conta</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Concluir Cadastro Seguro</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Dados protegidos por criptografia
              </span>
              <button
                type="button"
                onClick={() => setModo('termos')}
                className="text-gray-400 hover:text-gray-600 hover:underline"
              >
                Termos & LGPD
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
