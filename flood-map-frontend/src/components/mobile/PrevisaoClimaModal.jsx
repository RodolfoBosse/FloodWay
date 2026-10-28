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
    <div style={{ zIndex: 3500 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl transition-all max-h-[92vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                Previsão do Tempo
              </h3>
              <p className="text-[11px] text-gray-500">Lajeado/RS • Vale do Taquari</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Atual em Destaque */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
            <CloudRain size={120} />
          </div>

          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase opacity-90 block mb-1">
                Agora em Lajeado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight">
                  {current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : 20}°
                </span>
                <span className="text-sm font-medium opacity-80">
                  Sensação {current.apparent_temperature !== undefined ? Math.round(current.apparent_temperature) : 20}°
                </span>
              </div>
              <p className="text-xs font-semibold mt-1">
                {getWeatherDescription(current.weather_code)}
              </p>
            </div>

            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              {getWeatherIcon(current.weather_code, 32)}
            </div>
          </div>

          {/* Indicadores complementares (Chuva, Vento, Umidade) */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-center relative z-10 text-[11px]">
            <div className="bg-white/10 rounded-xl py-1.5 px-1">
              <div className="flex items-center justify-center gap-1 opacity-80 mb-0.5">
                <Droplets size={12} />
                <span>Chuva</span>
              </div>
              <span className="font-bold text-xs">{current.precipitation || 0} mm</span>
            </div>
            <div className="bg-white/10 rounded-xl py-1.5 px-1">
              <div className="flex items-center justify-center gap-1 opacity-80 mb-0.5">
                <Wind size={12} />
                <span>Vento</span>
              </div>
              <span className="font-bold text-xs">{current.wind_speed_10m || 0} km/h</span>
            </div>
            <div className="bg-white/10 rounded-xl py-1.5 px-1">
              <div className="flex items-center justify-center gap-1 opacity-80 mb-0.5">
                <Droplets size={12} />
                <span>Umidade</span>
              </div>
              <span className="font-bold text-xs">{current.relative_humidity_2m || 0}%</span>
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
