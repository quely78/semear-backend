// =============================================================
// services/api.js — Função central para conversar com a API.
//
// Todas as chamadas ao back-end passam por aqui. Assim, regras como
// "enviar o token" e "tratar erros" ficam escritas em um lugar só.
// =============================================================

// Endereço da API. Vem do arquivo .env (VITE_API_URL).
// Se não houver .env, usa o endereço padrão do back-end em desenvolvimento.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Chaves usadas para guardar a sessão no navegador
const CHAVE_TOKEN = 'semear_token';
const CHAVE_USUARIO = 'semear_usuario';

// ---------- Funções de sessão (token + dados da usuária) ----------

/** Lê o token salvo no navegador (ou null se não houver). */
export function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN);
}

/** Lê os dados da usuária logada (ou null). */
export function obterUsuarioSalvo() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO) || 'null');
  } catch {
    // Se o conteúdo estiver corrompido, consideramos que não há sessão
    return null;
  }
}

/** Salva token e usuária depois do login. */
export function salvarSessao(token, usuario) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

/** Apaga a sessão (logout). */
export function limparSessao() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
}

// ---------- Erro personalizado ----------

/**
 * Erro da API que carrega também o código HTTP (status),
 * para as telas saberem, por exemplo, se foi 404 ou 401.
 */
export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

// ---------- Requisição ----------

/**
 * Faz uma requisição para a API.
 * @param {string} caminho  ex.: '/plantios'
 * @param {object} opcoes   { method, body } — body pode ser um objeto JS
 * @returns {Promise<any>}  os dados em JSON devolvidos pela API
 */
export async function requisicao(caminho, opcoes = {}) {
  const { method = 'GET', body } = opcoes;

  // Cabeçalhos: sempre JSON e, se houver login, o token "Bearer"
  const headers = { 'Content-Type': 'application/json' };
  const token = obterToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch só "quebra" assim quando não há conexão ou o servidor está fora
    throw new ErroApi('Sem conexão com o servidor. Verifique sua internet e tente de novo.', 0);
  }

  // 204 = sucesso sem conteúdo (ex.: ao excluir um plantio)
  if (resposta.status === 204) return null;

  // Tenta ler o JSON. Se a resposta não for JSON, usa objeto vazio.
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    // 401 com token = sessão expirada (o token da API vale 1 dia).
    // Avisamos o app inteiro para voltar à tela de login.
    if (resposta.status === 401 && token) {
      limparSessao();
      window.dispatchEvent(new Event('semear:sessao-expirada'));
    }
    throw new ErroApi(dados.message || 'Não foi possível concluir. Tente novamente.', resposta.status);
  }

  return dados;
}