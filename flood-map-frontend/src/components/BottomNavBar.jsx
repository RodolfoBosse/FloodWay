import React from 'react';
import { Home, GitFork, LineChart, Sliders } from 'lucide-react';

export default function BottomNavBar({ activeTab = 'mapa', onTabChange }) {
  const tabs = [
    { id: 'mapa', label: 'Mapa', icon: Home },
    { id: 'rotas', label: 'Rotas', icon: GitFork },
    { id: 'graficos', label: 'Gráficos', icon: LineChart },
    { id: 'simular', label: 'Simular', icon: Sliders },
  ];

  return (
    <nav className="bottom-nav-container">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange && onTabChange(tab.id)}
          >
            <Icon size={22} className="nav-icon" />
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}