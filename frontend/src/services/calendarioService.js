// =============================================================
// services/calendarioService.js — Calendário agrícola (RF07).
// Rota do back-end usada:
//   GET /calendario/:especie → { especie, epocaPlantio, epocaColheita }
// =============================================================
import { requisicao } from './api';
import { CALENDARIO_REFERENCIA, ESPECIES } from '../config/dados';

/** Consulta o calendário de UMA espécie na API. */
export function consultarEspecie(especie) {
  return requisicao(`/calendario/${encodeURIComponent(especie)}`);
}

/**
 * Monta a tabela completa do calendário.
 * Como a API só consulta uma espécie por vez, pedimos todas em paralelo.
 * Se alguma falhar (sem internet ou não cadastrada), usamos o valor
 * de referência do wireframe (config/dados.js).
 *
 * @returns {Promise<{linhas: Array, usouReferencia: boolean}>}
 */
export async function carregarCalendario() {
  // Promise.allSettled espera todas, mesmo que algumas deem erro
  const resultados = await Promise.allSettled(ESPECIES.map(consultarEspecie));

  let usouReferencia = false;

  const linhas = ESPECIES.map((especie, indice) => {
    const resultado = resultados[indice];
    if (resultado.status === 'fulfilled') return resultado.value;

    // Falhou: procura na tabela de referência local
    usouReferencia = true;
    return (
      CALENDARIO_REFERENCIA.find((item) => item.especie === especie) || {
        especie,
        epocaPlantio: '—',
        epocaColheita: '—',
      }
    );
  });

  return { linhas, usouReferencia };
}