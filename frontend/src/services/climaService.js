// =============================================================
// services/climaService.js — Previsão de chuva para Rio Preto da Eva.
//
// Usa o Open-Meteo (gratuito, sem cadastro e sem chave), que prevê
// até 16 dias para frente. Só enviamos a localização do MUNICÍPIO,
// nenhum dado da agricultora.
//
// Pensado para internet lenta:
//   - a resposta fica guardada no celular por 3 horas;
//   - se a internet cair, usamos a última previsão guardada;
//   - se não houver nenhuma, o calendário mostra só a época do ano.
// =============================================================

// Centro de Rio Preto da Eva (AM)
const LATITUDE = -2.6989;
const LONGITUDE = -59.6997;

const URL_PREVISAO =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
  '&daily=precipitation_sum,precipitation_probability_max' +
  '&timezone=America%2FManaus&forecast_days=16';

const CHAVE_CACHE = 'semear_previsao_chuva';
const VALIDADE_CACHE = 3 * 60 * 60 * 1000; // 3 horas, em milissegundos

// A partir de quanto um dia conta como "dia de chuva"
const CHUVA_MINIMA_MM = 2;
const PROBABILIDADE_MINIMA = 50;

/** Lê a previsão guardada no celular (ou null). */
function lerCache() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CACHE) || 'null');
  } catch {
    return null;
  }
}

/** Guarda a previsão no celular (se o navegador deixar). */
function salvarCache(dados) {
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify(dados));
  } catch {
    // Sem espaço ou modo privado: seguimos sem guardar
  }
}

/** Junta dias de chuva seguidos em períodos: 10, 11, 12 → "10 a 12". */
function agruparEmPeriodos(dias) {
  const periodos = [];
  dias
    .filter((d) => d.chuva)
    .forEach((d) => {
      const ultimo = periodos[periodos.length - 1];
      const ehSeguido = ultimo && diaSeguinte(ultimo.fim) === d.data;
      if (ehSeguido) {
        ultimo.fim = d.data;
        ultimo.mm += d.mm;
      } else {
        periodos.push({ inicio: d.data, fim: d.data, mm: d.mm });
      }
    });
  return periodos;
}

/** "2026-04-30" → "2026-05-01" (sem depender do fuso). */
function diaSeguinte(data) {
  const [a, m, d] = data.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
}

/**
 * Busca a previsão de chuva.
 * @returns {Promise<{dias, periodos, atualizadaEm, desatualizada}|null>}
 *   dias = [{ data: "AAAA-MM-DD", mm, probabilidade, chuva: boolean }]
 *   null quando não há previsão nenhuma (sem internet e sem cache)
 */
export async function buscarPrevisaoChuva() {
  const cache = lerCache();
  if (cache && Date.now() - cache.atualizadaEm < VALIDADE_CACHE) {
    return { ...cache, desatualizada: false };
  }

  try {
    const resposta = await fetch(URL_PREVISAO);
    if (!resposta.ok) throw new Error('Previsão indisponível');
    const json = await resposta.json();

    const { time, precipitation_sum: chuvas, precipitation_probability_max: probs } = json.daily;
    const dias = time.map((data, i) => {
      const mm = Number(chuvas[i]) || 0;
      const probabilidade = probs?.[i] ?? null;
      const chuva =
        mm >= CHUVA_MINIMA_MM && (probabilidade === null || probabilidade >= PROBABILIDADE_MINIMA);
      return { data, mm, probabilidade, chuva };
    });

    const dados = { dias, periodos: agruparEmPeriodos(dias), atualizadaEm: Date.now() };
    salvarCache(dados);
    return { ...dados, desatualizada: false };
  } catch {
    // Sem internet: usa a última previsão guardada, avisando que é antiga
    return cache ? { ...cache, desatualizada: true } : null;
  }
}
