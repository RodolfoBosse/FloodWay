/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'flood-normal': '#10b981',    // Green
        'flood-alert': '#f59e0b',     // Amber
        'flood-critical': '#ef4444',  // Red
        'flood-severe': '#7c2d12',    // Dark red
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
