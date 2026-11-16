const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('CRUD de plantios', () => {
  const contatoBase = `teste-${Date.now()}`;
  const senhaHash = bcrypt.hashSync('Teste123!', 4);
  let agricultora;
  let outraAgricultora;
  let token;
  let outroToken;
  let plantioId;

  beforeAll(async () => {
    agricultora = await prisma.agricultora.create({
      data: {
        nome: 'Agricultora de teste',
        contato: `${contatoBase}@example.com`,
        senhaHash,
        comunidadeId: 1,
      },
    });
    outraAgricultora = await prisma.agricultora.create({
      data: {
        nome: 'Outra agricultora de teste',
        contato: `${contatoBase}-outra@example.com`,
        senhaHash,
        comunidadeId: 1,
      },
    });
    token = jwt.sign({ id: agricultora.id, tipo: 'AGRICULTORA' }, process.env.JWT_SECRET);
    outroToken = jwt.sign({ id: outraAgricultora.id, tipo: 'AGRICULTORA' }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.plantio.deleteMany({
      where: { agricultoraId: { in: [agricultora.id, outraAgricultora.id] } },
    });
    await prisma.agricultora.deleteMany({
      where: { id: { in: [agricultora.id, outraAgricultora.id] } },
    });
    await prisma.$disconnect();
  });

  test('recusa acesso sem autenticação', async () => {
    const resposta = await request(app).get('/plantios/1');

    expect(resposta.status).toBe(401);
  });

  test('cria um plantio', async () => {
    const resposta = await request(app)
      .post('/plantios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        especie: 'Milho',
        dataPlantio: '2026-01-15',
        area: 100,
        tipoCultivo: 'convencional',
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual(expect.objectContaining({
      especie: 'Milho',
      area: 100,
      tipoCultivo: 'convencional',
      agricultoraId: agricultora.id,
    }));
    plantioId = resposta.body.id;
  });

  test('lista os plantios da agricultora autenticada', async () => {
    const resposta = await request(app)
      .get('/plantios')
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: plantioId }),
    ]));
  });

  test('busca um plantio por ID', async () => {
    const resposta = await request(app)
      .get(`/plantios/${plantioId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(expect.objectContaining({ id: plantioId }));
  });

  test('não permite que outra agricultora acesse o plantio', async () => {
    const resposta = await request(app)
      .get(`/plantios/${plantioId}`)
      .set('Authorization', `Bearer ${outroToken}`);

    expect(resposta.status).toBe(404);
  });

  test('retorna 404 para um ID inexistente', async () => {
    const resposta = await request(app)
      .get('/plantios/999999999')
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(404);
  });

  test('edita um plantio', async () => {
    const resposta = await request(app)
      .put(`/plantios/${plantioId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        especie: 'Mandioca',
        dataPlantio: '2026-01-15',
        area: 125,
        tipoCultivo: 'convencional',
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(expect.objectContaining({
      id: plantioId,
      especie: 'Mandioca',
      area: 125,
    }));
  });

  test('exclui um plantio', async () => {
    const resposta = await request(app)
      .delete(`/plantios/${plantioId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(204);
  });

  test('não encontra o plantio depois da exclusão', async () => {
    const resposta = await request(app)
      .get(`/plantios/${plantioId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resposta.status).toBe(404);
  });
});
