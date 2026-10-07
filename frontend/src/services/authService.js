// =============================================================
// services/authService.js — Cadastro e login.
// Rotas do back-end usadas:
//   POST /auth/cadastro  → cria a conta
//   POST /auth/login     → devolve { token, usuario }
// =============================================================
import { requisicao } from './api';

/**
 * Cadastra uma nova usuária.
 * @param {{nome:string, contato:string, senha:string, comunidadeId:number, tipo?:string}} dados
 */
export function cadastrar(dados) {
  return requisicao('/auth/cadastro', {
    method: 'POST',
    // A tela de cadastro é da agricultora (RF01), por isso o tipo padrão.
    body: { tipo: 'AGRICULTORA', ...dados },
  });
}

/**
 * Faz login com contato (telefone/e-mail) e senha.
 * @returns {Promise<{token:string, usuario:{id:number,nome:string,contato:string,tipo:string}}>}
 */
export function login(contato, senha) {
  return requisicao('/auth/login', { method: 'POST', body: { contato, senha } });
}