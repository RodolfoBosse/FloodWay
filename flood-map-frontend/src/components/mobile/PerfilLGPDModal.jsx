import React, { useState } from 'react';
import { User, Home, Shield, LogOut, Trash2, X, MapPin, Bell, Plus, Check } from 'lucide-react';
import { API_BASE } from '../../services/config';
import { buscarDestinosCalibrados } from '../../services/locaisLajeado';
import { trackDemografia } from '../../services/telemetryTracker';

export default function PerfilLGPDModal({
  isOpen,
  onClose,
  usuario,
  onLogout,
  onUsuarioAtualizado,
  onAbrirConfigCasa,
  cotaAtual = 13.24,
  onAbrirPolitica,
  onAbrirSobre,
  onAbrirTermos,
  onAbrirAnalytics,
  onAtivarModoTeste
}) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');

  const [faixaEtaria, setFaixaEtaria] = useState(usuario?.faixaEtaria || '');
  const [genero, setGenero] = useState(usuario?.genero || '');
  const [salvandoDemo, setSalvandoDemo] = useState(false);
  const [demoSalvaMsg, setDemoSalvaMsg] = useState(false);

  const handleSalvarDemografia = () => {
    setSalvandoDemo(true);
    const usuarioAtualizado = {
      ...usuario,
      faixaEtaria,
      genero
    };
    localStorage.setItem('usuario_sentinela', JSON.stringify(usuarioAtualizado));
    if (usuario.email) {
      localStorage.setItem(`dados_perfil_${usuario.email}`, JSON.stringify(usuarioAtualizado));
    }
    if (onUsuarioAtualizado) onUsuarioAtualizado(usuarioAtualizado);

    // Envia evento anônimo demográfico para telemetria estruturada e com flush imediato
    try {
      trackDemografia(faixaEtaria, genero);
    } catch (_) {}

    setTimeout(() => {
      setSalvandoDemo(false);
      setDemoSalvaMsg(true);
      setTimeout(() => setDemoSalvaMsg(false), 2500);
    }, 400);
  };
  // Novo Ponto de Interesse
  const [adicionandoPonto, setAdicionandoPonto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEndereco, setNovoEndereco] = useState('');
  const [novaCota, setNovaCota] = useState('24.0');
  const [novasCoords, setNovasCoords] = useState(null);
  const [sugestoesPonto, setSugestoesPonto] = useState([]);

  const handleBuscarSugestoesPonto = async (termo) => {
    setNovoEndereco(termo);
    if (!termo || termo.trim().length < 2) {
      setSugestoesPonto([]);
      return;
    }
    const res = await buscarDestinosCalibrados(termo);
    setSugestoesPonto(res || []);
  };

  const handleSelecionarSugestaoPonto = (s) => {
    setNovoEndereco(`${s.nome} (${s.detalhe})`);
    if (!novoNome) {
      setNovoNome(s.nome.split('-')[0].trim());
    }
    if (s.cota) {
      setNovaCota(s.cota.toFixed(1));
    } else {
      setNovaCota('24.0');
    }
    if (s.coords) {
      setNovasCoords(s.coords);
    }
    setSugestoesPonto([]);
  };

  if (!isOpen || !usuario) return null;

  const pontos = usuario.pontosInteresse || [];

  const handleSalvarPonto = async () => {
    const enderecoFormatado = novoEndereco.trim();
    if (!enderecoFormatado) return;

    let coordsFinais = novasCoords;
    let cotaFinal = parseFloat(novaCota) || 24.0;

    // Se o usuário digitou livremente (ex: "Rua Bento Gonçalves, 529") sem clicar na lista suspensa
    if (!coordsFinais && enderecoFormatado) {
      try {
        const busca = await buscarDestinosCalibrados(enderecoFormatado);
        if (busca && busca.length > 0) {
          const primeiro = busca[0];
          coordsFinais = primeiro.coords;
          if (primeiro.cota) cotaFinal = primeiro.cota;
        }
      } catch (_) {}
    }

    const nomeFinal = novoNome.trim() || enderecoFormatado.split(',')[0].trim();

    const pontoObj = {
      id: Date.now(),
      nome: nomeFinal,
      endereco: enderecoFormatado,
      cota: cotaFinal,
      coords: coordsFinais || null,
    };
    const novosPontos = [...pontos, pontoObj];
    const usuarioAtualizado = {
      ...usuario,
      pontosInteresse: novosPontos,
    };

    localStorage.setItem('usuario_sentinela', JSON.stringify(usuarioAtualizado));
    if (usuario.email) {
      localStorage.setItem(`dados_perfil_${usuario.email}`, JSON.stringify(usuarioAtualizado));
    }
    if (onUsuarioAtualizado) onUsuarioAtualizado(usuarioAtualizado);

    setNovoNome('');
    setNovoEndereco('');
    setNovaCota('24.0');
    setNovasCoords(null);
    setSugestoesPonto([]);
    setAdicionandoPonto(false);
  };

  const handleRemoverPonto = (id) => {
    const novosPontos = pontos.filter(p => p.id !== id);
    const usuarioAtualizado = {
      ...usuario,
      pontosInteresse: novosPontos,
    };

    localStorage.setItem('usuario_sentinela', JSON.stringify(usuarioAtualizado));
    if (usuario.email) {
      localStorage.setItem(`dados_perfil_${usuario.email}`, JSON.stringify(usuarioAtualizado));
    }
    if (onUsuarioAtualizado) onUsuarioAtualizado(usuarioAtualizado);
  };

  const handleExcluirConta = async () => {
    setExcluindo(true);
    setErro('');
    try {
      const token = localStorage.getItem('sentinela_token');
      try {
        await fetch(`${API_BASE}/api/v1/auth/excluir-conta/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Token ${token}` : '',
          },
        });
      } catch (errApi) {
        console.warn('Exclusão remota em fallback:', errApi);
      }

      if (usuario?.email) {
        localStorage.removeItem(`dados_perfil_${usuario.email}`);
        localStorage.removeItem(`rotas_${usuario.email}`);
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
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
        
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
                <span>Residência Principal</span>
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
              <div className="text-[11px] text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">
                  {usuario.residencia?.endereco || usuario.endereco}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-100">
                    Altitude: <strong>{(usuario.residencia?.cota || usuario.cota_terreno || 20.0).toFixed(1)}m</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold ${
                    ((usuario.residencia?.cota || 20.0) - cotaAtual) > 2.0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : ((usuario.residencia?.cota || 20.0) - cotaAtual) > 0
                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {((usuario.residencia?.cota || 20.0) - cotaAtual) > 0
                      ? `🟢 Seguro (+${((usuario.residencia?.cota || 20.0) - cotaAtual).toFixed(1)}m de margem)`
                      : `🔴 Risco de Alagamento (${Math.abs((usuario.residencia?.cota || 20.0) - cotaAtual).toFixed(1)}m submerso)`}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">
                Nenhum endereço salvo. Clique em <strong>+ Cadastrar</strong> para marcar sua casa no mapa e receber avisos no celular.
              </p>
            )}
          </div>

          {/* Outros Pontos de Interesse Monitorados */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700 font-semibold text-xs">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Outros Locais Monitorados ({pontos.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setAdicionandoPonto(!adicionandoPonto)}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-100/80 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Adicionar</span>
              </button>
            </div>

            {adicionandoPonto && (
              <div className="p-2.5 bg-white border border-blue-200 rounded-lg space-y-2 text-xs">
                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Buscar Local / Rua / Ponto de Referência</label>
                  <input
                    type="text"
                    placeholder="Digite ex: Univates, Bento Gonçalves, CEAT, HBB..."
                    value={novoEndereco}
                    onChange={(e) => handleBuscarSugestoesPonto(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Sugestões Automáticas em Tempo Real */}
                  {sugestoesPonto.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      <div className="p-1.5 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500 font-bold border-b border-gray-100">
                        <span>Sugestões Encontradas</span>
                        <button
                          type="button"
                          onClick={() => setSugestoesPonto([])}
                          className="text-gray-400 hover:text-gray-700 px-1"
                        >
                          ✕ Fechar
                        </button>
                      </div>
                      {sugestoesPonto.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelecionarSugestaoPonto(s)}
                          className="text-xs p-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                        >
                          <span className="text-sm">
                            {s.tipo === "hospital" ? "🏥" : s.tipo === "faculdade" || s.tipo === "escola" ? "🎓" : s.tipo === "rua" ? "📍" : "🏢"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 truncate">{s.nome}</p>
                            <p className="text-[10px] text-gray-500 truncate">{s.detalhe}</p>
                          </div>
                          {s.cota && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-1.5 py-0.5 rounded">
                              {s.cota.toFixed(1)}m
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Nome / Identificador</label>
                  <input
                    type="text"
                    placeholder="Ex: Trabalho, Escola, Escritório..."
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Cota do Terreno (metros)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={novaCota}
                      onChange={(e) => setNovaCota(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 font-bold text-blue-700"
                    />
                  </div>
                  {novasCoords && (
                    <div className="flex items-end pb-1 text-[10px] text-emerald-600 font-bold">
                      ✓ Coordenadas GPS
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setAdicionandoPonto(false);
                      setSugestoesPonto([]);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarPonto}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-xs active:scale-95 transition"
                  >
                    Salvar Ponto
                  </button>
                </div>
              </div>
            )}

            {pontos.length === 0 && !adicionandoPonto && (
              <p className="text-[11px] text-gray-400 italic">
                Nenhum ponto adicional cadastrado. Adicione seu trabalho, escola dos filhos ou comércio para acompanhar as margens.
              </p>
            )}

            {pontos.map((p) => {
              const margem = p.cota - cotaAtual;
              const isLivre = margem > 0;
              return (
                <div key={p.id} className="p-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{p.nome}</p>
                    <p className="text-[10px] text-gray-500">{p.endereco} • Cota: {p.cota}m</p>
                    <p className="text-[10px] font-bold mt-0.5">
                      <span className={isLivre ? "text-emerald-600" : "text-red-600"}>
                        {isLivre ? `+${margem.toFixed(1)}m livres` : `Submerso por +${Math.abs(margem).toFixed(1)}m`}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoverPonto(p.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Remover ponto"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Seção Opcional de Perfil Demográfico para Prevenção */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <span>📊</span> Perfil da Comunidade (Opcional)
                </h4>
                <p className="text-[10px] text-gray-500">
                  Ajuda a mapear o perfil demográfico da população do Vale do Taquari em áreas de alerta.
                </p>
              </div>
              {demoSalvaMsg && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Salvo!
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Faixa Etária</label>
                <select
                  value={faixaEtaria}
                  onChange={(e) => setFaixaEtaria(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-500"
                >
                  <option value="">Prefiro não informar</option>
                  <option value="18-24">18 a 24 anos</option>
                  <option value="25-34">25 a 34 anos</option>
                  <option value="35-49">35 a 49 anos</option>
                  <option value="50-64">50 a 64 anos</option>
                  <option value="65+">65 anos ou mais</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Gênero</label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-500"
                >
                  <option value="">Prefiro não informar</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            {(faixaEtaria !== (usuario?.faixaEtaria || '') || genero !== (usuario?.genero || '')) && (
              <button
                type="button"
                onClick={handleSalvarDemografia}
                disabled={salvandoDemo}
                className="w-full mt-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-1.5 rounded-lg text-xs transition flex items-center justify-center gap-1"
              >
                {salvandoDemo ? 'Salvando...' : 'Salvar Informações Demográficas'}
              </button>
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

          {/* Links Institucionais e LGPD */}
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
            <button
              onClick={() => {
                onClose();
                if (onAbrirSobre) onAbrirSobre();
              }}
              className="hover:text-blue-600 underline transition"
            >
              Sobre o FloodWay
            </button>
            <span>•</span>
            <button
              onClick={() => {
                onClose();
                if (onAbrirPolitica) onAbrirPolitica();
              }}
              className="hover:text-blue-600 underline transition"
            >
              Política de Privacidade
            </button>
            <span>•</span>
            <button
              onClick={() => {
                onClose();
                if (onAbrirTermos) onAbrirTermos();
              }}
              className="hover:text-blue-600 underline transition"
            >
              Termos de Uso
            </button>
            {onAtivarModoTeste && (
              <>
                <span>•</span>
                <button
                  onClick={() => {
                    onClose();
                    onAtivarModoTeste();
                  }}
                  className="hover:text-amber-600 font-bold text-amber-600 transition"
                >
                  🧪 Modo Teste / Simulação
                </button>
              </>
            )}
          </div>

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
