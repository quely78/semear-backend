import { describe, expect, test } from 'vitest';
import { compacto, escala, mesesEntre, noPeriodo, periodoDoPainel, rotuloMes, somarPorMes, variacao } from './graficos';

describe('utils/graficos', () => {
  test('mesesEntre atravessa a virada do ano', () => {
    expect(mesesEntre('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  test('período do ano tem 12 meses e datas de 1/jan a 31/dez', () => {
    const p = periodoDoPainel('2026');
    expect(p.meses).toHaveLength(12);
    expect(p).toMatchObject({ dataInicio: '2026-01-01', dataFim: '2026-12-31' });
  });

  test('"últimos 12 meses" termina no mês atual', () => {
    const p = periodoDoPainel('12m');
    expect(p.meses).toHaveLength(12);
    const agora = new Date();
    expect(p.meses[11]).toBe(`${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`);
  });

  test('somarPorMes ignora o que está fora dos meses do eixo', () => {
    const itens = [
      { data: '2026-01-10', kg: 5 },
      { data: '2026-01-20T00:00:00.000Z', kg: 3 },
      { data: '2025-12-31', kg: 100 },
    ];
    expect(somarPorMes(itens, ['2026-01', '2026-02'], (i) => i.data, (i) => i.kg)).toEqual([8, 0]);
  });

  test('escala arredonda o máximo do eixo para um número "redondo"', () => {
    expect(escala(280)).toEqual({ max: 300, ticks: [0, 100, 200, 300] });
    expect(escala(0).max).toBe(1);
  });

  test('formatos curtos e variação', () => {
    expect(compacto(950)).toBe('950');
    expect(compacto(1500)).toBe('1,5 mil');
    expect(rotuloMes('2026-06', true)).toBe('jun/26');
    expect(variacao(120, 100)).toBeCloseTo(0.2);
    expect(variacao(10, 0)).toBeNull();
    expect(noPeriodo('2026-03-01T00:00:00.000Z', { dataInicio: '2026-01-01', dataFim: '2026-12-31' })).toBe(true);
  });
});
