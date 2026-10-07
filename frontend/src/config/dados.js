// =============================================================
// config/dados.js — Listas fixas usadas pelo front-end.
//
// Por que isso fica no front? A API atual ainda não tem rotas para
// listar comunidades nem o calendário completo. Enquanto essas rotas
// não existirem, o front usa estas listas. Quando o back-end criar
// as rotas, basta trocar a origem dos dados nos arquivos de services/.
// =============================================================

// -------------------------------------------------------------
// COMUNIDADES
// O cadastro da agricultora exige "comunidadeId" (número).
// ⚠️ Os IDs abaixo PRECISAM existir na tabela "Comunidade" do banco.
// Combine com a equipe de back-end (Karol e João) os IDs e nomes reais.
// -------------------------------------------------------------
export const COMUNIDADES = [
  { id: 1, nome: 'Comunidade 1' },
  { id: 2, nome: 'Comunidade 2' },
  { id: 3, nome: 'Comunidade 3' },
];

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
// CALENDÁRIO DE REFERÊNCIA (Tela 5)
// Valores do wireframe. São usados só se a API não responder
// (ex.: sem internet ou espécie ainda não cadastrada no banco).
// -------------------------------------------------------------
export const CALENDARIO_REFERENCIA = [
  { especie: 'Milho', epocaPlantio: 'set–nov', epocaColheita: 'fev–mar' },
  { especie: 'Mandioca', epocaPlantio: 'o ano todo', epocaColheita: '8–12 meses' },
  { especie: 'Feijão', epocaPlantio: 'fev / ago', epocaColheita: '75–90 dias' },
  { especie: 'Abóbora', epocaPlantio: 'ago–out', epocaColheita: '3–4 meses' },
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