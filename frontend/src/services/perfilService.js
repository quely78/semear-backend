// =============================================================
// services/perfilService.js — Perfil da usuária logada.
//   GET /perfil  → { id, nome, contato, tipo, comunidade, criadoEm }
//   PUT /perfil  → atualiza nome e contato; devolve o perfil novo
// =============================================================
import { requisicao } from './api';

export function obterPerfil() {
  return requisicao('/perfil');
}

/** dados = { nome, contato } */
export function salvarPerfil(dados) {
  return requisicao('/perfil', { method: 'PUT', body: dados });
}
