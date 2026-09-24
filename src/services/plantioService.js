const prisma = require('../config/prisma');

function validarDados(dados) {
  const { especie, dataPlantio, area, tipoCultivo } = dados;

  if (!especie || !dataPlantio || area === undefined || !tipoCultivo) {
    throw new Error('especie, dataPlantio, area e tipoCultivo são obrigatórios.');
  }

  const areaNumerica = Number(area);
  if (!Number.isFinite(areaNumerica) || areaNumerica <= 0) {
    throw new Error('area deve ser um número maior que zero.');
  }

  const data = new Date(dataPlantio);
  if (Number.isNaN(data.getTime())) {
    throw new Error('dataPlantio inválida.');
  }

  return { especie, dataPlantio: data, area: areaNumerica, tipoCultivo };
}

async function criar(dados, agricultoraId) {
  const data = validarDados(dados);
  return prisma.plantio.create({ data: { ...data, agricultoraId } });
}

async function listar(agricultoraId, filtros) {
  const where = { agricultoraId };
  if (filtros.especie) where.especie = { contains: filtros.especie, mode: 'insensitive' };
  if (filtros.dataInicio || filtros.dataFim) {
    where.dataPlantio = {};
    if (filtros.dataInicio) where.dataPlantio.gte = new Date(filtros.dataInicio);
    if (filtros.dataFim) where.dataPlantio.lte = new Date(filtros.dataFim);
  }

  return prisma.plantio.findMany({ where, orderBy: { dataPlantio: 'desc' } });
}

async function editar(id, dados, agricultoraId) {
  const existente = await prisma.plantio.findFirst({ where: { id: Number(id), agricultoraId } });
  if (!existente) throw new Error('Plantio não encontrado.');
  return prisma.plantio.update({ where: { id: Number(id) }, data: validarDados(dados) });
}

async function excluir(id, agricultoraId) {
  const existente = await prisma.plantio.findFirst({ where: { id: Number(id), agricultoraId } });
  if (!existente) throw new Error('Plantio não encontrado.');
  await prisma.plantio.delete({ where: { id: Number(id) } });
}

module.exports = { criar, listar, editar, excluir };
