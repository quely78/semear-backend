// =============================================================
// services/dashboardService.js — Painel da comunidade (RF08/RF09).
//
// ⚠️ A API atual ainda NÃO tem a rota do painel da comunidade.
// Este arquivo já está pronto para ela: assim que o back-end criar
//   GET /dashboard/comunidade
// devolvendo o formato abaixo, o painel passa a mostrar a comunidade:
//   {
//     areaTotal: 312,                 // soma das áreas (m²)
//     agricultorasAtivas: 18,         // quantas têm plantio cadastrado
//     especies: [ { especie: 'Milho', area: 120, quantidade: 5 }, ... ]
//   }
//
// Enquanto a rota não existir, calculamos os mesmos números só com os
// plantios da própria agricultora (para a tela não ficar vazia).
// =============================================================
import { requisicao } from './api';
import { listarPlantios } from './plantioService';

/**
 * Agrupa uma lista de plantios por espécie e calcula os totais.
 * Exportada para poder ser reaproveitada em outras telas.
 */
export function resumirPlantios(plantios) {
  const porEspecie = {};

  plantios.forEach((plantio) => {
    const nome = plantio.especie;
    if (!porEspecie[nome]) porEspecie[nome] = { especie: nome, area: 0, quantidade: 0 };
    porEspecie[nome].area += Number(plantio.area) || 0;
    porEspecie[nome].quantidade += 1;
  });

  return {
    areaTotal: plantios.reduce((soma, p) => soma + (Number(p.area) || 0), 0),
    // Ordena da maior área para a menor (fica melhor no gráfico)
    especies: Object.values(porEspecie).sort((a, b) => b.area - a.area),
  };
}

/**
 * Carrega os indicadores do painel.
 * @param {string} tipoUsuaria 'AGRICULTORA' ou 'COORDENADORA'
 * @returns {Promise<{origem:'comunidade'|'pessoal'|'indisponivel', dados:object|null}>}
 */
export async function carregarPainel(tipoUsuaria) {
  // 1ª tentativa: rota oficial da comunidade
  try {
    const dados = await requisicao('/dashboard/comunidade');
    return { origem: 'comunidade', dados };
  } catch (erro) {
    // Qualquer erro que não seja "rota não existe" (404) é repassado
    if (erro.status !== 404) throw erro;
  }

  // 2ª tentativa (provisória): números pessoais da agricultora.
  // A coordenadora não tem plantios, então não há o que calcular.
  if (tipoUsuaria !== 'AGRICULTORA') return { origem: 'indisponivel', dados: null };

  const plantios = await listarPlantios();
  return { origem: 'pessoal', dados: resumirPlantios(plantios) };
}