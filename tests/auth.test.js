const ajuda = require('./ajuda'); // antes do app: desliga limites e e-mail real
const request = require('supertest');
const app = require('../src/app');

const { prisma, SENHA, sufixo } = ajuda;

describe('Autenticação (/auth)', () => {
  let comunidade;

  beforeAll(async () => {
    comunidade = await ajuda.criarComunidade();
  });

  afterAll(async () => {
    await ajuda.limparComunidade(comunidade.id);
    await prisma.$disconnect();
  });

  describe('cadastro', () => {
    test('cria uma agricultora e não devolve a senha', async () => {
      const contato = `cadastro-${sufixo()}@example.com`;
      const resposta = await request(app)
        .post('/auth/cadastro')
        .send({ nome: '  Maria Teste  ', contato, senha: SENHA, tipo: 'AGRICULTORA', comunidadeId: comunidade.id });

      expect(resposta.status).toBe(201);
      expect(resposta.body.nome).toBe('Maria Teste');
      expect(JSON.stringify(resposta.body)).not.toMatch(/senha/i);
    });

    test('mostra o erro de cada campo de uma vez', async () => {
      const resposta = await request(app)
        .post('/auth/cadastro')
        .send({ nome: '', contato: 'abc', senha: '123', tipo: 'OUTRO' });

      expect(resposta.status).toBe(400);
      expect(Object.keys(resposta.body.campos)).toEqual(expect.arrayContaining(['nome', 'contato', 'senha', 'tipo']));
    });

    test('agricultora precisa de comunidade que exista', async () => {
      const semComunidade = await request(app)
        .post('/auth/cadastro')
        .send({ nome: 'Ana', contato: `sem-${sufixo()}@example.com`, senha: SENHA, tipo: 'AGRICULTORA' });
      expect(semComunidade.status).toBe(400);
      expect(semComunidade.body.campos.comunidadeId).toBeDefined();

      const inexistente = await request(app)
        .post('/auth/cadastro')
        .send({ nome: 'Ana', contato: `inex-${sufixo()}@example.com`, senha: SENHA, tipo: 'AGRICULTORA', comunidadeId: 999999 });
      expect(inexistente.status).toBe(400);
      expect(inexistente.body.campos.comunidadeId).toBe('Comunidade não encontrada.');
    });

    test('não deixa repetir o contato, nem entre perfis diferentes', async () => {
      const agricultora = await ajuda.criarAgricultora(comunidade.id);
      const resposta = await request(app)
        .post('/auth/cadastro')
        .send({ nome: 'Outra', contato: agricultora.contato, senha: SENHA, tipo: 'COORDENADORA', comunidadeId: comunidade.id });

      expect(resposta.status).toBe(400);
      expect(resposta.body.campos.contato).toBeDefined();
    });
  });

  describe('login', () => {
    let agricultora;

    beforeAll(async () => {
      agricultora = await ajuda.criarAgricultora(comunidade.id);
    });

    test('entra com contato e senha certos', async () => {
      const resposta = await request(app).post('/auth/login').send({ contato: agricultora.contato, senha: SENHA });

      expect(resposta.status).toBe(200);
      expect(resposta.body.token).toEqual(expect.any(String));
      expect(resposta.body.usuario).toMatchObject({ id: agricultora.id, tipo: 'AGRICULTORA', trocarSenha: false });
    });

    test('senha errada e contato inexistente dão a mesma resposta', async () => {
      const senhaErrada = await request(app).post('/auth/login').send({ contato: agricultora.contato, senha: 'errada123' });
      const naoExiste = await request(app).post('/auth/login').send({ contato: `nao-${sufixo()}@example.com`, senha: SENHA });

      expect(senhaErrada.status).toBe(401);
      expect(naoExiste.status).toBe(401);
      expect(senhaErrada.body.message).toBe(naoExiste.body.message);
    });
  });

  describe('token (middleware de autenticação)', () => {
    const jwt = require('jsonwebtoken');

    test('sem token, token inválido ou assinado com outra chave: 401', async () => {
      const agricultora = await ajuda.criarAgricultora(comunidade.id);
      const semToken = await request(app).get('/perfil');
      const invalido = await request(app).get('/perfil').set('Authorization', 'Bearer isto-nao-e-um-token');
      const outraChave = await request(app)
        .get('/perfil')
        .set('Authorization', `Bearer ${jwt.sign({ id: agricultora.id, tipo: 'AGRICULTORA' }, 'chave-errada')}`);

      expect([semToken.status, invalido.status, outraChave.status]).toEqual([401, 401, 401]);
    });

    test('token expirado: 401', async () => {
      const agricultora = await ajuda.criarAgricultora(comunidade.id);
      const expirado = jwt.sign({ id: agricultora.id, tipo: 'AGRICULTORA' }, process.env.JWT_SECRET, { expiresIn: -10 });
      const resposta = await request(app).get('/perfil').set('Authorization', `Bearer ${expirado}`);
      expect(resposta.status).toBe(401);
    });

    test('token válido de uma conta apagada: 401', async () => {
      const agricultora = await ajuda.criarAgricultora(comunidade.id);
      const token = ajuda.tokenDe(agricultora, 'AGRICULTORA');
      await prisma.agricultora.delete({ where: { id: agricultora.id } });
      const resposta = await request(app).get('/perfil').set('Authorization', `Bearer ${token}`);
      expect(resposta.status).toBe(401);
    });
  });

  describe('trocar a senha', () => {
    test('exige login, confere a senha atual e troca', async () => {
      const agricultora = await ajuda.criarAgricultora(comunidade.id, { senhaProvisoria: true });
      const token = ajuda.tokenDe(agricultora, 'AGRICULTORA');

      const semLogin = await request(app).post('/auth/trocar-senha').send({ senhaAtual: SENHA, novaSenha: 'NovaSenha1' });
      expect(semLogin.status).toBe(401);

      const atualErrada = await request(app)
        .post('/auth/trocar-senha')
        .set('Authorization', `Bearer ${token}`)
        .send({ senhaAtual: 'errada123', novaSenha: 'NovaSenha1' });
      expect(atualErrada.status).toBe(400);
      expect(atualErrada.body.campos.senhaAtual).toBeDefined();

      const ok = await request(app)
        .post('/auth/trocar-senha')
        .set('Authorization', `Bearer ${token}`)
        .send({ senhaAtual: SENHA, novaSenha: 'NovaSenha1' });
      expect(ok.status).toBe(200);

      const login = await request(app).post('/auth/login').send({ contato: agricultora.contato, senha: 'NovaSenha1' });
      expect(login.status).toBe(200);
      expect(login.body.usuario.trocarSenha).toBe(false);
    });
  });

  describe('esqueci minha senha', () => {
    test('resposta é a mesma para e-mail cadastrado ou não (não revela contas)', async () => {
      const espiao = jest.spyOn(console, 'log').mockImplementation(() => {});
      const agricultora = await ajuda.criarAgricultora(comunidade.id);

      const existe = await request(app).post('/auth/esqueci-senha').send({ contato: agricultora.contato });
      const naoExiste = await request(app).post('/auth/esqueci-senha').send({ contato: `nao-${sufixo()}@example.com` });

      expect(existe.status).toBe(200);
      expect(naoExiste.status).toBe(200);
      expect(existe.body.message).toBe(naoExiste.body.message);
      espiao.mockRestore();
    });

    test('telefone não recebe link por e-mail', async () => {
      const resposta = await request(app).post('/auth/esqueci-senha').send({ contato: '92 99999-0000' });
      expect(resposta.status).toBe(400);
    });

    test('o link do e-mail troca a senha uma única vez', async () => {
      const espiao = jest.spyOn(console, 'log').mockImplementation(() => {});
      const agricultora = await ajuda.criarAgricultora(comunidade.id);

      await request(app).post('/auth/esqueci-senha').send({ contato: agricultora.contato });
      // Sem Brevo/SMTP, o e-mail é impresso no terminal: pegamos o token do link
      const impresso = espiao.mock.calls.flat().join('\n');
      espiao.mockRestore();
      const token = /token=([a-f0-9]{64})/.exec(impresso)?.[1];
      expect(token).toBeDefined();

      const valido = await request(app).post('/auth/redefinir-senha/validar').send({ token });
      expect(valido.status).toBe(200);

      const trocou = await request(app).post('/auth/redefinir-senha').send({ token, novaSenha: 'PeloLink1' });
      expect(trocou.status).toBe(200);

      const deNovo = await request(app).post('/auth/redefinir-senha').send({ token, novaSenha: 'OutraVez1' });
      expect(deNovo.status).toBe(400);

      const login = await request(app).post('/auth/login').send({ contato: agricultora.contato, senha: 'PeloLink1' });
      expect(login.status).toBe(200);
    });

    test('token inventado é recusado', async () => {
      const resposta = await request(app).post('/auth/redefinir-senha/validar').send({ token: 'a'.repeat(64) });
      expect(resposta.status).toBe(400);
    });
  });

  describe('limite de tentativas de login', () => {
    test('bloqueia a conta depois de 5 senhas erradas seguidas (429)', async () => {
      const agricultora = await ajuda.criarAgricultora(comunidade.id);
      process.env.LIMITES_DESLIGADOS = '0';
      try {
        const respostas = [];
        for (let i = 0; i < 6; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          respostas.push(await request(app).post('/auth/login').send({ contato: agricultora.contato, senha: 'errada123' }));
        }
        expect(respostas.slice(0, 5).every((r) => r.status === 401)).toBe(true);
        expect(respostas[5].status).toBe(429);
      } finally {
        process.env.LIMITES_DESLIGADOS = '1';
      }
    });
  });
});
