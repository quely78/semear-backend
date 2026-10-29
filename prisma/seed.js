const { PrismaClient } = require('@prisma/client');

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

  console.log(`Comunidades disponíveis: ${comunidades.length}`);
}

main()
  .catch((error) => {
    console.error('Não foi possível inicializar as comunidades.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
