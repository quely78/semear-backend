// =============================================================
// services/calendarioService.js — Calendário agrícola de uma espécie.
//   GET /calendario/:especie → { especie, epocaPlantio, mesesPlantio, ... }
// A comparação com a data do plantio fica em utils/epocaPlantio.js.
// =============================================================
import { requisicao } from './api';

export function buscarCalendarioDaEspecie(especie) {
  return requisicao(`/calendario/${encodeURIComponent(especie)}`);
}
