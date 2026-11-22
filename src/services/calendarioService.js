const prisma = require('../config/prisma');
const { ErroApi } = require('../utils/erros');

async function consultarPorEspecie(especieDaUrl) {
  const especie = typeof especieDaUrl === 'string' ? especieDaUrl.trim() : '';
  if (!especie || especie.length > 60) {
    throw new ErroApi(404, 'Calendário não encontrado para a espécie informada.');
  }

  const calendario = await prisma.calendarioAgricola.findUnique({ where: { especie } });
  if (!calendario) throw new ErroApi(404, 'Calendário não encontrado para a espécie informada.');
  return calendario;
}

/**
 * Sem mês: devolve todas as espécies do calendário.
 * Com mês (1 a 12): devolve o que plantar e o que colher naquele mês.
 */
async function listar(mesDaUrl) {
  const todas = await prisma.calendarioAgricola.findMany({ orderBy: { especie: 'asc' } });

  if (mesDaUrl === undefined) return todas;

  const mes = typeof mesDaUrl === 'string' && /^\d{1,2}$/.test(mesDaUrl) ? Number(mesDaUrl) : NaN;
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new ErroApi(400, 'O mês deve ser um número de 1 a 12.');
  }

  return {
    mes,
    plantar: todas.filter((c) => c.mesesPlantio.includes(mes)).map((c) => c.especie),
    colher: todas.filter((c) => c.mesesColheita.includes(mes)).map((c) => c.especie),
  };
}

module.exports = { consultarPorEspecie, listar };
