const prisma = require('../config/prisma');

async function consultarPorEspecie(especie) {
  if (!especie) throw new Error('especie é obrigatória.');

  const calendario = await prisma.calendarioAgricola.findUnique({ where: { especie } });
  if (!calendario) throw new Error('Calendário não encontrado para a espécie informada.');
  return calendario;
}

module.exports = { consultarPorEspecie };
