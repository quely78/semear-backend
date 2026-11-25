// =============================================================
// config/dados.js — Listas fixas usadas pelo front-end.
//
// As comunidades vêm da API (GET /comunidades). Aqui ficam só as listas
// que são do próprio app (espécies sugeridas e períodos dos filtros).
// =============================================================

// -------------------------------------------------------------
// ESPÉCIES
// Lista provisória usada no campo "Espécie" e nos filtros.
// Atualizar quando sair a pesquisa das espécies mais cultivadas
// em Rio Preto da Eva (plano de investigação).
// O nome precisa ser IGUAL ao cadastrado na tabela CalendarioAgricola
// para que a consulta do calendário funcione.
// -------------------------------------------------------------
export const ESPECIES = ['Milho', 'Mandioca', 'Feijão', 'Abóbora'];

// Valor especial do <select> que libera um campo de texto livre
export const OUTRA_ESPECIE = '__outra__';

// -------------------------------------------------------------
// TIPOS DE CULTIVO (botões de opção da Tela 4)
// "valor" é o que vai para a API; "rotulo" é o que aparece na tela.
// -------------------------------------------------------------
export const TIPOS_CULTIVO = [
  { valor: 'orgânico', rotulo: 'Orgânico' },
  { valor: 'convencional', rotulo: 'Convencional' },
];

// -------------------------------------------------------------
// FILTRO POR PERÍODO (Tela 3 — "Filtrar por data")
// "dias" = quantos dias para trás a partir de hoje. null = sem filtro.
// Usamos períodos prontos porque são mais fáceis de tocar no celular
// do que escolher duas datas.
// -------------------------------------------------------------
export const PERIODOS = [
  { valor: '', rotulo: 'Todas as datas', dias: null },
  { valor: '30', rotulo: 'Últimos 30 dias', dias: 30 },
  { valor: '90', rotulo: 'Últimos 3 meses', dias: 90 },
  { valor: '365', rotulo: 'Último ano', dias: 365 },
];
