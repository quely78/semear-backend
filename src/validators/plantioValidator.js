const { ErroApi, erroDeValidacao } = require('../utils/erros');

// Mesmas regras do front (frontend/src/utils/validacoes.js), mais limites contra valores absurdos
const ESPECIE_MAXIMA = 60;
const AREA_MAXIMA = 10_000_000; // m² (1.000 hectares)
const KG_MAXIMO = 1_000_000;
const TIPOS_CULTIVO = { organico: 'orgânico', convencional: 'convencional' };

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/** "AAAA-MM-DD" de uma data real (31/02 não passa). Devolve Date (meia-noite UTC) ou null. */
function lerData(valor) {
  if (typeof valor !== 'string') return null;
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!partes) return null;
  const [ano, mes, dia] = partes.slice(1).map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const existe = data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
  return existe && ano >= 2000 ? data : null;
}

/** Hoje (meia-noite UTC) somado de N meses. */
function hojeMais(meses = 0) {
  const agora = new Date();
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() + meses, agora.getUTCDate()));
}

/** Número com vírgula ou ponto ("12,5"). */
function lerNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && valor.trim()) return Number(valor.trim().replace(',', '.'));
  return NaN;
}

/** Id da URL (/plantios/:id): inteiro positivo, senão "não encontrado". */
function lerIdDoPlantio(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new ErroApi(404, 'Plantio não encontrado.');
  return id;
}

/**
 * Corpo de criar/editar plantio.
 * @throws {ErroApi} 400 com { campos }
 */
function validarPlantio(body = {}) {
  const campos = {};

  const especie = texto(body.especie);
  if (!especie) campos.especie = 'Informe a espécie.';
  else if (especie.length > ESPECIE_MAXIMA) campos.especie = `A espécie pode ter no máximo ${ESPECIE_MAXIMA} caracteres.`;

  const dataPlantio = lerData(body.dataPlantio);
  if (!body.dataPlantio) campos.dataPlantio = 'Informe a data de plantio.';
  else if (!dataPlantio) campos.dataPlantio = 'Data inválida. Use o formato AAAA-MM-DD.';
  else if (dataPlantio > hojeMais(12)) campos.dataPlantio = 'A data pode ser no máximo 12 meses no futuro (RN03).';

  const area = lerNumero(body.area);
  if (body.area === undefined || body.area === null || body.area === '') campos.area = 'Informe a área plantada.';
  else if (!Number.isFinite(area)) campos.area = 'A área precisa ser um número.';
  else if (area <= 0) campos.area = 'A área deve ser positiva (RN02).';
  else if (area > AREA_MAXIMA) campos.area = 'A área está grande demais. Confira o valor em m².';

  const chaveTipo = texto(body.tipoCultivo)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const tipoCultivo = TIPOS_CULTIVO[chaveTipo];
  if (!tipoCultivo) campos.tipoCultivo = 'Escolha orgânico ou convencional.';

  if (Object.keys(campos).length) throw erroDeValidacao(campos);
  return { especie, dataPlantio, area, tipoCultivo };
}

/**
 * Corpo do registro de colheita.
 * @param {Date} dataPlantio  a colheita não pode ser antes do plantio
 */
function validarColheita(body = {}, dataPlantio) {
  const campos = {};

  const data = lerData(body.dataColheita);
  if (!body.dataColheita) campos.dataColheita = 'Informe a data da colheita.';
  else if (!data) campos.dataColheita = 'Data inválida. Use o formato AAAA-MM-DD.';
  else if (data > hojeMais(0)) campos.dataColheita = 'A data da colheita não pode estar no futuro.';
  else if (data < dataPlantio) campos.dataColheita = 'A colheita não pode ser antes do plantio.';

  const kg = lerNumero(body.quantidadeColhida);
  if (!Number.isFinite(kg) || kg <= 0) campos.quantidadeColhida = 'Informe quantos quilos foram colhidos.';
  else if (kg > KG_MAXIMO) campos.quantidadeColhida = 'A quantidade está grande demais. Confira o valor em kg.';

  if (Object.keys(campos).length) throw erroDeValidacao(campos);
  return { dataColheita: data, quantidadeColhida: kg };
}

/** Filtros da listagem (?especie=&dataInicio=&dataFim=). */
function validarFiltros(query = {}) {
  const campos = {};
  const filtros = {};

  const especie = texto(query.especie);
  if (especie.length > ESPECIE_MAXIMA) campos.especie = 'Filtro de espécie longo demais.';
  else if (especie) filtros.especie = especie;

  for (const chave of ['dataInicio', 'dataFim']) {
    if (!query[chave]) continue;
    const data = lerData(query[chave]);
    if (!data) campos[chave] = 'Data inválida. Use o formato AAAA-MM-DD.';
    else filtros[chave] = data;
  }

  if (Object.keys(campos).length) throw erroDeValidacao(campos);
  return filtros;
}

module.exports = { validarPlantio, validarColheita, validarFiltros, lerIdDoPlantio };
