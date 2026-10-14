import React from 'react';
import { Search, Bell, User } from 'lucide-react';

export default function TopSearchBar({ onSearch, onNotificationClick, onProfileClick }) {
  return (
    <div className="top-search-container">
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Pesquisar rota, local, ponto..."
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>
      <button className="top-action-btn" onClick={onNotificationClick} title="Notificações">
        <Bell size={20} />
      </button>
      <button className="top-action-btn" onClick={onProfileClick} title="Perfil">
        <User size={20} />
      </button>
    </div>
  );
}