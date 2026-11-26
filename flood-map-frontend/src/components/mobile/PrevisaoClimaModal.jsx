import React, { useState, useEffect, useMemo } from 'react';
import {
  CloudRain, Sun, Cloud, CloudLightning, Wind, Droplets, Calendar,
  X, AlertTriangle, Clock, Waves, Radio, ExternalLink, Compass, ShieldAlert
} from 'lucide-react';

export default function PrevisaoClimaModal({ isOpen, onClose, dadosClima, dadosClimaBacia }) {
  const [abaAtiva, setAbaAtiva] = useState('geral'); // 'geral' | 'cabeceiras' | 'satelite'
  const [camadaSatelite, setCamadaSatelite] = useState('EXTENT3'); // 'EXTENT3' (Raios GLM) | 'GEOCOLOR'
  const [alertasInmet, setAlertasInmet] = useState([]);

  // Busca alertas oficiais do INMET para o RS ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;
    let ativo = true;
    const controller = new AbortController();

    fetch('https://radarmeteorologico.com.br/api/v1/alertas?uf=RS', {
      signal: controller.signal
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!ativo || !Array.isArray(data)) return;
        const relevantes = data.filter((alerta) => {
          const texto = JSON.stringify(alerta).toLowerCase();
          return (
            texto.includes('lajeado') ||
            texto.includes('estrela') ||
            texto.includes('taquari') ||
            texto.includes('todo o estado') ||
            texto.includes('encosta')
          );
        });
        setAlertasInmet(relevantes.slice(0, 2));
      })
      .catch(() => {});

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [isOpen]);

  const current = dadosClima?.current || {};
  const daily = dadosClima?.daily || {};
  const hourly = dadosClima?.hourly || {};

  // Próximas 24 horas a partir da hora atual
  const proximas24Horas = useMemo(() => {
    if (!hourly?.time?.length) return [];
    const agoraMs = Date.now() - 3600000; // tolerância de 1h
    const lista = [];
    for (let i = 0; i < hourly.time.length; i++) {
      const tMs = new Date(hourly.time[i]).getTime();
      if (tMs >= agoraMs) {
        lista.push({
          time: hourly.time[i],
          horaLabel: hourly.time[i].slice(11, 16),
          temp: hourly.temperature_2m?.[i],
          chuva: hourly.precipitation?.[i] ?? 0,
          prob: hourly.precipitation_probability?.[i] ?? 0,
          code: hourly.weather_code?.[i] ?? 3,
        });
        if (lista.length >= 24) break;
      }
    }
    return lista;
  }, [hourly]);

  // Cálculo dinâmico do Risco Hidrológico nas Cabeceiras
  const analiseCabeceiras = useMemo(() => {
    const calcPonto = (dados, nome, subtitulo, tempoTransito) => {
      const d = dados?.daily;
      if (!d?.precipitation_sum) {
        return { nome, subtitulo, tempoTransito, hoje: 0, prox48h: 0, total7d: 0 };
      }
      const hoje = d.precipitation_sum[0] || 0;
      const amanha = d.precipitation_sum[1] || 0;
      const total7d = d.precipitation_sum.reduce((acc, v) => acc + (v || 0), 0);
      return {
        nome,
        subtitulo,
        tempoTransito,
        hoje: Number(hoje.toFixed(1)),
        prox48h: Number((hoje + amanha).toFixed(1)),
        total7d: Number(total7d.toFixed(1)),
      };
    };

    const pontos = [
      calcPonto(dadosClimaBacia?.lajeado || dadosClima, 'Lajeado', 'Baixo Taquari (Local)', 'Drenagem urbana imediata'),
      calcPonto(dadosClimaBacia?.santaTereza, 'Santa Tereza / Bento', 'Rio das Antas', 'Impacto em ~14h a 18h'),
      calcPonto(dadosClimaBacia?.guapore, 'Guaporé / Carreiro', 'Cabeceira Norte', 'Impacto em ~18h a 24h'),
    ];

    const maxCabeceira48h = Math.max(pontos[1].prox48h, pontos[2].prox48h);
    let nivelRisco = {
      label: 'Baixo / Normal',
      cor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      badge: 'bg-emerald-600 text-white',
      desc: 'Volumes previstos nas cabeceiras não indicam repique expressivo no Rio Taquari.'
    };

    if (maxCabeceira48h >= 100) {
      nivelRisco = {
        label: 'Crítico',
        cor: 'bg-red-50 border-red-200 text-red-900',
        badge: 'bg-red-600 text-white',
        desc: 'Volumes severos (>100mm em 48h) nas cabeceiras. Alto risco de elevação rápida e cheia.'
      };
    } else if (maxCabeceira48h >= 65) {
      nivelRisco = {
        label: 'Alerta',
        cor: 'bg-orange-50 border-orange-200 text-orange-900',
        badge: 'bg-orange-600 text-white',
        desc: 'Chuva forte nas cabeceiras (65–100mm). Tendência de subida relevante nas próximas 24h.'
      };
    } else if (maxCabeceira48h >= 35) {
      nivelRisco = {
        label: 'Atenção',
        cor: 'bg-amber-50 border-amber-200 text-amber-900',
        badge: 'bg-amber-500 text-white',
        desc: 'Volumes moderados (35–65mm) na Serra podem causar elevação de 1m a 3m em Lajeado.'
      };
    }

    return { pontos, nivelRisco, maxCabeceira48h };
  }, [dadosClima, dadosClimaBacia]);

  if (!isOpen) return null;

  const getWeatherIcon = (code, size = 20) => {
    if (code === 0) return <Sun size={size} className="text-amber-500" />;
    if (code === 1 || code === 2) return <Cloud size={size} className="text-amber-400" />;
    if (code === 3) return <Cloud size={size} className="text-gray-400" />;
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain size={size} className="text-blue-500" />;
    if ([95, 96, 99].includes(code)) return <CloudLightning size={size} className="text-purple-600" />;
    return <CloudRain size={size} className="text-blue-400" />;
  };

  const getWeatherDescription = (code) => {
    if (code === 0) return 'Céu limpo';
    if (code === 1 || code === 2) return 'Parcialmente nublado';
    if (code === 3) return 'Nublado';
    if ([51, 53, 55].includes(code)) return 'Garoa leve';
    if ([61, 63, 65].includes(code)) return 'Chuva';
    if ([80, 81, 82].includes(code)) return 'Pancadas de chuva';
    if ([95, 96, 99].includes(code)) return 'Tempestade com trovoadas';
    return 'Chuvoso';
  };

  const getWindDirection = (deg) => {
    if (deg === undefined || deg === null) return '';
    const dirs = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const formatDayName = (dateStr) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const hoje = new Date();
      if (d.toDateString() === hoje.toDateString()) return 'Hoje';
      return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
    } catch (e) {
      return dateStr;
    }
  };

  const sateliteUrl = camadaSatelite === 'EXTENT3'
    ? 'https://cdn.star.nesdis.noaa.gov/GOES19/GLM/SECTOR/ssa/EXTENT3/latest.jpg'
    : 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/ssa/GEOCOLOR/latest.jpg';

  return (
    <div style={{ zIndex: 3500 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl transition-all max-h-[92vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900 text-base leading-tight">
              Central Meteorológica & Bacia
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Lajeado, Cabeceiras & Satélite NOAA</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas Internas */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl mt-3">
          <button
            type="button"
            onClick={() => setAbaAtiva('geral')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              abaAtiva === 'geral' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={13} />
            <span>Geral & 24h</span>
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('cabeceiras')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              abaAtiva === 'cabeceiras' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Waves size={13} />
            <span>Cabeceiras</span>
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('satelite')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              abaAtiva === 'satelite' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio size={13} />
            <span>Satélite</span>
          </button>
        </div>

        {/* Alertas INMET ativos (se houver) */}
        {alertasInmet.length > 0 && (
          <div className="mt-3 space-y-2">
            {alertasInmet.map((alerta, i) => (
              <div key={i} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-950">{alerta.evento || alerta.severidade || 'Aviso Meteorológico INMET'}</p>
                  {alerta.descricao && (
                    <p className="text-[11px] text-rose-800 mt-0.5 line-clamp-2">{alerta.descricao}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA 1: GERAL & 24H */}
        {abaAtiva === 'geral' && (
          <div className="animate-in fade-in duration-200">
            {/* Card Atual em Destaque */}
            <div className="mt-3 p-5 rounded-2xl bg-slate-900 text-white shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className="text-xs font-medium text-slate-400 block mb-1">
                    Temperatura Atual em Lajeado
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-light tracking-tight tabular-nums">
                      {current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : 20}°
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      Sensação {current.apparent_temperature !== undefined ? Math.round(current.apparent_temperature) : 20}°
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    {getWeatherDescription(current.weather_code)}
                  </p>
                </div>

                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                  {getWeatherIcon(current.weather_code, 28)}
                </div>
              </div>

              {/* Indicadores complementares */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center relative z-10 text-xs">
                <div className="bg-slate-800/80 rounded-xl py-2 px-1">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <Droplets size={12} />
                    <span>Chuva</span>
                  </div>
                  <span className="font-semibold text-xs text-white">{current.precipitation || 0} mm</span>
                </div>
                <div className="bg-slate-800/80 rounded-xl py-2 px-1">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <Wind size={12} />
                    <span>Vento {getWindDirection(current.wind_direction_10m)}</span>
                  </div>
                  <span className="font-semibold text-xs text-white">
                    {current.wind_speed_10m ? Math.round(current.wind_speed_10m) : 0} km/h
                  </span>
                  {current.wind_gusts_10m > 0 && (
                    <span className="block text-[9px] text-slate-400">
                      Rajadas {Math.round(current.wind_gusts_10m)} km/h
                    </span>
                  )}
                </div>
                <div className="bg-slate-800/80 rounded-xl py-2 px-1">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                    <CloudRain size={12} />
                    <span>Umidade</span>
                  </div>
                  <span className="font-semibold text-xs text-white">{current.relative_humidity_2m || 0}%</span>
                </div>
              </div>
            </div>

            {/* Carrossel Hora a Hora (Próximas 24h) */}
            {proximas24Horas.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600" />
                  <span>Próximas 24 Horas</span>
                </h4>
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                  {proximas24Horas.map((h) => (
                    <div
                      key={h.time}
                      className="snap-start shrink-0 w-16 bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-1.5 flex flex-col items-center text-center"
                    >
                      <span className="text-[10px] font-semibold text-slate-500">{h.horaLabel}</span>
                      <div className="my-1">{getWeatherIcon(h.code, 18)}</div>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        {h.temp !== undefined ? Math.round(h.temp) : '--'}°
                      </span>
                      <span className={`text-[9px] font-semibold mt-0.5 ${h.chuva > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                        {h.chuva > 0 ? `${h.chuva.toFixed(1)}mm` : `${h.prob}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previsão Próximos 7 Dias */}
            <div className="mt-3">
              <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                <span>Previsão para os Próximos 7 Dias</span>
              </h4>

              <div className="space-y-1.5 divide-y divide-gray-100">
                {daily.time && daily.time.map((dia, idx) => {
                  const chuvaDia = daily.precipitation_sum?.[idx] || 0;
                  const chuvaAlta = chuvaDia >= 30;
                  return (
                    <div key={dia} className={`pt-2 pb-1 flex items-center justify-between text-xs ${chuvaAlta ? 'bg-amber-50/60 px-2 rounded-lg' : ''}`}>
                      <div className="w-24 font-semibold text-gray-700 capitalize text-[11px]">
                        {formatDayName(dia)}
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-500 min-w-[65px]">
                        {getWeatherIcon(daily.weather_code[idx], 16)}
                        <span className="text-[10px] text-blue-600 font-bold">
                          {daily.precipitation_probability_max?.[idx] > 0 ? `${daily.precipitation_probability_max[idx]}%` : '0%'}
                        </span>
                      </div>

                      <div className={`text-[11px] w-16 text-right font-medium ${chuvaAlta ? 'text-amber-700 font-bold' : 'text-gray-500'}`}>
                        {chuvaDia > 0 ? `${chuvaDia.toFixed(1)}mm` : 'Sem chuva'}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px] min-w-[65px] justify-end">
                        <span className="text-red-600 font-bold">
                          {Math.round(daily.temperature_2m_max[idx])}°
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="text-blue-600 font-bold">
                          {Math.round(daily.temperature_2m_min[idx])}°
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: CABECEIRAS (IMPACTO NO RIO TAQUARI) */}
        {abaAtiva === 'cabeceiras' && (
          <div className="mt-3 space-y-3 animate-in fade-in duration-200">
            {/* Termômetro de Risco Hidrológico */}
            <div className={`p-3.5 rounded-2xl border ${analiseCabeceiras.nivelRisco.cor}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Waves size={15} />
                  Risco Hidrológico (Cabeceiras 48h)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${analiseCabeceiras.nivelRisco.badge}`}>
                  {analiseCabeceiras.nivelRisco.label}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {analiseCabeceiras.nivelRisco.desc}
              </p>
            </div>

            {/* Comparativo dos 3 pontos da Bacia */}
            <div className="space-y-2.5">
              {analiseCabeceiras.pontos.map((pt) => (
                <div key={pt.nome} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{pt.nome}</h5>
                      <p className="text-[10px] text-slate-500">{pt.subtitulo} • {pt.tempoTransito}</p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                      7 dias: {pt.total7d} mm
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white rounded-lg p-2 border border-slate-200/60 flex justify-between">
                      <span className="text-slate-500">Hoje:</span>
                      <span className="font-bold text-slate-800">{pt.hoje} mm</span>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-slate-200/60 flex justify-between">
                      <span className="text-slate-500">Próx. 48h:</span>
                      <span className={`font-bold ${pt.prox48h >= 40 ? 'text-amber-600' : 'text-slate-800'}`}>
                        {pt.prox48h} mm
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-[10px] text-amber-900 leading-relaxed">
              <strong>Como funciona:</strong> A chuva que cai em Lajeado afeta principalmente a drenagem urbana. Já as enchentes do Rio Taquari são causadas pelo volume acumulado na Serra Gaúcha (Santa Tereza, Guaporé e Antas), que leva de <strong>12 a 24 horas</strong> para chegar até aqui.
            </div>
          </div>
        )}

        {/* ABA 3: SATÉLITE GOES-19 (NOAA) & RADAR DEFESA CIVIL RS */}
        {abaAtiva === 'satelite' && (
          <div className="mt-3 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Compass size={14} className="text-blue-600" />
                <span>Satélite GOES-19 (NOAA Direto)</span>
              </h4>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setCamadaSatelite('EXTENT3')}
                  className={`px-2 py-1 rounded-md transition ${camadaSatelite === 'EXTENT3' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  Raios (GLM)
                </button>
                <button
                  type="button"
                  onClick={() => setCamadaSatelite('GEOCOLOR')}
                  className={`px-2 py-1 rounded-md transition ${camadaSatelite === 'GEOCOLOR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  Nuvens (GeoColor)
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 relative">
              <img
                src={sateliteUrl}
                alt="Satélite GOES-19 América do Sul"
                className="w-full h-56 object-cover"
                loading="lazy"
              />
              <div className="p-2 bg-slate-900/90 text-[10px] text-slate-300 flex justify-between items-center">
                <span>Fonte direta: NOAA / NESDIS STAR (Setor Sul)</span>
                <a
                  href="https://www.star.nesdis.noaa.gov/goes/sector.php?sat=G19&sector=ssa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <span>Ampliar</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Acesso Direto ao Radar da Defesa Civil RS */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-900">Radar Meteorológico (Defesa Civil RS)</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Cobertura em tempo real (raio de 150 km) a partir do Morro da Polícia, atualizado a cada 5 min.
                </p>
              </div>
              <a
                href="https://www.defesacivil.rs.gov.br/monitoramento-radar-meteorologico"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              >
                <span>Abrir Radar</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
          <span>Fontes diretas: Open-Meteo, NOAA GOES-19, INMET & Defesa Civil RS</span>
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800 font-bold"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
