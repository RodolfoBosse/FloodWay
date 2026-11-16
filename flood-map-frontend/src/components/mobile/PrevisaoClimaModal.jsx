import React from 'react';
import { CloudRain, Sun, Cloud, CloudLightning, Wind, Droplets, Calendar, X, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

export default function PrevisaoClimaModal({ isOpen, onClose, dadosClima }) {
  if (!isOpen) return null;

  const current = dadosClima?.current || {};
  const daily = dadosClima?.daily || {};
  const hourly = dadosClima?.hourly || {};

  const getWeatherIcon = (code, size = 20) => {
    // WMO Weather interpretation codes
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

  return (
    <div style={{ zIndex: 3500 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all max-h-[92vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900 text-base leading-tight">
              Previsão Meteorológica
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Lajeado & Vale do Taquari</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Atual em Destaque */}
        <div className="mt-4 p-5 rounded-2xl bg-slate-900 text-white shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Temperatura Atual
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

          {/* Indicadores complementares (Chuva, Vento, Umidade) */}
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
                <span>Vento</span>
              </div>
              <span className="font-semibold text-xs text-white">{current.wind_speed_10m ? Math.round(current.wind_speed_10m) : 0} km/h</span>
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

        {/* Impacto no Rio Taquari */}
        <div className="mt-4 p-3 bg-amber-50/90 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950 mb-0.5">Relação Chuva × Nível do Rio</p>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              Volumes acima de 40mm/dia nas cabeceiras (Serra Gaúcha / Guaporé / Forqueta) causam subida no Rio Taquari em 12 a 24 horas.
            </p>
          </div>
        </div>

        {/* Previsão Próximos 7 Dias */}
        <div className="mt-4">
          <h4 className="text-xs font-bold text-gray-900 mb-2.5 flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-600" />
            <span>Previsão para os Próximos 7 Dias</span>
          </h4>

          <div className="space-y-1.5 divide-y divide-gray-100">
            {daily.time && daily.time.map((dia, idx) => (
              <div key={dia} className="pt-2 pb-1 flex items-center justify-between text-xs">
                <div className="w-24 font-semibold text-gray-700 capitalize text-[11px]">
                  {formatDayName(dia)}
                </div>

                <div className="flex items-center gap-1.5 text-gray-500 min-w-[70px]">
                  {getWeatherIcon(daily.weather_code[idx], 16)}
                  <span className="text-[10px] text-blue-600 font-bold">
                    {daily.precipitation_probability_max?.[idx] > 0 ? `${daily.precipitation_probability_max[idx]}%` : '0%'}
                  </span>
                </div>

                <div className="text-[11px] text-gray-500 w-16 text-right">
                  {daily.precipitation_sum?.[idx] > 0 ? `${daily.precipitation_sum[idx].toFixed(1)}mm` : 'Sem chuva'}
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
            ))}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
          <span>Dados meteorológicos: Open-Meteo & ECMWF</span>
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

