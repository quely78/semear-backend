// =============================================================
// services/financasService.js — Gastos, vendas e resumos.
//   GET    /plantios/:id/financas        → { plantio, gastos, vendas, resumo }
//   POST   /plantios/:id/gastos          → anota um gasto (devolve as finanças)
//   DELETE /plantios/:id/gastos/:gastoId → apaga um gasto
//   POST   /plantios/:id/vendas          → anota uma venda (precisa da colheita)
//   DELETE /plantios/:id/vendas/:vendaId → apaga uma venda
//   GET    /financas?dataInicio=&dataFim=          → todos os plantios (agricultora)
//   GET    /coordenadora/financas?dataInicio=&dataFim= → totais da comunidade
// =============================================================
import { requisicao } from './api';

const comPeriodo = (caminho, { dataInicio, dataFim } = {}) => {
  const params = new URLSearchParams();
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  const query = params.toString();
  return `${caminho}${query ? `?${query}` : ''}`;
};

export const buscarFinancasDoPlantio = (id) => requisicao(`/plantios/${id}/financas`);

/** dados = { categoria, valor, data: "AAAA-MM-DD", descricao? } */
export const anotarGasto = (id, dados) =>
  requisicao(`/plantios/${id}/gastos`, { method: 'POST', body: dados });

export const apagarGasto = (id, gastoId) =>
  requisicao(`/plantios/${id}/gastos/${gastoId}`, { method: 'DELETE' });

/** dados = { quantidadeKg, precoKg, canal, data: "AAAA-MM-DD" } */
export const anotarVenda = (id, dados) =>
  requisicao(`/plantios/${id}/vendas`, { method: 'POST', body: dados });

export const apagarVenda = (id, vendaId) =>
  requisicao(`/plantios/${id}/vendas/${vendaId}`, { method: 'DELETE' });

export const buscarResumoDaAgricultora = (periodo) => requisicao(comPeriodo('/financas', periodo));

export const buscarResumoDaComunidade = (periodo) =>
  requisicao(comPeriodo('/coordenadora/financas', periodo));
