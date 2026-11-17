import React, { useState } from 'react';
import { User, Home, Shield, LogOut, Trash2, X, MapPin, Bell, Plus, Check, Search, Loader2 } from 'lucide-react';
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
  const [novoCep, setNovoCep] = useState('');
  const [buscandoCepPonto, setBuscandoCepPonto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEndereco, setNovoEndereco] = useState('');
  const [novaCota, setNovaCota] = useState('');
  const [novasCoords, setNovasCoords] = useState(null);
  const [sugestoesPonto, setSugestoesPonto] = useState([]);

  const handleBuscarCepPonto = async (cepDigitado) => {
    setNovoCep(cepDigitado);
    const cepLimpo = (cepDigitado || '').replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setBuscandoCepPonto(true);
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        if (resp.ok) {
          const data = await resp.json();
          if (!data.erro) {
            const end = data.logradouro ? `${data.logradouro}${data.bairro ? ` - ${data.bairro}` : ''}` : '';
            if (end) {
              setNovoEndereco(end);
              if (!novoNome) {
                setNovoNome(data.logradouro);
              }
              // Tenta localizar coordenadas e cota na base calibrada
              const res = await buscarDestinosCalibrados(data.logradouro);
              if (res && res.length > 0) {
                if (res[0].coords) setNovasCoords(res[0].coords);
                if (res[0].cota) setNovaCota(res[0].cota.toFixed(1));
              }
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao consultar CEP para ponto:', e);
      } finally {
        setBuscandoCepPonto(false);
      }
    }
  };

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
      setNovaCota('');
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
    let cotaCalculada = parseFloat(novaCota);

    // Se o usuário digitou livremente sem clicar na lista suspensa
    if ((!coordsFinais || isNaN(cotaCalculada)) && enderecoFormatado) {
      try {
        const busca = await buscarDestinosCalibrados(enderecoFormatado);
        if (busca && busca.length > 0) {
          const primeiro = busca[0];
          if (!coordsFinais) coordsFinais = primeiro.coords;
          if (isNaN(cotaCalculada) && primeiro.cota) cotaCalculada = primeiro.cota;
        }
      } catch (_) {}
    }

    const cotaFinal = !isNaN(cotaCalculada) && cotaCalculada > 0 ? cotaCalculada : 19.5;
    const nomeFinal = novoNome.trim() || enderecoFormatado.split(',')[0].trim();

    const pontoObj = {
      id: Date.now(),
      nome: nomeFinal,
      endereco: enderecoFormatado,
      cep: novoCep ? novoCep.replace(/\D/g, '') : null,
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
    setNovoCep('');
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
    <div style={{ zIndex: 3500 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto border border-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm border border-slate-200">
              {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                {usuario.nome || 'Meu Perfil'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{usuario.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações da Casa Monitorada */}
        <div className="mt-4 space-y-3">
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                <Home className="w-4 h-4 text-slate-600" />
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
                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition shadow-xs"
              >
                {usuario.residencia || usuario.endereco ? "Alterar" : "+ Cadastrar"}
              </button>
            </div>
            {usuario.residencia || usuario.endereco ? (
              <div className="text-[11px] text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-900 text-xs">
                  {usuario.residencia?.endereco || usuario.endereco}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="bg-white text-slate-700 px-2.5 py-0.5 rounded-md font-medium border border-slate-200">
                    Altitude: <strong>{(usuario.residencia?.cota || usuario.cota_terreno || 20.0).toFixed(1)}m</strong>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md font-medium ${
                    ((usuario.residencia?.cota || 20.0) - cotaAtual) > 2.0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                      : ((usuario.residencia?.cota || 20.0) - cotaAtual) > 0
                        ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                        : 'bg-rose-50 text-rose-800 border border-rose-200/80'
                  }`}>
                    {((usuario.residencia?.cota || 20.0) - cotaAtual) > 0
                      ? `Seguro (+${((usuario.residencia?.cota || 20.0) - cotaAtual).toFixed(1)}m de margem)`
                      : `Atenção (${Math.abs((usuario.residencia?.cota || 20.0) - cotaAtual).toFixed(1)}m submerso)`}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Nenhum endereço salvo. Clique em <strong>+ Cadastrar</strong> para vincular sua residência aos alertas em tempo real.
              </p>
            )}
          </div>

          {/* Outros Pontos de Interesse Monitorados */}
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                <MapPin className="w-4 h-4 text-slate-600" />
                <span>Outros Locais Monitorados ({pontos.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setAdicionandoPonto(!adicionandoPonto)}
                className="text-[11px] font-semibold text-slate-800 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition shadow-xs flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Adicionar</span>
              </button>
            </div>

            {adicionandoPonto && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 text-xs shadow-xs animate-in fade-in">
                {/* Campo CEP opcional */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-medium text-slate-700">Buscar por CEP (Opcional)</label>
                    {buscandoCepPonto && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={9}
                    placeholder="Ex: 95913-518"
                    value={novoCep}
                    onChange={(e) => handleBuscarCepPonto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition"
                  />
                </div>

                <div className="relative">
                  <label className="text-[11px] font-medium text-slate-700 block mb-1">Local / Rua / Referência</label>
                  <input
                    type="text"
                    placeholder="Digite ex: Univates, Bento Gonçalves, CEAT, HBB..."
                    value={novoEndereco}
                    onChange={(e) => handleBuscarSugestoesPonto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition"
                  />

                  {/* Sugestões Automáticas em Tempo Real */}
                  {sugestoesPonto.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      <div className="p-2 bg-slate-50 flex items-center justify-between text-[10px] text-slate-500 font-medium border-b border-slate-100">
                        <span>Locais calibrados encontrados</span>
                        <button
                          type="button"
                          onClick={() => setSugestoesPonto([])}
                          className="text-slate-400 hover:text-slate-700 px-1 font-semibold"
                        >
                          Fechar
                        </button>
                      </div>
                      {sugestoesPonto.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelecionarSugestaoPonto(s)}
                          className="text-xs p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate">{s.nome}</p>
                            <p className="text-[10px] text-slate-500 truncate">{s.detalhe}</p>
                          </div>
                          {s.cota && (
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                              {s.cota.toFixed(1)}m
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 block mb-1">Nome / Identificador</label>
                  <input
                    type="text"
                    placeholder="Ex: Trabalho, Escola, Comércio..."
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-[11px] font-medium text-slate-700 block mb-1">Cota Altimétrica (metros)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={novaCota}
                      onChange={(e) => setNovaCota(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition"
                    />
                  </div>
                  {novasCoords && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium pt-5">
                      <Check size={13} className="text-emerald-600" />
                      <span>Posicionado</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={() => {
                      setAdicionandoPonto(false);
                      setSugestoesPonto([]);
                    }}
                    className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium py-2 rounded-xl text-xs transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarPonto}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-xl text-xs active:scale-95 transition shadow-sm"
                  >
                    Salvar Local
                  </button>
                </div>
              </div>
            )}

            {pontos.length === 0 && !adicionandoPonto && (
              <p className="text-[11px] text-slate-500">
                Nenhum ponto adicional cadastrado. Adicione seu trabalho ou escola para acompanhar cotas e rotas de segurança.
              </p>
            )}

            {pontos.map((p) => {
              const margem = p.cota - cotaAtual;
              const isLivre = margem > 0;
              return (
                <div key={p.id} className="p-2.5 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between text-xs shadow-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 truncate">{p.nome}</p>
                    <p className="text-[11px] text-slate-500 truncate">{p.endereco} • Cota: {p.cota}m</p>
                    <p className="text-[11px] font-medium mt-0.5">
                      <span className={isLivre ? "text-emerald-700" : "text-rose-700"}>
                        {isLivre ? `+${margem.toFixed(1)}m livres` : `Submerso por ${Math.abs(margem).toFixed(1)}m`}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoverPonto(p.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                    title="Remover ponto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Seção Opcional de Perfil Demográfico para Prevenção */}
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <User size={13} className="text-slate-500" />
                  <span>Perfil Demográfico (Opcional)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Estatísticas anônimas para planejamento de evacuação e defesa civil no Vale do Taquari.
                </p>
              </div>
              {demoSalvaMsg && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Salvo
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Faixa Etária</label>
                <select
                  value={faixaEtaria}
                  onChange={(e) => setFaixaEtaria(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
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
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Gênero</label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
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
                className="w-full mt-1 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold py-1.5 rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-sm"
              >
                {salvandoDemo ? 'Salvando...' : 'Salvar Informações'}
              </button>
            )}
          </div>

          {/* Dados LGPD */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-700">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
              <Shield className="w-3.5 h-3.5 text-slate-700" />
              <span>Conformidade LGPD Ativa</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Seus dados de geolocalização e contato são utilizados unicamente para os alertas hidrológicos do Rio Taquari.
            </p>
          </div>

          {erro && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {erro}
            </div>
          )}

          {/* Links Institucionais e LGPD */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <button
              onClick={() => {
                onClose();
                if (onAbrirSobre) onAbrirSobre();
              }}
              className="hover:text-slate-900 transition"
            >
              Sobre o FloodWay
            </button>
            <span>•</span>
            <button
              onClick={() => {
                onClose();
                if (onAbrirPolitica) onAbrirPolitica();
              }}
              className="hover:text-slate-900 transition"
            >
              Política de Privacidade
            </button>
            <span>•</span>
            <button
              onClick={() => {
                onClose();
                if (onAbrirTermos) onAbrirTermos();
              }}
              className="hover:text-slate-900 transition"
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
                  className="hover:text-slate-900 font-semibold text-slate-700 transition"
                >
                  Modo Teste / Simulação
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
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-slate-600" />
              <span>Sair da Conta</span>
            </button>

            {!confirmandoExclusao ? (
              <button
                onClick={() => setConfirmandoExclusao(true)}
                className="w-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-medium py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Meus Dados (Direito LGPD Art. 18)</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                <p className="text-[11px] text-rose-800 font-medium text-center">
                  Tem certeza? Todos os seus dados e locais monitorados serão apagados permanentemente.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmandoExclusao(false)}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleExcluirConta}
                    disabled={excluindo}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg text-xs font-semibold"
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
