import React, { useState } from 'react';
import { CloudRain, MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

export default function BottomSheetInfo({
  cidade = "Lajeado RS",
  temperatura = "13°",
  cotaAtual = 13.84,
  cotaInundacao = 19.00,
  suaCota = 26.00,
  nivelAlerta = 23.00,
  ruasBloqueadas = 0,
  status = "Normal", // "Normal" | "Alerta" | "Inundação"
  alertaRota = null, // Ex: { mensagem: "Sua rota está com bloqueios", count: 3 }
}) {
  const [expanded, setExpanded] = useState(false);

  const isInundacao = status === "Inundação" || cotaAtual >= cotaInundacao;

  return (
    <div className={`bottom-sheet-wrapper ${expanded ? 'expanded' : 'collapsed'}`}>
      {/* Banner de Alerta de Rota (Opcional, estilo topo vermelho) */}
      {alertaRota && (
        <div className="route-alert-banner">
          <span>{alertaRota.mensagem}</span>
          <span className="badge-count">{alertaRota.count}</span>
        </div>
      )}

      <div className="bottom-sheet-card">
        {/* Handle superior para arrastar / alternar */}
        <div className="drag-handle-container" onClick={() => setExpanded(!expanded)}>
          <div className="drag-handle" />
        </div>

        {/* Cabeçalho: Cidade, Clima e Ações */}
        <div className="sheet-header">
          <div className="city-title">{cidade}</div>
          <div className="sheet-header-actions">
            <div className="weather-info">
              <CloudRain size={18} />
              <span>{temperatura}</span>
            </div>
            <button className="btn-more">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Grade de Estatísticas e Cotas */}
        <div className="metrics-grid">
          {/* Coluna Esquerda */}
          <div className="metric-col">
            <div className="metric-group">
              <span className="metric-label">Cota atual</span>
              <span className="metric-value-huge">{cotaAtual.toFixed(2)}m</span>
            </div>

            <div className="metric-group">
              <span className="metric-label">Cota de inundação</span>
              <span className="metric-value-medium">{cotaInundacao.toFixed(2)}m</span>
            </div>

            <div className="metric-group">
              <span className="metric-label">Sua cota</span>
              <span className="metric-value-medium">{suaCota.toFixed(2)}m</span>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="metric-col">
            <div className="metric-group">
              <span className={`status-pill ${isInundacao ? 'danger' : 'success'}`}>
                {status}
              </span>
            </div>

            <div className="metric-group">
              <span className="metric-label">Ruas bloqueadas</span>
              <span className={`metric-value-blocked ${ruasBloqueadas > 0 ? 'blocked-danger' : ''}`}>
                {ruasBloqueadas}
              </span>
            </div>

            <div className="metric-group">
              <span className="metric-label">Nível de alerta</span>
              <span className="metric-value-medium">{nivelAlerta.toFixed(2)}m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}