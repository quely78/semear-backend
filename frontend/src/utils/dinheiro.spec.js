import { describe, expect, test } from 'vitest';
import { converterDinheiro, erroDoDinheiro, formatarMargem, fraseDaMargem } from './dinheiro';

describe('utils/dinheiro', () => {
  test('entende dinheiro digitado no formato brasileiro', () => {
    expect(converterDinheiro('R$ 1.234,56')).toBe(1234.56);
    expect(converterDinheiro('5,5')).toBe(5.5);
    expect(converterDinheiro('5.5')).toBe(5.5);
    expect(converterDinheiro('')).toBeNaN();
  });

  test('erros do campo de dinheiro', () => {
    expect(erroDoDinheiro('')).toMatch(/Informe/);
    expect(erroDoDinheiro('abc')).toMatch(/números/);
    expect(erroDoDinheiro('0')).toMatch(/maior que zero/);
    expect(erroDoDinheiro('12,50')).toBe('');
  });

  test('margem em número e em frase', () => {
    expect(formatarMargem(0.28)).toBe('28%');
    expect(formatarMargem(null)).toBe('—');
    expect(fraseDaMargem(0.28)).toContain('sobraram R$ 2,80');
    expect(fraseDaMargem(-0.1)).toContain('perdeu R$ 1,00');
  });
});
