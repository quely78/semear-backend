const prisma = require('../config/prisma');
const { ErroApi, erroDeValidacao } = require('../utils/erros');
const {
  validarPlantio,
  validarColheita,
  validarFiltros,
  lerIdDoPlantio,
} = require('../validators/plantioValidator');

// Toda consulta usa o id da agricultora que vem do TOKEN: uma agricultora nunca
// enxerga nem altera plantio de outra (para ela, o plantio "não existe": 404).

/** Plantio da própria agricultora, ou 404. */
async function plantioDaAgricultora(id, agricultoraId) {
  const plantio = await prisma.plantio.findFirst({
    where: { id: lerIdDoPlantio(id), agricultoraId },
  });
  if (!plantio) throw new ErroApi(404, 'Plantio não encontrado.');
  return plantio;
}

async function criar(dados, agricultoraId) {
  const data = validarPlantio(dados);
  return prisma.plantio.create({ data: { ...data, agricultoraId } });
}

async function listar(agricultoraId, query) {
  const filtros = validarFiltros(query);
  const where = { agricultoraId };
  if (filtros.especie) where.especie = { contains: filtros.especie, mode: 'insensitive' };
  if (filtros.dataInicio || filtros.dataFim) {
    where.dataPlantio = {};
    if (filtros.dataInicio) where.dataPlantio.gte = filtros.dataInicio;
    if (filtros.dataFim) where.dataPlantio.lte = filtros.dataFim;
  }

  return prisma.plantio.findMany({ where, orderBy: { dataPlantio: 'desc' } });
}

async function editar(id, dados, agricultoraId) {
  const existente = await plantioDaAgricultora(id, agricultoraId);
  const data = validarPlantio(dados);

  // Plantio já colhido: a nova data de plantio não pode ficar depois da colheita
  if (existente.dataColheita && data.dataPlantio > existente.dataColheita) {
    const msg = 'Este plantio já foi colhido: a data de plantio não pode ser depois da colheita.';
    throw new ErroApi(400, msg, { dataPlantio: msg });
  }

  return prisma.plantio.update({ where: { id: existente.id }, data });
}

async function excluir(id, agricultoraId) {
  const existente = await plantioDaAgricultora(id, agricultoraId);
  await prisma.plantio.delete({ where: { id: existente.id } });
}

// Colheita = saída do estoque. Fica no próprio plantio (dataColheita + quantidadeColhida em kg).
/** Vendas já anotadas do plantio: kg vendidos e a data da primeira venda. */
async function vendasDoPlantio(plantioId) {
  const { _sum, _min } = await prisma.venda.aggregate({
    where: { plantioId },
    _sum: { quantidadeKg: true },
    _min: { data: true },
  });
  return { kgVendidos: _sum.quantidadeKg || 0, primeiraVenda: _min.data };
}

async function registrarColheita(id, dados, agricultoraId) {
  const existente = await plantioDaAgricultora(id, agricultoraId);
  const colheita = validarColheita(dados, existente.dataPlantio);

  // Com vendas anotadas, a colheita não pode ficar menor que o vendido nem depois da 1ª venda
  const { kgVendidos, primeiraVenda } = await vendasDoPlantio(existente.id);
  const campos = {};
  if (colheita.quantidadeColhida < kgVendidos) {
    campos.quantidadeColhida = `Você já vendeu ${kgVendidos.toLocaleString('pt-BR')} kg deste plantio.`;
  }
  if (primeiraVenda && colheita.dataColheita > primeiraVenda) {
    campos.dataColheita = 'A colheita não pode ser depois da primeira venda anotada.';
  }
  if (Object.keys(campos).length) throw erroDeValidacao(campos);

  return prisma.plantio.update({ where: { id: existente.id }, data: colheita });
}

async function desfazerColheita(id, agricultoraId) {
  const existente = await plantioDaAgricultora(id, agricultoraId);
  const { kgVendidos } = await vendasDoPlantio(existente.id);
  if (kgVendidos > 0) {
    throw new ErroApi(400, 'Este plantio já tem vendas anotadas. Apague as vendas antes de desfazer a colheita.');
  }
  return prisma.plantio.update({
    where: { id: existente.id },
    data: { dataColheita: null, quantidadeColhida: null },
  });
}

module.exports = { criar, listar, editar, excluir, registrarColheita, desfazerColheita };
