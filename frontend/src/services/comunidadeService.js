// =============================================================
// services/comunidadeService.js — Dados das comunidades.
//   GET  /comunidades                      → lista pública (cadastro)
//   GET  /coordenadora/agricultoras        → agricultoras da comunidade da responsável
//   GET  /coordenadora/plantios            → plantios da comunidade (com as vendas: data e kg)
//   POST /coordenadora/agricultoras/:id/redefinir-senha → senha provisória
// =============================================================
import { requisicao } from './api';

/** Lista as comunidades para o campo "Comunidade" do cadastro. */
export function listarComunidades() {
  return requisicao('/comunidades');
}

/**
 * Todos os plantios da comunidade da responsável logada (com o nome da agricultora).
 * Usado no estoque da comunidade.
 */
export async function listarPlantiosDaComunidade() {
  const dados = await requisicao('/coordenadora/plantios');
  return { comunidade: dados?.comunidade || null, plantios: dados?.plantios || [] };
}

/**
 * A responsável gera uma senha provisória para uma agricultora da comunidade.
 * @returns {Promise<{senhaProvisoria:string, agricultora:{id:number,nome:string}}>}
 */
export function redefinirSenhaAgricultora(agricultoraId) {
  return requisicao(`/coordenadora/agricultoras/${agricultoraId}/redefinir-senha`, { method: 'POST' });
}

/** Busca a comunidade da responsável logada e suas agricultoras. */
export async function listarAgricultorasDaComunidade() {
  const dados = await requisicao('/coordenadora/agricultoras');
  return {
    comunidade: dados?.comunidade || null,
    agricultoras: dados?.agricultoras || [],
  };
}
