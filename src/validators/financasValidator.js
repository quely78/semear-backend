const { ErroApi, erroDeValidacao } = require('../utils/erros');
const { lerData, hojeMais, lerNumero } = require('./plantioValidator');

// Mesmas listas do front (frontend/src/utils/dinheiro.js)
const CATEGORIAS_GASTO = ['SEMENTE', 'ADUBO', 'MAO_DE_OBRA', 'TRANSPORTE', 'OUTRO'];
const CANAIS_VENDA = ['FEIRA', 'PNAE', 'ATRAVESSADOR', 'OUTRO'];

const VALOR_MAXIMO = 1_000_000; // R$ por gasto
const PRECO_KG_MAXIMO = 10_000; // R$ por kg
const DESCRICAO_MAXIMA = 120;

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const vazio = (valor) => valor === undefined || valor === null || valor === '';

/**
 * Dinheiro digitado → número em reais. Aceita 12.5, "12,50", "R$ 1.234,56".
 * Devolve NaN se não for um valor.
 */
function lerDinheiro(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor !== 'string') return NaN;
  let limpo = valor.replace(/R\$/i, '').replace(/\s/g, '');
  // Formato brasileiro: ponto separa milhar e vírgula separa centavos
  if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.');
  return limpo ? Number(limpo) : NaN;
}

/** Valor em reais com no máximo 2 casas (texto, que o Prisma grava como Decimal exato). */
const paraDecimal = (numero) => (Math.round(numero * 100) / 100).toFixed(2);

/** Id de um gasto/venda na URL: inteiro positivo, senão "não encontrado". */
function lerIdDoItem(valor, nome) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new ErroApi(404, `${nome} não encontrado.`);
  return id;
}

/** Data de um gasto ou venda: real e não pode estar no futuro. */
function erroDaData(valor, data) {
  if (vazio(valor)) return 'Informe a data.';
  if (!data) return 'Data inválida. Use o formato AAAA-MM-DD.';
  if (data > hojeMais(0)) return 'A data não pode estar no futuro.';
  return '';
}

/**
 * Corpo de "anotar gasto".
 * @throws {ErroApi} 400 com { campos }
 */
function validarGasto(body = {}) {
  const campos = {};

  const categoria = texto(body.categoria).toUpperCase();
  if (!CATEGORIAS_GASTO.includes(categoria)) campos.categoria = 'Escolha com o que foi o gasto.';

  const valor = lerDinheiro(body.valor);
  if (vazio(body.valor)) campos.valor = 'Informe quanto custou.';
  else if (!Number.isFinite(valor)) campos.valor = 'O valor precisa ser um número (ex.: 25,50).';
  else if (valor < 0.01) campos.valor = 'O valor precisa ser maior que zero.';
  else if (valor > VALOR_MAXIMO) campos.valor = 'O valor está grande demais. Confira.';

  const data = lerData(body.data);
  const erroData = erroDaData(body.data, data);
  if (erroData) campos.data = erroData;

  const descricao = texto(body.descricao);
  if (descricao.length > DESCRICAO_MAXIMA) {
    campos.descricao = `A observação pode ter no máximo ${DESCRICAO_MAXIMA} caracteres.`;
  }

  if (Object.keys(campos).length) throw erroDeValidacao(campos);
  return { categoria, valor: paraDecimal(valor), data, descricao: descricao || null };
}

/**
 * Corpo de "registrar venda".
 * @param {object} limites
 * @param {Date} limites.dataColheita  não dá para vender antes de colher
 * @param {number} limites.kgDisponiveis  o que ainda está no estoque
 * @throws {ErroApi} 400 com { campos }
 */
function validarVenda(body = {}, { dataColheita, kgDisponiveis }) {
  const campos = {};

  const kg = lerNumero(body.quantidadeKg);
  const disponivel = Math.round(kgDisponiveis * 10) / 10;
  if (!Number.isFinite(kg) || kg <= 0) campos.quantidadeKg = 'Informe quantos kg você vendeu.';
  else if (kg > disponivel + 1e-9) {
    campos.quantidadeKg = `Você só tem ${disponivel.toLocaleString('pt-BR')} kg no estoque deste plantio.`;
  }

  const preco = lerDinheiro(body.precoKg);
  if (vazio(body.precoKg)) campos.precoKg = 'Informe o preço do kg.';
  else if (!Number.isFinite(preco)) campos.precoKg = 'O preço precisa ser um número (ex.: 5,00).';
  else if (preco < 0.01) campos.precoKg = 'O preço precisa ser maior que zero.';
  else if (preco > PRECO_KG_MAXIMO) campos.precoKg = 'O preço está grande demais. Confira.';

  const canal = texto(body.canal).toUpperCase();
  if (!CANAIS_VENDA.includes(canal)) campos.canal = 'Escolha onde você vendeu.';

  const data = lerData(body.data);
  const erroData = erroDaData(body.data, data);
  if (erroData) campos.data = erroData;
  else if (data < dataColheita) campos.data = 'A venda não pode ser antes da colheita.';

  if (Object.keys(campos).length) throw erroDeValidacao(campos);
  return { quantidadeKg: kg, precoKg: paraDecimal(preco), canal, data };
}

/** Período (?dataInicio=&dataFim=) dos resumos. Sem datas = tudo. */
function validarPeriodo(query = {}) {
  const campos = {};
  const periodo = {};
  for (const chave of ['dataInicio', 'dataFim']) {
    if (vazio(query[chave])) continue;
    const data = lerData(query[chave]);
    if (!data) campos[chave] = 'Data inválida. Use o formato AAAA-MM-DD.';
    else periodo[chave] = data;
  }
  if (periodo.dataInicio && periodo.dataFim && periodo.dataInicio > periodo.dataFim) {
    campos.dataFim = 'A data final precisa ser depois da inicial.';
  }
  if (Object.keys(campos).length) throw erroDeValidacao(campos);
  return periodo;
}

module.exports = {
  CATEGORIAS_GASTO,
  CANAIS_VENDA,
  validarGasto,
  validarVenda,
  validarPeriodo,
  lerIdDoItem,
  lerDinheiro,
};
