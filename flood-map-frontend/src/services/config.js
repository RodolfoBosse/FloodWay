/**
 * Configuração centralizada da URL da API do Backend.
 * Se houver variável VITE_API_URL (na Vercel), ela é usada.
 * Senão, faz fallback para localhost:8000 no desenvolvimento local.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

