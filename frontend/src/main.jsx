// =============================================================
// main.jsx — Ponto de entrada. Monta o React dentro de <div id="root">.
// =============================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
// Estilos globais (cores, fontes e componentes da identidade visual)
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter: permite trocar de tela pela URL (/login, /plantios...) */}
    <BrowserRouter>
      {/* AuthProvider: deixa a usuária logada disponível em todas as telas */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);