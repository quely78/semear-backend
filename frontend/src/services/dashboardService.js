// =============================================================
// services/dashboardService.js — Painel da comunidade (RF08/RF09).
//   GET /dashboard/comunidade (agricultora ou responsável)
//   → { comunidade, areaTotal, agricultorasAtivas, totalEspecies,
//       especies: [{ especie, area, quantidade }] }
// =============================================================
import { requisicao } from './api';

/** Números gerais da comunidade da usuária logada. */
export async function carregarPainel() {
  return { origem: 'comunidade', dados: await requisicao('/dashboard/comunidade') };
}
