/**
 * Configuração centralizada da URL da API do Backend.
 * Na Vercel ou quando servido pelo mesmo domínio, usa URLs relativas ""
 * para que funções serverless (/api/cota) e rewrites funcionem nativamente sem bloqueio de CORS.
 */
export const API_BASE = (import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : (typeof window !== "undefined" && window.location.hostname !== "localhost" ? "" : "http://localhost:8000")
).replace(/\/$/, "");
