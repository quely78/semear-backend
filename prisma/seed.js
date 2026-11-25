require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const calendario = require('./calendarioReferencia');

const prisma = new PrismaClient();

const comunidades = [
  { id: 1, nome: 'Comunidade 1' },
  { id: 2, nome: 'Comunidade 2' },
  { id: 3, nome: 'Comunidade 3' },
];

async function main() {
  for (const comunidade of comunidades) {
    await prisma.comunidade.upsert({
      where: { id: comunidade.id },
      update: { nome: comunidade.nome },
      create: comunidade,
    });
  }
  // As comunidades acima entram com id fixo; o contador do banco não anda sozinho.
  // Sem isto, a próxima comunidade criada tentaria usar o id 1 e daria erro.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Comunidade"', 'id'), GREATEST((SELECT MAX(id) FROM "Comunidade"), 1))`,
  );
  console.log(`Comunidades disponíveis: ${comunidades.length}`);

  // upsert por espécie: pode rodar quantas vezes quiser (inclusive a cada deploy no Render)
  // sem duplicar nada, e atualiza se os meses mudarem.
  for (const item of calendario) {
    await prisma.calendarioAgricola.upsert({
      where: { especie: item.especie },
      update: item,
      create: item,
    });
  }
  console.log(`Espécies no calendário: ${calendario.length}`);
}

main()
  .catch((error) => {
    console.error('Não foi possível inicializar os dados.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
