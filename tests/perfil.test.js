const ajuda = require('./ajuda'); // antes do app: desliga limites e e-mail real
const request = require('supertest');
const app = require('../src/app');

const { prisma, sufixo } = ajuda;

describe('Perfil (/perfil)', () => {
  let comunidade;
  let agricultora;
  let outra;
  let responsavel;

  beforeAll(async () => {
    comunidade = await ajuda.criarComunidade();
    agricultora = await ajuda.criarAgricultora(comunidade.id, { nome: 'Maria Perfil' });
    outra = await ajuda.criarAgricultora(comunidade.id);
    responsavel = await ajuda.criarResponsavel(comunidade.id);
  });

  afterAll(async () => {
    await ajuda.limparComunidade(comunidade.id);
    await prisma.$disconnect();
  });

  test('exige login', async () => {
    const resposta = await request(app).get('/perfil');
    expect(resposta.status).toBe(401);
  });

  test('mostra os dados da própria pessoa, sem a senha', async () => {
    const resposta = await request(app).get('/perfil').set('Authorization', `Bearer ${ajuda.tokenDe(agricultora, 'AGRICULTORA')}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      id: agricultora.id,
      nome: 'Maria Perfil',
      tipo: 'AGRICULTORA',
      comunidade: { id: comunidade.id },
    });
    expect(JSON.stringify(resposta.body)).not.toMatch(/senha/i);
  });

  test('funciona também para a responsável', async () => {
    const resposta = await request(app).get('/perfil').set('Authorization', `Bearer ${ajuda.tokenDe(responsavel, 'COORDENADORA')}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body.tipo).toBe('COORDENADORA');
  });

  test('valida nome e contato', async () => {
    const resposta = await request(app)
      .put('/perfil')
      .set('Authorization', `Bearer ${ajuda.tokenDe(agricultora, 'AGRICULTORA')}`)
      .send({ nome: '', contato: 'xx' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.campos).toHaveProperty('nome');
    expect(resposta.body.campos).toHaveProperty('contato');
  });

  test('não deixa usar o contato de outra pessoa (nem de outro perfil)', async () => {
    const token = ajuda.tokenDe(agricultora, 'AGRICULTORA');
    const deOutraAgricultora = await request(app).put('/perfil').set('Authorization', `Bearer ${token}`).send({ nome: 'Maria', contato: outra.contato });
    const daResponsavel = await request(app).put('/perfil').set('Authorization', `Bearer ${token}`).send({ nome: 'Maria', contato: responsavel.contato });

    expect(deOutraAgricultora.status).toBe(400);
    expect(daResponsavel.status).toBe(400);
  });

  test('atualiza nome e contato e ignora campos que não podem mudar', async () => {
    const novoContato = `novo-${sufixo()}@example.com`;
    const resposta = await request(app)
      .put('/perfil')
      .set('Authorization', `Bearer ${ajuda.tokenDe(agricultora, 'AGRICULTORA')}`)
      .send({ nome: 'Maria Atualizada', contato: novoContato, tipo: 'COORDENADORA', comunidadeId: 999, senha: 'hack' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ nome: 'Maria Atualizada', contato: novoContato, tipo: 'AGRICULTORA' });
    const noBanco = await prisma.agricultora.findUnique({ where: { id: agricultora.id } });
    expect(noBanco.comunidadeId).toBe(comunidade.id);
    expect(noBanco.senhaHash).toBe(agricultora.senhaHash);
  });
});
