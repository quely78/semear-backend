// =============================================================
// utils/formatadores.js — Funções para mostrar dados de forma amigável.
// =============================================================

/**
 * Data vinda da API (ISO, ex.: "2026-03-12T00:00:00.000Z") → "12/03/2026".
 * Usamos timeZone UTC para a data não "voltar um dia" no fuso de Manaus.
 */
export function formatarData(dataIso) {
  if (!dataIso) return '';
  return new Date(dataIso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

/**
 * Data da API → "AAAA-MM-DD", formato que o <input type="date"> entende.
 * Usado ao abrir um plantio para edição.
 */
export function paraInputData(dataIso) {
  if (!dataIso) return '';
  return new Date(dataIso).toISOString().slice(0, 10);
}

/** Número → "1.234,5 m²" (padrão brasileiro). */
export function formatarArea(valor) {
  const numero = Number(valor) || 0;
  return `${numero.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
}

/** "orgânico" → "Orgânico" (primeira letra maiúscula). */
export function capitalizar(texto = '') {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Maria Luana Pinheiro" → "Maria" (para a saudação "Olá, Maria"). */
export function primeiroNome(nome = '') {
  return nome.trim().split(' ')[0] || 'Agricultora';
}

/**
 * Data "AAAA-MM-DD" de N dias atrás. Usado no filtro por período.
 */
export function dataDiasAtras(dias) {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data.toISOString().slice(0, 10);
}