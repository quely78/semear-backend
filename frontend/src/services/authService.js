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

/**
 * Troca a senha da usuária logada.
 * Usada depois de entrar com uma senha provisória (gerada pela responsável).
 */
export function trocarSenha(senhaAtual, novaSenha) {
  return requisicao('/auth/trocar-senha', { method: 'POST', body: { senhaAtual, novaSenha } });
}

/** Esqueci minha senha: pede o link por e-mail. */
export function pedirLinkPorEmail(contato) {
  return requisicao('/auth/esqueci-senha', { method: 'POST', body: { contato } });
}

/** Confere se o link do e-mail ainda vale (antes de mostrar o formulário). */
export function validarLinkDeSenha(token) {
  return requisicao('/auth/redefinir-senha/validar', { method: 'POST', body: { token } });
}

/** Cria a senha nova usando o link do e-mail. */
export function criarSenhaPeloLink(token, novaSenha) {
  return requisicao('/auth/redefinir-senha', { method: 'POST', body: { token, novaSenha } });
}
