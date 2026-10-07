// =============================================================
// context/AuthContext.jsx — Guarda "quem está logada" para o app todo.
//
// Qualquer tela pode usar:  const { usuario, entrar, sair } = useAuth();
// =============================================================
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { limparSessao, obterToken, obterUsuarioSalvo, salvarSessao } from '../services/api';
import * as authService from '../services/authService';

// Cria o "canal" de autenticação
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Ao abrir o app, recupera a sessão salva (se houver token e usuária)
  const [usuario, setUsuario] = useState(() => (obterToken() ? obterUsuarioSalvo() : null));

  /** Faz login na API e guarda a sessão. Devolve a usuária logada. */
  const entrar = useCallback(async (contato, senha) => {
    const { token, usuario: dadosUsuario } = await authService.login(contato, senha);
    salvarSessao(token, dadosUsuario);
    setUsuario(dadosUsuario);
    return dadosUsuario;
  }, []);

  /** Encerra a sessão. */
  const sair = useCallback(() => {
    limparSessao();
    setUsuario(null);
  }, []);

  // Quando a API responde 401 (token vencido), api.js dispara este evento.
  // Aqui "escutamos" e deslogamos — as rotas protegidas levam ao login.
  useEffect(() => {
    const aoExpirar = () => setUsuario(null);
    window.addEventListener('semear:sessao-expirada', aoExpirar);
    return () => window.removeEventListener('semear:sessao-expirada', aoExpirar);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair }}>{children}</AuthContext.Provider>
  );
}

/** Atalho para usar o contexto nas telas. */
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return contexto;
}