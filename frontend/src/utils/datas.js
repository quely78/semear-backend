// =============================================================
// utils/datas.js — Contas com datas para o calendário do plantio.
//
// Trabalhamos com datas no formato texto "AAAA-MM-DD". Assim:
//   - não há problema de fuso horário (a data nunca "volta um dia");
//   - dá para comparar com < e > direto, como texto.
// =============================================================

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Número com dois dígitos: 4 → "04". */
const doisDigitos = (n) => String(n).padStart(2, '0');

/** Monta "AAAA-MM-DD" a partir de ano, mês (0 a 11) e dia. */
export function montarData(ano, mes, dia) {
  const d = new Date(Date.UTC(ano, mes, dia));
  return `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())}`;
}

/** Separa "AAAA-MM-DD" em { ano, mes (0 a 11), dia }. */
export function partes(data) {
  const [ano, mes, dia] = data.split('-').map(Number);
  return { ano, mes: mes - 1, dia };
}

/** Data vinda da API ("2026-03-12T00:00:00.000Z") → "2026-03-12". */
export function deIso(dataIso) {
  return String(dataIso).slice(0, 10);
}

/** Hoje, no relógio do celular (fuso de Manaus), em "AAAA-MM-DD". */
export function hoje() {
  const agora = new Date();
  return montarData(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

/** Soma (ou subtrai) dias: somarDias("2026-04-30", 1) → "2026-05-01". */
export function somarDias(data, dias) {
  const { ano, mes, dia } = partes(data);
  return montarData(ano, mes, dia + dias);
}

/** Quantos dias de "de" até "ate" (pode ser negativo). */
export function diasEntre(de, ate) {
  const a = partes(de);
  const b = partes(ate);
  return Math.round((Date.UTC(b.ano, b.mes, b.dia) - Date.UTC(a.ano, a.mes, a.dia)) / 86400000);
}

/** Nome do mês: 3 → "abril". */
export function nomeMes(mes) {
  return MESES[mes];
}

/** "2026-04-10" → "10 de abril". */
export function diaEMes(data) {
  const { mes, dia } = partes(data);
  return `${dia} de ${MESES[mes]}`;
}

/**
 * Texto de um período, do jeito que se fala:
 *   mesmo dia ......... "16 de abril"
 *   mesmo mês ......... "10 a 17 de abril"
 *   meses diferentes .. "28 de abril a 3 de maio"
 */
export function textoPeriodo(inicio, fim) {
  if (inicio === fim) return diaEMes(inicio);
  const a = partes(inicio);
  const b = partes(fim);
  if (a.mes === b.mes && a.ano === b.ano) return `${a.dia} a ${b.dia} de ${MESES[b.mes]}`;
  return `${diaEMes(inicio)} a ${diaEMes(fim)}`;
}

/**
 * Semanas de um mês para desenhar a grade (domingo a sábado).
 * Dias de fora do mês viram null (casas vazias).
 * @returns {Array<Array<string|null>>}
 */
export function semanasDoMes(ano, mes) {
  const primeiroDiaSemana = new Date(Date.UTC(ano, mes, 1)).getUTCDay(); // 0 = domingo
  const totalDias = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();

  const casas = Array(primeiroDiaSemana).fill(null);
  for (let dia = 1; dia <= totalDias; dia += 1) casas.push(montarData(ano, mes, dia));
  while (casas.length % 7) casas.push(null);

  const semanas = [];
  for (let i = 0; i < casas.length; i += 7) semanas.push(casas.slice(i, i + 7));
  return semanas;
}
