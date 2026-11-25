// =============================================================
// services/financasService.js — Gastos, vendas e resumos.
//   GET    /plantios/:id/financas        → { plantio, gastos, vendas, resumo }
//   POST   /plantios/:id/gastos          → anota um gasto (devolve as finanças)
//   PUT    /plantios/:id/gastos/:gastoId → edita um gasto
//   DELETE /plantios/:id/gastos/:gastoId → apaga um gasto
//   POST   /plantios/:id/vendas          → anota uma venda (precisa da colheita)
//   PUT    /plantios/:id/vendas/:vendaId → edita uma venda
//   DELETE /plantios/:id/vendas/:vendaId → apaga uma venda
//   GET    /financas?dataInicio=&dataFim=          → todos os plantios (agricultora)
//   GET    /coordenadora/financas?dataInicio=&dataFim= → totais da comunidade
// =============================================================
import { requisicao } from './api';
import { enviarOuGuardar } from './filaOffline';

const comPeriodo = (caminho, { dataInicio, dataFim } = {}) => {
  const params = new URLSearchParams();
  if (dataInicio) params.append('dataInicio', dataInicio);
  if (dataFim) params.append('dataFim', dataFim);
  const query = params.toString();
  return `${caminho}${query ? `?${query}` : ''}`;
};

export const buscarFinancasDoPlantio = (id) => requisicao(`/plantios/${id}/financas`);

/** dados = { categoria, valor, data: "AAAA-MM-DD", descricao? } */
/** Sem internet, fica guardado e é enviado depois (devolve { pendente: true }). */
export const anotarGasto = (id, dados) =>
  enviarOuGuardar(`/plantios/${id}/gastos`, {
    method: 'POST',
    body: dados,
    descricao: `Gasto de R$ ${Number(dados.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  });

/** Edita um gasto (mesmo corpo de anotarGasto). */
export const editarGasto = (id, gastoId, dados) =>
  requisicao(`/plantios/${id}/gastos/${gastoId}`, { method: 'PUT', body: dados });

export const apagarGasto = (id, gastoId) =>
  requisicao(`/plantios/${id}/gastos/${gastoId}`, { method: 'DELETE' });

/** dados = { quantidadeKg, precoKg, canal, data: "AAAA-MM-DD" } */
/** Sem internet, fica guardado e é enviado depois (devolve { pendente: true }). */
export const anotarVenda = (id, dados) =>
  enviarOuGuardar(`/plantios/${id}/vendas`, {
    method: 'POST',
    body: dados,
    descricao: `Venda de ${dados.quantidadeKg} kg`,
  });

/** Edita uma venda (mesmo corpo de anotarVenda). */
export const editarVenda = (id, vendaId, dados) =>
  requisicao(`/plantios/${id}/vendas/${vendaId}`, { method: 'PUT', body: dados });

export const apagarVenda = (id, vendaId) =>
  requisicao(`/plantios/${id}/vendas/${vendaId}`, { method: 'DELETE' });

export const buscarResumoDaAgricultora = (periodo) => requisicao(comPeriodo('/financas', periodo));

export const buscarResumoDaComunidade = (periodo) =>
  requisicao(comPeriodo('/coordenadora/financas', periodo));
