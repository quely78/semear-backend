// =============================================================
// services/plantioService.js — CRUD de plantios (RF03 a RF06).
// Todas as rotas exigem login (token enviado por api.js).
//   GET    /plantios?especie=&dataInicio=&dataFim=  → lista
//   POST   /plantios        → cria
//   PUT    /plantios/:id    → edita
//   DELETE /plantios/:id    → exclui
// =============================================================
import { requisicao } from './api';

/**
 * Lista os plantios da agricultora logada.
 * @param {{especie?:string, dataInicio?:string, dataFim?:string}} filtros
 */
export function listarPlantios(filtros = {}) {
  // Monta a "query string" só com os filtros preenchidos
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor) params.append(chave, valor);
  });
  const query = params.toString();
  return requisicao(`/plantios${query ? `?${query}` : ''}`);
}

/**
 * Busca um plantio pelo id.
 * A API ainda não tem GET /plantios/:id, então buscamos a lista
 * da própria agricultora e procuramos o item nela.
 */
export async function buscarPlantio(id) {
  const lista = await listarPlantios();
  return lista.find((plantio) => String(plantio.id) === String(id)) || null;
}

/** Cria um plantio. dados = { especie, dataPlantio, area, tipoCultivo } */
export function criarPlantio(dados) {
  return requisicao('/plantios', { method: 'POST', body: dados });
}

/** Edita um plantio existente. */
export function editarPlantio(id, dados) {
  return requisicao(`/plantios/${id}`, { method: 'PUT', body: dados });
}

/** Exclui um plantio. */
export function excluirPlantio(id) {
  return requisicao(`/plantios/${id}`, { method: 'DELETE' });
}