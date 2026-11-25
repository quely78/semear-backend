const ajuda = require('./ajuda'); // antes do app: desliga limites e e-mail real
const request = require('supertest');
const app = require('../src/app');

const { prisma } = ajuda;

describe('Comunidade e responsável', () => {
  let comunidade;
  let outraComunidade;
  let responsavel;
  let agricultora;
  let deFora;

  const comToken = (req, pessoa, tipo) => req.set('Authorization', `Bearer ${ajuda.tokenDe(pessoa, tipo)}`);

  beforeAll(async () => {
    comunidade = await ajuda.criarComunidade('Comunidade A');
    outraComunidade = await ajuda.criarComunidade('Comunidade B');
    responsavel = await ajuda.criarResponsavel(comunidade.id);
    agricultora = await ajuda.criarAgricultora(comunidade.id, { nome: 'Maria da A' });
    deFora = await ajuda.criarAgricultora(outraComunidade.id, { nome: 'Joana da B' });

    await prisma.plantio.create({
      data: { especie: 'Milho', dataPlantio: new Date('2026-03-12'), area: 400, tipoCultivo: 'orgânico', agricultoraId: agricultora.id },
    });
    await prisma.plantio.create({
      data: { especie: 'Feijão', dataPlantio: new Date('2026-04-01'), area: 50, tipoCultivo: 'orgânico', agricultoraId: deFora.id },
    });
  });

  afterAll(async () => {
    await ajuda.limparComunidade(comunidade.id);
    await ajuda.limparComunidade(outraComunidade.id);
    await prisma.$disconnect();
  });

  test('lista de comunidades é pública (usada no cadastro)', async () => {
    const resposta = await request(app).get('/comunidades');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: comunidade.id })]));
  });

  test('rotas da responsável exigem o perfil certo', async () => {
    expect((await request(app).get('/coordenadora/agricultoras')).status).toBe(401);
    expect((await comToken(request(app).get('/coordenadora/agricultoras'), agricultora, 'AGRICULTORA')).status).toBe(403);
  });

  test('a responsável só vê a própria comunidade', async () => {
    const agricultoras = await comToken(request(app).get('/coordenadora/agricultoras'), responsavel, 'COORDENADORA');
    expect(agricultoras.status).toBe(200);
    expect(agricultoras.body.agricultoras.map((a) => a.nome)).toEqual(['Maria da A']);
    expect(agricultoras.body.agricultoras[0]).toMatchObject({ totalPlantios: 1, areaTotal: 400 });

    const plantios = await comToken(request(app).get('/coordenadora/plantios'), responsavel, 'COORDENADORA');
    expect(plantios.body.plantios).toHaveLength(1);
    expect(plantios.body.plantios[0]).toHaveProperty('vendas');
  });

  test('senha provisória: só para agricultora da própria comunidade', async () => {
    const deOutra = await comToken(request(app).post(`/coordenadora/agricultoras/${deFora.id}/redefinir-senha`), responsavel, 'COORDENADORA');
    expect(deOutra.status).toBe(404);

    const ok = await comToken(request(app).post(`/coordenadora/agricultoras/${agricultora.id}/redefinir-senha`), responsavel, 'COORDENADORA');
    expect(ok.status).toBe(200);
    expect(ok.body.senhaProvisoria).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/);

    // Ela entra com a provisória e o app pede para criar uma senha nova
    const login = await request(app).post('/auth/login').send({ contato: agricultora.contato, senha: ok.body.senhaProvisoria });
    expect(login.status).toBe(200);
    expect(login.body.usuario.trocarSenha).toBe(true);
  });

  test('painel da comunidade mostra só os números dela', async () => {
    const resposta = await comToken(request(app).get('/dashboard/comunidade'), agricultora, 'AGRICULTORA');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ areaTotal: 400, agricultorasAtivas: 1 });
    expect(resposta.body.especies.map((e) => e.especie)).toEqual(['Milho']);
  });
});
