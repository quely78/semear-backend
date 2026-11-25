const ajuda = require('./ajuda'); // antes do app: desliga limites e e-mail real
const request = require('supertest');
const app = require('../src/app');
const { resumir } = require('../src/utils/financas');

const { prisma } = ajuda;

describe('Contas das finanças (utils/financas)', () => {
  test('lucro, margem, ponto de equilíbrio, preço mínimo e estoque', () => {
    const r = resumir({
      gastos: [{ valor: 60 }, { valor: 120 }, { valor: 150 }, { valor: 30 }],
      vendas: [
        { quantidadeKg: 50, precoKg: 6 },
        { quantidadeKg: 40, precoKg: 5 },
      ],
      quantidadeColhida: 180,
    });
    expect(r).toMatchObject({
      receita: 500,
      gastos: 360,
      lucro: 140,
      margem: 0.28,
      kgVendidos: 90,
      kgEmEstoque: 90,
      precoMinimoKg: 2,
      gastosPagos: true,
    });
    expect(r.pontoEquilibrioKg).toBeCloseTo(64.8, 1);
  });

  test('centavos exatos (sem erro de arredondamento)', () => {
    const r = resumir({ gastos: [{ valor: '0.10' }, { valor: '0.20' }], vendas: [] });
    expect(r.gastos).toBe(0.3);
  });

  test('sem vendas: margem e ponto de equilíbrio ficam vazios (não zero)', () => {
    const r = resumir({ gastos: [{ valor: 100 }], vendas: [] });
    expect(r.margem).toBeNull();
    expect(r.pontoEquilibrioKg).toBeNull();
    expect(r.lucro).toBe(-100);
  });
});

describe('Finanças do plantio (API)', () => {
  let comunidade;
  let agricultora;
  let outra;
  let responsavel;
  let token;
  let base;

  const comToken = (req, t = token) => req.set('Authorization', `Bearer ${t}`);

  beforeAll(async () => {
    comunidade = await ajuda.criarComunidade();
    agricultora = await ajuda.criarAgricultora(comunidade.id, { nome: 'Maria Finanças' });
    outra = await ajuda.criarAgricultora(comunidade.id);
    responsavel = await ajuda.criarResponsavel(comunidade.id);
    token = ajuda.tokenDe(agricultora, 'AGRICULTORA');

    const plantio = await comToken(request(app).post('/plantios')).send({
      especie: 'Milho',
      dataPlantio: '2026-03-12',
      area: 400,
      tipoCultivo: 'orgânico',
    });
    base = `/plantios/${plantio.body.id}`;
  });

  afterAll(async () => {
    await ajuda.limparComunidade(comunidade.id);
    await prisma.$disconnect();
  });

  test('gastos: aceita valor em formato brasileiro e soma', async () => {
    await comToken(request(app).post(`${base}/gastos`)).send({ categoria: 'semente', valor: '60,00', data: '2026-03-12' });
    await comToken(request(app).post(`${base}/gastos`)).send({ categoria: 'ADUBO', valor: 'R$ 120,00', data: '2026-03-14' });
    await comToken(request(app).post(`${base}/gastos`)).send({ categoria: 'MAO_DE_OBRA', valor: 150, data: '2026-03-20' });
    const resposta = await comToken(request(app).post(`${base}/gastos`)).send({ categoria: 'TRANSPORTE', valor: '30', data: '2026-06-02' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.resumo.gastos).toBe(360);
    expect(resposta.body.gastos).toHaveLength(4);
  });

  test('gasto inválido mostra o erro de cada campo', async () => {
    const resposta = await comToken(request(app).post(`${base}/gastos`)).send({ categoria: 'X', valor: '-1', data: '2099-01-01' });
    expect(resposta.status).toBe(400);
    expect(Object.keys(resposta.body.campos)).toEqual(expect.arrayContaining(['categoria', 'valor', 'data']));
  });

  test('não deixa vender antes de registrar a colheita', async () => {
    const resposta = await comToken(request(app).post(`${base}/vendas`)).send({ quantidadeKg: 10, precoKg: 5, canal: 'FEIRA', data: '2026-06-10' });
    expect(resposta.status).toBe(400);
  });

  test('vendas depois da colheita: contas certas', async () => {
    await comToken(request(app).put(`${base}/colheita`)).send({ dataColheita: '2026-06-08', quantidadeColhida: 180 });
    await comToken(request(app).post(`${base}/vendas`)).send({ quantidadeKg: 50, precoKg: '6,00', canal: 'feira', data: '2026-06-10' });
    const resposta = await comToken(request(app).post(`${base}/vendas`)).send({ quantidadeKg: '40', precoKg: 5, canal: 'PNAE', data: '2026-06-18' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.resumo).toMatchObject({ receita: 500, lucro: 140, margem: 0.28, kgEmEstoque: 90, precoMinimoKg: 2 });
  });

  test('não vende mais do que tem no estoque, nem antes da colheita', async () => {
    const demais = await comToken(request(app).post(`${base}/vendas`)).send({ quantidadeKg: 91, precoKg: 5, canal: 'FEIRA', data: '2026-06-20' });
    expect(demais.status).toBe(400);
    expect(demais.body.campos.quantidadeKg).toBeDefined();

    const antes = await comToken(request(app).post(`${base}/vendas`)).send({ quantidadeKg: 1, precoKg: 5, canal: 'FEIRA', data: '2026-06-01' });
    expect(antes.status).toBe(400);
    expect(antes.body.campos.data).toBeDefined();
  });

  test('protege a colheita de um plantio com vendas', async () => {
    const desfazer = await comToken(request(app).delete(`${base}/colheita`));
    expect(desfazer.status).toBe(400);

    const menor = await comToken(request(app).put(`${base}/colheita`)).send({ dataColheita: '2026-06-08', quantidadeColhida: 80 });
    expect(menor.status).toBe(400);
    expect(menor.body.campos.quantidadeColhida).toBeDefined();
  });

  test('a lista de plantios traz os kg já vendidos', async () => {
    const resposta = await comToken(request(app).get('/plantios'));
    expect(resposta.body[0].kgVendidos).toBe(90);
  });

  test('outra pessoa não vê nem mexe (404) e a responsável não usa a rota (403)', async () => {
    const vendaId = (await comToken(request(app).get(`${base}/financas`))).body.vendas[0].id;
    const tokenOutra = ajuda.tokenDe(outra, 'AGRICULTORA');

    expect((await comToken(request(app).get(`${base}/financas`), tokenOutra)).status).toBe(404);
    expect((await comToken(request(app).delete(`${base}/vendas/${vendaId}`), tokenOutra)).status).toBe(404);
    expect((await comToken(request(app).get(`${base}/financas`), ajuda.tokenDe(responsavel, 'COORDENADORA'))).status).toBe(403);
    expect((await comToken(request(app).delete(`${base}/vendas/abc`))).status).toBe(404);
  });

  test('editar gasto e venda', async () => {
    const financas = (await comToken(request(app).get(`${base}/financas`))).body;
    const gasto = financas.gastos.find((g) => g.categoria === 'TRANSPORTE');
    const venda = financas.vendas.find((v) => v.canal === 'PNAE');

    const gastoEditado = await comToken(request(app).put(`${base}/gastos/${gasto.id}`)).send({ categoria: 'TRANSPORTE', valor: '40,00', data: '2026-06-02' });
    expect(gastoEditado.status).toBe(200);
    expect(gastoEditado.body.resumo.gastos).toBe(370);

    // A própria venda não conta contra o estoque ao editar: 40 + 90 em estoque = até 130 kg
    const vendaEditada = await comToken(request(app).put(`${base}/vendas/${venda.id}`)).send({ quantidadeKg: 130, precoKg: 5, canal: 'PNAE', data: '2026-06-18' });
    expect(vendaEditada.status).toBe(200);
    expect(vendaEditada.body.resumo.kgEmEstoque).toBe(0);

    const demais = await comToken(request(app).put(`${base}/vendas/${venda.id}`)).send({ quantidadeKg: 131, precoKg: 5, canal: 'PNAE', data: '2026-06-18' });
    expect(demais.status).toBe(400);

    // volta ao que era
    await comToken(request(app).put(`${base}/vendas/${venda.id}`)).send({ quantidadeKg: 40, precoKg: 5, canal: 'PNAE', data: '2026-06-18' });
    await comToken(request(app).put(`${base}/gastos/${gasto.id}`)).send({ categoria: 'TRANSPORTE', valor: 30, data: '2026-06-02' });
  });

  test('resumo da agricultora respeita o período', async () => {
    const ano = await comToken(request(app).get('/financas?dataInicio=2026-01-01&dataFim=2026-12-31'));
    expect(ano.body.total.lucro).toBe(140);

    const soJunho = await comToken(request(app).get('/financas?dataInicio=2026-06-15&dataFim=2026-06-30'));
    expect(soJunho.body.total).toMatchObject({ receita: 200, gastos: 0 });

    const invertido = await comToken(request(app).get('/financas?dataInicio=2026-12-01&dataFim=2026-01-01'));
    expect(invertido.status).toBe(400);
  });

  test('resumo da comunidade: só totais, sem nome nem valor de cada agricultora', async () => {
    const tokenResp = ajuda.tokenDe(responsavel, 'COORDENADORA');
    const resposta = await comToken(request(app).get('/coordenadora/financas'), tokenResp);

    expect(resposta.status).toBe(200);
    expect(resposta.body.total.receita).toBe(500);
    expect(resposta.body.canais.map((c) => c.canal)).toEqual(expect.arrayContaining(['FEIRA', 'PNAE']));
    expect(resposta.body.meses).toEqual(expect.arrayContaining([expect.objectContaining({ mes: '2026-06', receita: 500 })]));
    expect(JSON.stringify(resposta.body)).not.toContain('Maria Finanças');

    expect((await comToken(request(app).get('/coordenadora/financas'))).status).toBe(403);
  });

  test('apagar o plantio apaga gastos e vendas junto', async () => {
    const id = Number(base.split('/').pop());
    expect((await comToken(request(app).delete(base))).status).toBe(204);
    expect(await prisma.gasto.count({ where: { plantioId: id } })).toBe(0);
    expect(await prisma.venda.count({ where: { plantioId: id } })).toBe(0);
  });
});
