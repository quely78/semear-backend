// =============================================================
// utils/dinheiro.js — Listas e formatos das finanças do plantio.
// As listas são as mesmas da API (src/validators/financasValidator.js).
// =============================================================

/** Com o que foi o gasto. "cor" pinta a barra de "para onde foi o dinheiro". */
export const CATEGORIAS_GASTO = [
  { valor: 'SEMENTE', rotulo: 'Semente', cor: '#86ae3e' },
  { valor: 'ADUBO', rotulo: 'Adubo', cor: '#68a771' },
  { valor: 'MAO_DE_OBRA', rotulo: 'Mão de obra', cor: '#284a2d' },
  { valor: 'TRANSPORTE', rotulo: 'Transporte', cor: '#8f7d5c' },
  { valor: 'OUTRO', rotulo: 'Outro', cor: '#be3e73' },
];

/** Onde a agricultora vendeu. */
export const CANAIS_VENDA = [
  { valor: 'FEIRA', rotulo: 'Feira' },
  { valor: 'PNAE', rotulo: 'Merenda (PNAE)' },
  { valor: 'ATRAVESSADOR', rotulo: 'Atravessador' },
  { valor: 'OUTRO', rotulo: 'Outro' },
];

const rotuloDe = (lista, valor) => lista.find((item) => item.valor === valor)?.rotulo || valor;
export const rotuloCategoria = (valor) => rotuloDe(CATEGORIAS_GASTO, valor);
export const rotuloCanal = (valor) => rotuloDe(CANAIS_VENDA, valor);

/** 1234.5 → "R$ 1.234,50". */
export function formatarReais(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** 1234.5 → "R$ 1.235" (sem centavos, para números grandes de resumo). */
export function formatarReaisCurto(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

/** 0.28 → "28%". */
export function formatarMargem(margem) {
  if (margem === null || margem === undefined) return '—';
  return `${Math.round(margem * 100)}%`;
}

/**
 * Dinheiro digitado → número. Aceita "5", "5,50", "R$ 1.234,56" e "5.5".
 * Devolve NaN se não for um valor.
 */
export function converterDinheiro(texto) {
  let limpo = String(texto ?? '').replace(/R\$/i, '').replace(/\s/g, '');
  if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.');
  return limpo ? Number(limpo) : NaN;
}

/** Valor do campo de dinheiro → erro ou ''. */
export function erroDoDinheiro(texto, nome = 'o valor') {
  if (!String(texto ?? '').trim()) return `Informe ${nome}.`;
  const numero = converterDinheiro(texto);
  if (!Number.isFinite(numero)) return 'Digite só números (ex.: 25 ou 12,50).';
  if (numero < 0.01) return 'O valor precisa ser maior que zero.';
  return '';
}

/**
 * Margem em frase simples: 0.28 → "De cada R$ 10 que você vendeu, sobraram R$ 2,80."
 */
export function fraseDaMargem(margem) {
  if (margem === null || margem === undefined) return '';
  const deCadaDez = Math.abs(margem * 10).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (margem >= 0) return `De cada R$ 10 que você vendeu, sobraram R$ ${deCadaDez}.`;
  return `De cada R$ 10 que você vendeu, você perdeu R$ ${deCadaDez}.`;
}
