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

module.exports = { consultarPorEspecie };
