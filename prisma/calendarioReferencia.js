// =============================================================
// Lista de espécies de referência do calendário agrícola.
// É daqui que o seed (prisma/seed.js) preenche a tabela CalendarioAgricola.
//
// ⚠ RASCUNHO: os meses abaixo foram montados a partir do que o front já
// tem (chuvas de dezembro a maio e os ciclos em dias do CICLOS).
// ANTES DE ENTREGAR, confirmem com a pesquisa de campo / extensionista
// e ajustem aqui. Rodar `npm run db:seed` de novo atualiza o banco.
//
// O nome da espécie precisa ser IGUAL ao do front (src/config/dados.js).
// mesesPlantio e mesesColheita: números de 1 (janeiro) a 12 (dezembro).
// Para mostrar alerta e ciclo no front, a espécie também deve existir em
// frontend/src/config/dados.js e frontend/src/config/ciclos.js.
// =============================================================

module.exports = [
  {
    especie: 'Milho',
    epocaPlantio: 'Dezembro a fevereiro',
    mesesPlantio: [12, 1, 2],
    epocaColheita: 'Março a junho',
    mesesColheita: [3, 4, 5, 6],
  },
  {
    especie: 'Mandioca',
    epocaPlantio: 'Dezembro a março',
    mesesPlantio: [12, 1, 2, 3],
    epocaColheita: 'De agosto a março (8 a 12 meses depois do plantio)',
    mesesColheita: [8, 9, 10, 11, 12, 1, 2, 3],
  },
  {
    especie: 'Feijão',
    epocaPlantio: 'Janeiro a março',
    mesesPlantio: [1, 2, 3],
    epocaColheita: 'Abril a junho',
    mesesColheita: [4, 5, 6],
  },
  {
    especie: 'Abóbora',
    epocaPlantio: 'Dezembro a fevereiro',
    mesesPlantio: [12, 1, 2],
    epocaColheita: 'Março a junho',
    mesesColheita: [3, 4, 5, 6],
  },
];
