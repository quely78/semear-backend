const prisma = require('../config/prisma');

// Erro com código HTTP, para o controller responder 404 quando faz sentido
class ErroComStatus extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

/** Comunidade da usuária logada (agricultora ou responsável). */
async function comunidadeDaUsuaria(usuario) {
  const tabela = usuario.tipo === 'AGRICULTORA' ? prisma.agricultora : prisma.coordenadora;
  const registro = await tabela.findUnique({
    where: { id: usuario.id },
    select: { comunidade: { select: { id: true, nome: true } } },
  });

  if (!registro?.comunidade) {
    throw new ErroComStatus('Você ainda não está ligada a nenhuma comunidade.', 404);
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
      // Área ainda na terra (plantios sem colheita registrada)
      areaEmCampo: plantios.filter((p) => !p.dataColheita).reduce((soma, p) => soma + p.area, 0),
    })),
  };
}

/** Todos os plantios da comunidade (estoque da responsável). */
async function plantiosDaComunidade(usuario) {
  const comunidade = await comunidadeDaUsuaria(usuario);
  const plantios = await prisma.plantio.findMany({
    where: { agricultora: { comunidadeId: comunidade.id } },
    include: { agricultora: { select: { id: true, nome: true } } },
    orderBy: { dataPlantio: 'desc' },
  });
  return { comunidade, plantios };
}

/** Números do painel da comunidade (área, agricultoras ativas, espécies). */
async function painelDaComunidade(usuario) {
  const comunidade = await comunidadeDaUsuaria(usuario);
  const plantios = await prisma.plantio.findMany({
    where: { agricultora: { comunidadeId: comunidade.id } },
    select: { especie: true, area: true, agricultoraId: true },
  });

  const porEspecie = {};
  plantios.forEach((p) => {
    if (!porEspecie[p.especie]) porEspecie[p.especie] = { especie: p.especie, area: 0, quantidade: 0 };
    porEspecie[p.especie].area += p.area;
    porEspecie[p.especie].quantidade += 1;
  });

  return {
    comunidade,
    areaTotal: plantios.reduce((soma, p) => soma + p.area, 0),
    agricultorasAtivas: new Set(plantios.map((p) => p.agricultoraId)).size,
    especies: Object.values(porEspecie).sort((a, b) => b.area - a.area),
  };
}

module.exports = {
  listarComunidades,
  agricultorasDaComunidade,
  plantiosDaComunidade,
  painelDaComunidade,
};
