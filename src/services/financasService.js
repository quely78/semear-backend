const prisma = require('../config/prisma');
const { ErroApi } = require('../utils/erros');
const { resumir } = require('../utils/financas');
const { lerIdDoPlantio } = require('../validators/plantioValidator');
const {
  validarGasto,
  validarVenda,
  validarPeriodo,
  lerIdDoItem,
} = require('../validators/financasValidator');
const { comunidadeDaUsuaria } = require('./comunidadeService');

// Como nos plantios: o id da agricultora vem do TOKEN. Gasto ou venda de plantio
// de outra pessoa "não existe" (404).

const ordemPorData = { orderBy: [{ data: 'desc' }, { id: 'desc' }] };

/** Gasto/venda do banco → JSON com números (o Decimal do Prisma viraria texto). */
const formatarGasto = (g) => ({ ...g, valor: Number(g.valor) });
const formatarVenda = (v) => ({ ...v, precoKg: Number(v.precoKg) });

/** Plantio da própria agricultora com gastos e vendas, ou 404. */
async function plantioComFinancas(id, agricultoraId, cliente = prisma) {
  const plantio = await cliente.plantio.findFirst({
    where: { id: lerIdDoPlantio(id), agricultoraId },
    include: { gastos: ordemPorData, vendas: ordemPorData },
  });
  if (!plantio) throw new ErroApi(404, 'Plantio não encontrado.');
  return plantio;
}

/** Resposta padrão: plantio + listas + resumo calculado. */
function montarFinancas({ gastos, vendas, ...plantio }) {
  return {
    plantio,
    gastos: gastos.map(formatarGasto),
    vendas: vendas.map(formatarVenda),
    resumo: resumir({ gastos, vendas, quantidadeColhida: plantio.quantidadeColhida }),
  };
}

async function obterFinancas(id, agricultoraId) {
  return montarFinancas(await plantioComFinancas(id, agricultoraId));
}

// ---------- Gastos ----------

async function criarGasto(id, body, agricultoraId) {
  const plantio = await plantioComFinancas(id, agricultoraId);
  const dados = validarGasto(body);
  await prisma.gasto.create({ data: { ...dados, plantioId: plantio.id } });
  return obterFinancas(plantio.id, agricultoraId);
}

async function excluirGasto(id, gastoId, agricultoraId) {
  const plantio = await plantioComFinancas(id, agricultoraId);
  const idGasto = lerIdDoItem(gastoId, 'Gasto');
  const { count } = await prisma.gasto.deleteMany({ where: { id: idGasto, plantioId: plantio.id } });
  if (!count) throw new ErroApi(404, 'Gasto não encontrado.');
  return obterFinancas(plantio.id, agricultoraId);
}

// ---------- Vendas (saída do estoque colhido) ----------

/** kg colhidos que ainda não foram vendidos. */
const kgDisponiveis = (plantio) =>
  (plantio.quantidadeColhida || 0) - plantio.vendas.reduce((soma, v) => soma + v.quantidadeKg, 0);

async function criarVenda(id, body, agricultoraId) {
  try {
    // Transação "serializable": duas vendas ao mesmo tempo não conseguem vender o mesmo kg
    await prisma.$transaction(
      async (tx) => {
        const plantio = await plantioComFinancas(id, agricultoraId, tx);
        if (!plantio.dataColheita) {
          throw new ErroApi(400, 'Registre a colheita deste plantio antes de anotar vendas.');
        }
        const dados = validarVenda(body, {
          dataColheita: plantio.dataColheita,
          kgDisponiveis: kgDisponiveis(plantio),
        });
        await tx.venda.create({ data: { ...dados, plantioId: plantio.id } });
      },
      { isolationLevel: 'Serializable' },
    );
  } catch (error) {
    if (error.code === 'P2034') {
      throw new ErroApi(409, 'Outra venda foi salva ao mesmo tempo. Confira o estoque e tente de novo.');
    }
    throw error;
  }
  return obterFinancas(id, agricultoraId);
}

async function excluirVenda(id, vendaId, agricultoraId) {
  const plantio = await plantioComFinancas(id, agricultoraId);
  const idVenda = lerIdDoItem(vendaId, 'Venda');
  const { count } = await prisma.venda.deleteMany({ where: { id: idVenda, plantioId: plantio.id } });
  if (!count) throw new ErroApi(404, 'Venda não encontrada.');
  return obterFinancas(plantio.id, agricultoraId);
}

// ---------- Resumos por período ----------

/** Filtro de data do Prisma para o período (ou undefined = tudo). */
function filtroDeData({ dataInicio, dataFim }) {
  if (!dataInicio && !dataFim) return undefined;
  return { ...(dataInicio && { gte: dataInicio }), ...(dataFim && { lte: dataFim }) };
}

/**
 * Finanças de cada plantio da agricultora no período (gastos e vendas com data
 * dentro dele). Usado em "Qual plantio rende mais" e no relatório.
 */
async function resumoDaAgricultora(agricultoraId, query) {
  const periodo = validarPeriodo(query);
  const data = filtroDeData(periodo);
  const filtro = { where: { data }, ...ordemPorData };

  const plantios = await prisma.plantio.findMany({
    where: { agricultoraId },
    include: { gastos: filtro, vendas: filtro },
    orderBy: { dataPlantio: 'desc' },
  });

  const comMovimento = plantios.filter((p) => p.gastos.length || p.vendas.length);
  const todosGastos = comMovimento.flatMap((p) => p.gastos);
  const todasVendas = comMovimento.flatMap((p) => p.vendas);

  return {
    periodo,
    total: resumir({ gastos: todosGastos, vendas: todasVendas }),
    plantios: comMovimento.map(({ gastos, vendas, ...plantio }) => ({
      id: plantio.id,
      especie: plantio.especie,
      area: plantio.area,
      tipoCultivo: plantio.tipoCultivo,
      dataPlantio: plantio.dataPlantio,
      resumo: resumir({ gastos, vendas }),
    })),
  };
}

/**
 * Totais da comunidade para a responsável. Só SOMAS: o dinheiro de cada
 * agricultora não sai daqui (nem nome, nem valor individual).
 */
async function resumoDaComunidade(usuario, query) {
  const periodo = validarPeriodo(query);
  const comunidade = await comunidadeDaUsuaria(usuario);
  const data = filtroDeData(periodo);
  const daComunidade = { plantio: { agricultora: { comunidadeId: comunidade.id } } };
  const doPlantio = { plantio: { select: { especie: true, agricultoraId: true } } };

  const [gastos, vendas, totalAgricultoras] = await Promise.all([
    prisma.gasto.findMany({ where: { ...daComunidade, data }, select: { valor: true, ...doPlantio } }),
    prisma.venda.findMany({
      where: { ...daComunidade, data },
      select: { quantidadeKg: true, precoKg: true, canal: true, ...doPlantio },
    }),
    prisma.agricultora.count({ where: { comunidadeId: comunidade.id } }),
  ]);

  // Por onde vendeu: kg, receita e preço médio do kg
  const porCanal = {};
  vendas.forEach((v) => {
    (porCanal[v.canal] ||= []).push(v);
  });

  // Por espécie: receita, gastos e margem
  const porEspecie = {};
  const linha = (nome) => (porEspecie[nome] ||= { gastos: [], vendas: [] });
  gastos.forEach((g) => linha(g.plantio.especie).gastos.push(g));
  vendas.forEach((v) => linha(v.plantio.especie).vendas.push(v));

  return {
    comunidade,
    periodo,
    total: resumir({ gastos, vendas }),
    agricultorasComVendas: new Set(vendas.map((v) => v.plantio.agricultoraId)).size,
    totalAgricultoras,
    canais: Object.entries(porCanal)
      .map(([canal, lista]) => {
        const { receita, kgVendidos, precoMedioKg } = resumir({ vendas: lista });
        return { canal, receita, kgVendidos, precoMedioKg };
      })
      .sort((a, b) => b.precoMedioKg - a.precoMedioKg),
    especies: Object.entries(porEspecie)
      .map(([nome, dados]) => {
        const { receita, gastos: gasto, lucro, margem } = resumir(dados);
        return { especie: nome, receita, gastos: gasto, lucro, margem };
      })
      .sort((a, b) => b.receita - a.receita),
  };
}

module.exports = {
  obterFinancas,
  criarGasto,
  excluirGasto,
  criarVenda,
  excluirVenda,
  resumoDaAgricultora,
  resumoDaComunidade,
};
