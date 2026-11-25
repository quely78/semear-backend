const prisma = require('../config/prisma');
const { ErroApi } = require('../utils/erros');

/** Comunidade da usuária logada (agricultora ou responsável). */
async function comunidadeDaUsuaria(usuario) {
  const tabela = usuario.tipo === 'AGRICULTORA' ? prisma.agricultora : prisma.coordenadora;
  const registro = await tabela.findUnique({
    where: { id: usuario.id },
    select: { comunidade: { select: { id: true, nome: true } } },
  });

  if (!registro?.comunidade) {
    throw new ErroApi(404, 'Você ainda não está ligada a nenhuma comunidade.');
  }
  return registro.comunidade;
}

/** Lista pública das comunidades (usada no cadastro). */
function listarComunidades() {
  return prisma.comunidade.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } });
}

/** Agricultoras da comunidade da responsável, com totais de plantio. */
async function agricultorasDaComunidade(usuario) {
  const comunidade = await comunidadeDaUsuaria(usuario);
  const agricultoras = await prisma.agricultora.findMany({
    where: { comunidadeId: comunidade.id },
    select: {
      id: true,
      nome: true,
      contato: true,
      plantios: { select: { area: true, dataColheita: true } },
    },
    orderBy: { nome: 'asc' },
  });

  return {
    comunidade,
    agricultoras: agricultoras.map(({ plantios, ...agricultora }) => ({
      ...agricultora,
      totalPlantios: plantios.length,
      areaTotal: plantios.reduce((soma, p) => soma + p.area, 0),
      // área ainda na terra (plantios sem colheita registrada)
      areaEmCampo: plantios.filter((p) => !p.dataColheita).reduce((soma, p) => soma + p.area, 0),
    })),
  };
}

/** Todos os plantios da comunidade (estoque da responsável). */
async function plantiosDaComunidade(usuario) {
  const comunidade = await comunidadeDaUsuaria(usuario);
  const plantios = await prisma.plantio.findMany({
    where: { agricultora: { comunidadeId: comunidade.id } },
    include: {
      agricultora: { select: { id: true, nome: true } },
      // Vendas = saída do estoque colhido. Só data e kg: o dinheiro fica com a agricultora.
      vendas: { select: { data: true, quantidadeKg: true }, orderBy: { data: 'desc' } },
    },
    orderBy: { dataPlantio: 'desc' },
  });
  return { comunidade, plantios };
}

/**
 * Números do painel da comunidade (área, agricultoras ativas, espécies).
 * As somas e contagens são feitas pelo banco (aggregate / groupBy / count),
 * sem trazer todos os plantios para o Node.
 */
async function painelDaComunidade(usuario) {
  const comunidade = await comunidadeDaUsuaria(usuario);
  const filtro = { agricultora: { comunidadeId: comunidade.id } };

  const [total, porEspecie, agricultorasAtivas] = await Promise.all([
    prisma.plantio.aggregate({ where: filtro, _sum: { area: true } }),
    prisma.plantio.groupBy({
      by: ['especie'],
      where: filtro,
      _sum: { area: true },
      _count: { _all: true },
      orderBy: { _sum: { area: 'desc' } },
    }),
    prisma.agricultora.count({
      where: { comunidadeId: comunidade.id, plantios: { some: {} } },
    }),
  ]);

  return {
    comunidade,
    areaTotal: total._sum.area ?? 0,
    agricultorasAtivas,
    totalEspecies: porEspecie.length,
    especies: porEspecie.map((e) => ({
      especie: e.especie,
      area: e._sum.area ?? 0,
      quantidade: e._count._all,
    })),
  };
}

module.exports = {
  comunidadeDaUsuaria,
  listarComunidades,
  agricultorasDaComunidade,
  plantiosDaComunidade,
  painelDaComunidade,
};
