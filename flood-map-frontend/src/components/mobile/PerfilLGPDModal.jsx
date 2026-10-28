import React, { useState } from 'react';
import { User, Home, Shield, LogOut, Trash2, X, MapPin, Bell } from 'lucide-react';
import { API_BASE } from '../../services/config';

export default function PerfilLGPDModal({ isOpen, onClose, usuario, onLogout, onUsuarioAtualizado, onAbrirConfigCasa }) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen || !usuario) return null;

  const handleExcluirConta = async () => {
    setExcluindo(true);
    setErro('');
    try {
      const token = localStorage.getItem('sentinela_token');
      const resp = await fetch(`${API_BASE}/api/v1/auth/excluir-conta/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Token ${token}` : '',
        },
      });

      if (!resp.ok) {
        throw new Error('Falha ao excluir conta.');
      }

      localStorage.removeItem('sentinela_token');
      localStorage.removeItem('usuario_sentinela');
      if (onLogout) onLogout();
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao processar exclusão dos dados.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div style={{ zIndex: 3500 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {usuario.nome || 'Meu Perfil'}
              </h3>
              <p className="text-[11px] text-gray-500">{usuario.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações da Casa Monitorada */}
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-gray-700 font-semibold text-xs">
                <Home className="w-4 h-4 text-amber-600" />
                <span>Residência Monitorada</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onAbrirConfigCasa) {
                    onAbrirConfigCasa();
                    onClose();
                  }
                }}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-2 py-0.5 rounded-lg transition"
              >
                {usuario.residencia || usuario.endereco ? "Alterar" : "+ Cadastrar"}
              </button>
            </div>
            {usuario.residencia || usuario.endereco ? (
              <div className="text-[11px] text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-800">
                  {usuario.residencia?.endereco || usuario.endereco}
                </p>
                <p className="text-gray-500">
                  Cota do Solo: <strong className="text-blue-600">{usuario.residencia?.cota || usuario.cota_terreno || 20.0}m</strong>
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">
                Nenhum endereço salvo. Clique em <strong>+ Cadastrar</strong> para marcar sua casa no mapa e receber alertas precisos de alagamento.
              </p>
            )}
          </div>

          {/* Dados LGPD */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conformidade LGPD Ativa</span>
            </div>
            <p className="text-[10px] text-emerald-800 leading-relaxed">
              Seus dados de geolocalização e contato são utilizados unicamente para os alertas hidrológicos do Rio Taquari.
            </p>
          </div>

          {erro && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              {erro}
            </div>
          )}

          {/* Ações */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                localStorage.removeItem('sentinela_token');
                localStorage.removeItem('usuario_sentinela');
                if (onLogout) onLogout();
                onClose();
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>

            {!confirmandoExclusao ? (
              <button
                onClick={() => setConfirmandoExclusao(true)}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 font-medium py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Meus Dados (Direito LGPD Art. 18)</span>
              </button>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-in fade-in">
                <p className="text-[11px] text-red-800 font-semibold text-center">
                  Tem certeza? Todos os seus dados e rotas salvas serão apagados permanentemente.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmandoExclusao(false)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleExcluirConta}
                    disabled={excluindo}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-xs font-bold"
                  >
                    {excluindo ? 'Excluindo...' : 'Sim, Excluir Tudo'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

