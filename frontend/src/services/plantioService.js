// =============================================================
// services/plantioService.js — CRUD de plantios (RF03 a RF06).
// Todas as rotas exigem login (token enviado por api.js).
//   GET    /plantios?especie=&dataInicio=&dataFim=  → lista
//   POST   /plantios        → cria
//   PUT    /plantios/:id    → edita
//   GET    /plantios/:id    → busca um plantio
//   DELETE /plantios/:id    → exclui
// =============================================================
import { requisicao } from './api';
import { enviarOuGuardar } from './filaOffline';

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
 */
export function buscarPlantio(id) {
  return requisicao(`/plantios/${id}`);
}

/** Cria um plantio. dados = { especie, dataPlantio, area, tipoCultivo } */
/**
 * Cria um plantio. Sem internet, fica guardado no celular e é enviado depois:
 * nesse caso devolve { pendente: true }.
 */
export function criarPlantio(dados) {
  return enviarOuGuardar('/plantios', {
    method: 'POST',
    body: dados,
    descricao: `Plantio de ${dados.especie} (${dados.area} m²)`,
  });
}

/** Edita um plantio existente. */
export function editarPlantio(id, dados) {
  return requisicao(`/plantios/${id}`, { method: 'PUT', body: dados });
}

/**
 * Registra a colheita (saída do estoque).
 * dados = { dataColheita: "AAAA-MM-DD", quantidadeColhida: número em kg }
 */
export function registrarColheita(id, dados) {
  return requisicao(`/plantios/${id}/colheita`, { method: 'PUT', body: dados });
}

/** Desfaz uma colheita registrada por engano. */
export function desfazerColheita(id) {
  return requisicao(`/plantios/${id}/colheita`, { method: 'DELETE' });
}

/** Exclui um plantio. */
export function excluirPlantio(id) {
  return requisicao(`/plantios/${id}`, { method: 'DELETE' });
}
