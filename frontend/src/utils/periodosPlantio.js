// =============================================================
// utils/periodosPlantio.js — Períodos que aparecem no calendário:
// dia do plantio, etapas do ciclo da espécie, colheita registrada e
// chuva prevista. Usado no calendário de UM plantio e no calendário
// geral (todos os plantios da agricultora).
// =============================================================
import { CICLOS } from '../config/ciclos';
import { deIso, montarData, partes, somarDias } from './datas';
import { formatarKg } from './estoque';

/** Etapas de um plantio (sem a chuva). "plantio" vai junto em cada período. */
export function periodosDoPlantio(plantio) {
  const dataPlantio = deIso(plantio.dataPlantio);

  const etapas = (CICLOS[plantio.especie] || []).map((etapa) => ({
    categoria: etapa.categoria,
    nome: etapa.nome,
    inicio: somarDias(dataPlantio, etapa.de),
    fim: somarDias(dataPlantio, etapa.ate),
    dica: etapa.dica,
    plantio,
  }));

  // Colheita já registrada: aparece como um dia marcado
  const colhido = plantio.dataColheita
    ? [
        {
          categoria: 'colheita',
          nome: 'Colhido',
          inicio: deIso(plantio.dataColheita),
          fim: deIso(plantio.dataColheita),
          dica: `Você colheu ${formatarKg(plantio.quantidadeColhida)}.`,
          plantio,
        },
      ]
    : [];

  // Depois de colhido, as etapas previstas da colheita saem do calendário
  const previstas = plantio.dataColheita
    ? etapas.filter((e) => e.categoria !== 'colheita' && e.inicio <= deIso(plantio.dataColheita))
    : etapas;

  return [
    { categoria: 'plantio', nome: 'Plantio', inicio: dataPlantio, fim: dataPlantio, dica: 'Dia em que você plantou.', plantio },
    ...previstas,
    ...colhido,
  ];
}

/** Períodos de chuva da previsão do tempo. */
export function periodosDeChuva(previsao) {
  return (previsao?.periodos || []).map((p) => ({
    categoria: 'chuva',
    nome: 'Chuva prevista',
    inicio: p.inicio,
    fim: p.fim,
    dica: `Cerca de ${Math.round(p.mm)} mm de chuva no período.`,
  }));
}

/** Tudo junto, em ordem de data. */
export function montarPeriodos(plantios, previsao) {
  return [...plantios.flatMap(periodosDoPlantio), ...periodosDeChuva(previsao)].sort((a, b) =>
    a.inicio.localeCompare(b.inicio),
  );
}

/**
 * Dia a selecionar num mês: hoje (se está no mês), senão o primeiro dia
 * marcado do mês, senão o dia 1. Assim o quadro "o que acontece" sempre
 * fala de um dia que está na tela.
 */
export function diaParaSelecionar(ano, mes, periodos, hoje) {
  const doMes = (data) => {
    const p = partes(data);
    return p.ano === ano && p.mes === mes;
  };
  if (doMes(hoje)) return hoje;
  const primeiro = montarData(ano, mes, 1);
  const proximo = new Date(Date.UTC(ano, mes + 1, 1));
  const ultimo = somarDias(montarData(proximo.getUTCFullYear(), proximo.getUTCMonth(), 1), -1);
  const marcado = periodos
    .filter((p) => p.categoria !== 'chuva' && p.fim >= primeiro && p.inicio <= ultimo)
    .map((p) => (p.inicio < primeiro ? primeiro : p.inicio))
    .sort()[0];
  return marcado || primeiro;
}
