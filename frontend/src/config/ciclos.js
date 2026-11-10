// =============================================================
// config/ciclos.js — Etapas do ciclo de cada espécie, contadas em
// DIAS DEPOIS DO PLANTIO. Usado no calendário de cada plantio.
//
// São valores MÉDIOS de referência para a região de Rio Preto da Eva
// (podem variar com a variedade, o solo e a chuva). Quando a equipe
// tiver os dados da pesquisa de campo, basta ajustar os números aqui.
//
// categoria (define a cor no calendário):
//   desenvolvimento → a planta crescendo (germinação, floração)
//   cuidados        → trabalho da agricultora (capina, adubação)
//   colheita        → hora de colher
// =============================================================

export const CICLOS = {
  Milho: [
    { nome: 'Germinação', categoria: 'desenvolvimento', de: 4, ate: 10, dica: 'As plantinhas começam a sair da terra.' },
    { nome: 'Capina', categoria: 'cuidados', de: 15, ate: 40, dica: 'Mantenha o milho livre de mato nesta fase.' },
    { nome: 'Adubação de cobertura', categoria: 'cuidados', de: 25, ate: 35, dica: 'Melhor fazer com a terra úmida, perto de uma chuva.' },
    { nome: 'Floração (pendão)', categoria: 'desenvolvimento', de: 55, ate: 70, dica: 'Fase em que o milho mais precisa de água.' },
    { nome: 'Colheita', categoria: 'colheita', de: 100, ate: 120, dica: 'Colha quando a palha e os grãos estiverem secos.' },
  ],
  Mandioca: [
    { nome: 'Brotação', categoria: 'desenvolvimento', de: 10, ate: 20, dica: 'As manivas começam a brotar.' },
    { nome: 'Capina', categoria: 'cuidados', de: 30, ate: 120, dica: 'Os primeiros meses são os mais importantes para tirar o mato.' },
    { nome: 'Colheita', categoria: 'colheita', de: 240, ate: 365, dica: 'Pode colher entre 8 e 12 meses, conforme a variedade.' },
  ],
  Feijão: [
    { nome: 'Germinação', categoria: 'desenvolvimento', de: 4, ate: 8, dica: 'As plantinhas começam a sair da terra.' },
    { nome: 'Capina', categoria: 'cuidados', de: 15, ate: 30, dica: 'Mantenha o feijão livre de mato até ele fechar o espaço.' },
    { nome: 'Floração', categoria: 'desenvolvimento', de: 35, ate: 45, dica: 'Evite mexer nas plantas para não derrubar as flores.' },
    { nome: 'Colheita', categoria: 'colheita', de: 75, ate: 90, dica: 'Colha quando as vagens estiverem secas.' },
  ],
  Abóbora: [
    { nome: 'Germinação', categoria: 'desenvolvimento', de: 5, ate: 10, dica: 'As plantinhas começam a sair da terra.' },
    { nome: 'Capina', categoria: 'cuidados', de: 15, ate: 35, dica: 'Tire o mato antes de as ramas se espalharem.' },
    { nome: 'Floração', categoria: 'desenvolvimento', de: 40, ate: 55, dica: 'As flores atraem abelhas, que ajudam a formar os frutos.' },
    { nome: 'Colheita', categoria: 'colheita', de: 90, ate: 120, dica: 'Colha quando a casca estiver dura e o talo seco.' },
  ],
};

// -------------------------------------------------------------
// Cores e nomes de cada categoria (legenda do calendário).
// As cores também estão no CSS (variáveis --cal-*).
// -------------------------------------------------------------
export const CATEGORIAS = {
  plantio: { rotulo: 'Dia do plantio' },
  chuva: { rotulo: 'Chuva prevista' },
  desenvolvimento: { rotulo: 'Crescimento' },
  cuidados: { rotulo: 'Cuidados' },
  colheita: { rotulo: 'Colheita' },
};

// -------------------------------------------------------------
// Épocas do ano na região (média dos anos, para Manaus e arredores).
// Usado quando a previsão do tempo não alcança o mês ou está sem internet.
// Mês: 0 = janeiro ... 11 = dezembro.
// -------------------------------------------------------------
export function epocaDoMes(mes) {
  if ([11, 0, 1, 2, 3, 4].includes(mes)) {
    return { tipo: 'chuvosa', texto: 'Época de chuvas na região (dezembro a maio).' };
  }
  if ([6, 7, 8, 9].includes(mes)) {
    return { tipo: 'seca', texto: 'Época mais seca na região (julho a outubro).' };
  }
  return { tipo: 'transicao', texto: 'Mudança de época: as chuvas variam bastante neste mês.' };
}
