// =============================================================
// utils/graficos.js — Apoio dos gráficos dos painéis.
//
// Cores das séries (validadas para daltonismo e contraste sobre o
// papel #fffbf3). Verde = o que entra/é bom (colhido, receita);
// ocre = o que sai (vendido, gastos). O par é próximo para quem não
// distingue vermelho/verde, por isso todo gráfico com as duas cores
// tem legenda e rótulos (nunca só a cor).
// =============================================================

export const COR = {
  principal: '#2e7d4f',
  secundaria: '#b8741a',
  apagada: '#8f9a8a', // sparkline (tendência em segundo plano)
  grade: '#e3d8c3',
  eixo: '#5d6657',
  tinta: '#22301f',
  papel: '#fffbf3',
};

const NOMES_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "2026-06" → "jun" (ou "jun/26" com ano). */
export function rotuloMes(chave, comAno = false) {
  const [ano, mes] = chave.split('-');
  return `${NOMES_MES[Number(mes) - 1]}${comAno ? `/${ano.slice(2)}` : ''}`;
}

/** Data (ISO ou "AAAA-MM-DD") → "AAAA-MM". */
export const chaveDoMes = (data) => String(data).slice(0, 7);

/** Lista de meses "AAAA-MM" de um mês até outro (inclusive). */
export function mesesEntre(inicio, fim) {
  const meses = [];
  let [ano, mes] = inicio.split('-').map(Number);
  const [anoFim, mesFim] = fim.split('-').map(Number);
  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    meses.push(`${ano}-${String(mes).padStart(2, '0')}`);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
  return meses;
}

// ---------- Períodos dos painéis ----------

const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Opções do filtro de período dos painéis. */
export function opcoesDePeriodo() {
  const ano = new Date().getFullYear();
  return [
    { valor: '12m', rotulo: 'Últimos 12 meses' },
    { valor: String(ano), rotulo: String(ano) },
    { valor: String(ano - 1), rotulo: String(ano - 1) },
  ];
}

/**
 * Período escolhido → datas e a lista de meses do eixo.
 * @returns {{ dataInicio: string, dataFim: string, meses: string[], rotulo: string }}
 */
export function periodoDoPainel(valor) {
  const hoje = hojeIso();
  if (valor === '12m') {
    const d = new Date();
    const inicio = new Date(d.getFullYear(), d.getMonth() - 11, 1);
    const dataInicio = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}-01`;
    return {
      dataInicio,
      dataFim: hoje,
      meses: mesesEntre(chaveDoMes(dataInicio), chaveDoMes(hoje)),
      rotulo: 'últimos 12 meses',
    };
  }
  return {
    dataInicio: `${valor}-01-01`,
    dataFim: `${valor}-12-31`,
    meses: mesesEntre(`${valor}-01`, `${valor}-12`),
    rotulo: valor,
  };
}

/** A data ("AAAA-MM-DD" ou ISO) está dentro do período? */
export const noPeriodo = (data, { dataInicio, dataFim }) => {
  const dia = String(data).slice(0, 10);
  return dia >= dataInicio && dia <= dataFim;
};

/**
 * Soma valores por mês. itens = qualquer lista; data(item) e valor(item) dizem o quê.
 * @returns {number[]} um número por mês de "meses" (0 quando não há nada)
 */
export function somarPorMes(itens, meses, data, valor) {
  const indice = new Map(meses.map((m, i) => [m, i]));
  const totais = meses.map(() => 0);
  itens.forEach((item) => {
    const i = indice.get(chaveDoMes(data(item)));
    if (i !== undefined) totais[i] += Number(valor(item)) || 0;
  });
  return totais;
}

// ---------- Escala do eixo ----------

/** Máximo "redondo" e marcas do eixo (ex.: 0 · 500 · 1.000 · 1.500). */
export function escala(maximo, marcas = 3) {
  if (!(maximo > 0)) return { max: 1, ticks: [0, 1] };
  const bruto = maximo / marcas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((f) => f * potencia).find((p) => p >= bruto);
  const max = passo * Math.ceil(maximo / passo);
  const ticks = [];
  for (let v = 0; v <= max + passo / 2; v += passo) ticks.push(Math.round(v * 1000) / 1000);
  return { max, ticks };
}

/** Número compacto para eixos: 950 · 1,2 mil · 15 mil. */
export function compacto(valor) {
  const n = Number(valor) || 0;
  if (Math.abs(n) >= 1000) {
    return `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: Math.abs(n) >= 10000 ? 0 : 1 })} mil`;
  }
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/** Variação entre dois valores, em % (null se não dá para comparar). */
export function variacao(atual, anterior) {
  if (!anterior) return null;
  return (atual - anterior) / Math.abs(anterior);
}

// ---------- Séries a partir dos plantios ----------

/** O mesmo período, um ano antes (para comparar). */
export function periodoAnterior({ dataInicio, dataFim }) {
  const menosUmAno = (data) => `${Number(data.slice(0, 4)) - 1}${data.slice(4)}`;
  return { dataInicio: menosUmAno(dataInicio), dataFim: menosUmAno(dataFim) };
}

/** Colheitas e vendas dos plantios como movimentos { data, kg }. */
export function colheitasEVendas(plantios) {
  const colheitas = plantios
    .filter((p) => p.dataColheita)
    .map((p) => ({ data: p.dataColheita, kg: Number(p.quantidadeColhida) || 0 }));
  const vendas = plantios.flatMap((p) => (p.vendas || []).map((v) => ({ data: v.data, kg: v.quantidadeKg })));
  return { colheitas, vendas };
}

/** Soma dos kg dos movimentos dentro do período. */
export const somaKgNoPeriodo = (lista, periodo) =>
  lista.filter((m) => noPeriodo(m.data, periodo)).reduce((soma, m) => soma + m.kg, 0);
