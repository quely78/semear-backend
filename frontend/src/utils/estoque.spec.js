import { describe, expect, test } from 'vitest';
import { kgEmEstoqueDo, resumirEstoque, situacaoDoPlantio } from './estoque';

const colhido = {
  id: 1,
  especie: 'Milho',
  area: 400,
  dataPlantio: '2026-03-12T00:00:00.000Z',
  dataColheita: '2026-06-08T00:00:00.000Z',
  quantidadeColhida: 180,
  vendas: [
    { data: '2026-06-10T00:00:00.000Z', quantidadeKg: 50 },
    { data: '2026-06-18T00:00:00.000Z', quantidadeKg: 40 },
  ],
};
const noCampo = { id: 2, especie: 'Feijão', area: 200, dataPlantio: '2026-10-20T00:00:00.000Z' };

describe('utils/estoque (colheita entra, venda sai)', () => {
  test('em estoque = colhido − vendido', () => {
    expect(kgEmEstoqueDo(colhido)).toBe(90);
    expect(kgEmEstoqueDo({ quantidadeColhida: 80, kgVendidos: 76 })).toBe(4);
  });

  test('situação do plantio', () => {
    expect(situacaoDoPlantio(colhido, '2026-11-25')).toBe('colhido');
    expect(situacaoDoPlantio(noCampo, '2026-10-21')).toBe('crescendo');
  });

  test('resumo soma campo (m²), colhido, vendido e estoque (kg)', () => {
    const { totais, movimentos } = resumirEstoque([colhido, noCampo], '2026-10-21');
    expect(totais).toMatchObject({ colhidoKg: 180, vendidoKg: 90, estoqueKg: 90, crescendo: 200 });
    // 2 plantios + 1 colheita + 2 vendas, do mais recente para o mais antigo
    expect(movimentos.map((m) => m.tipo)).toEqual(['plantio', 'saida', 'saida', 'entrada', 'plantio']);
  });
});
