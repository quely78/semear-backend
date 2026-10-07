// =============================================================
// vite.config.js — Configuração do Vite (servidor de desenvolvimento
// e empacotamento do front-end).
// =============================================================
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Plugin oficial que habilita JSX e o recarregamento rápido do React
  plugins: [react()],

  server: {
    // Porta do front em desenvolvimento (o back-end usa a 3000)
    port: 5173,
    // Abre o navegador automaticamente ao rodar "npm run dev"
    open: true,
  },
});