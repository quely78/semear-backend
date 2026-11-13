// Contas das finanças do plantio. Tudo em CENTAVOS (inteiros) para não ter
// erro de arredondamento com dinheiro; só vira reais na hora de responder.
//
//   receita ............ soma de (kg vendidos × preço do kg)
//   gastos ............. soma dos gastos
//   lucro .............. receita − gastos ("quanto sobrou")
//   margem ............. lucro ÷ receita ("de cada R$ 10 vendidos, sobraram R$ X")
//   ponto de equilíbrio  gastos ÷ preço médio do kg (quantos kg pagam os gastos)
//   preço mínimo ....... gastos ÷ kg colhidos (abaixo disso, a venda dá prejuízo)

/** Decimal do Prisma, número ou texto → centavos (inteiro). */
function centavos(valor) {
  return Math.round(Number(valor) * 100);
}

/** Centavos → reais (número com 2 casas). */
function reais(emCentavos) {
  return Math.round(emCentavos) / 100;
}

const arredondar = (numero, casas = 1) => {
  const fator = 10 ** casas;
  return Math.round(numero * fator) / fator;
};

/**
 * Resumo financeiro de um conjunto de gastos e vendas.
 * @param {object} dados
 * @param {Array<{valor}>} dados.gastos
 * @param {Array<{quantidadeKg, precoKg}>} dados.vendas
 * @param {number|null} [dados.quantidadeColhida] kg colhidos (só faz sentido para UM plantio)
 */
function resumir({ gastos = [], vendas = [], quantidadeColhida = null }) {
  const gastosC = gastos.reduce((soma, g) => soma + centavos(g.valor), 0);
  const receitaC = vendas.reduce(
    (soma, v) => soma + Math.round(Number(v.quantidadeKg) * centavos(v.precoKg)),
    0,
  );
  const kgVendidos = vendas.reduce((soma, v) => soma + Number(v.quantidadeKg), 0);
  const lucroC = receitaC - gastosC;
  const precoMedioC = kgVendidos > 0 ? receitaC / kgVendidos : null;
  const colhido = quantidadeColhida === null ? null : Number(quantidadeColhida);

  return {
    receita: reais(receitaC),
    gastos: reais(gastosC),
    lucro: reais(lucroC),
    // null quando ainda não vendeu nada (não dá para calcular)
    margem: receitaC > 0 ? arredondar(lucroC / receitaC, 3) : null,
    kgVendidos: arredondar(kgVendidos),
    precoMedioKg: precoMedioC === null ? null : reais(precoMedioC),
    pontoEquilibrioKg: precoMedioC ? arredondar(gastosC / precoMedioC) : null,
    gastosPagos: precoMedioC ? receitaC >= gastosC : false,
    // Só com a colheita registrada
    kgColhidos: colhido,
    kgEmEstoque: colhido === null ? null : arredondar(Math.max(colhido - kgVendidos, 0)),
    precoMinimoKg: colhido ? reais(gastosC / colhido) : null,
  };
}

module.exports = { resumir, centavos, reais };
