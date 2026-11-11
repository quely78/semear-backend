// =============================================================
// utils/estoque.js — Plantios vistos como um ESTOQUE.
//
//   ENTRADA ... o plantio (área plantada, em m²)
//   SAÍDA ..... a colheita (a área sai do campo e vira produção, em kg)
//
// Cada plantio tem uma situação:
//   crescendo ........ ainda não chegou a época de colher
//   pronto ........... já está na janela de colheita (pelo ciclo da espécie)
//   atrasado ......... passou da janela de colheita e não foi colhido
//   colhido .......... a agricultora registrou a colheita
// =============================================================
import { CICLOS } from '../config/ciclos';
import { deIso, somarDias } from './datas';

export const SITUACOES = {
  crescendo: { rotulo: 'Crescendo' },
  pronto: { rotulo: 'Pronto para colher' },
  atrasado: { rotulo: 'Colheita atrasada' },
  colhido: { rotulo: 'Colhido' },
};

/** Janela de colheita do plantio pelo ciclo da espécie (ou null se não houver ciclo). */
export function janelaDeColheita(plantio) {
  const colheita = (CICLOS[plantio.especie] || []).find((e) => e.categoria === 'colheita');
  if (!colheita) return null;
  const dataPlantio = deIso(plantio.dataPlantio);
  return { inicio: somarDias(dataPlantio, colheita.de), fim: somarDias(dataPlantio, colheita.ate) };
}

/** Situação do plantio em uma data ("AAAA-MM-DD"). */
export function situacaoDoPlantio(plantio, hoje) {
  if (plantio.dataColheita) return 'colhido';
  const janela = janelaDeColheita(plantio);
  if (!janela || hoje < janela.inicio) return 'crescendo';
  return hoje <= janela.fim ? 'pronto' : 'atrasado';
}

/**
 * Resume uma lista de plantios como estoque.
 * @returns {{
 *   totais: { crescendo, pronto, atrasado, colhidoArea, colhidoKg },
 *   especies: Array<{ especie, crescendo, pronto, atrasado, colhidoArea, colhidoKg }>,
 *   movimentos: Array<{ tipo: 'entrada'|'saida', data, plantio }>
 * }}
 */
export function resumirEstoque(plantios, hoje) {
  const vazio = () => ({ crescendo: 0, pronto: 0, atrasado: 0, colhidoArea: 0, colhidoKg: 0 });
  const totais = vazio();
  const porEspecie = {};
  const movimentos = [];

  plantios.forEach((plantio) => {
    const area = Number(plantio.area) || 0;
    const situacao = situacaoDoPlantio(plantio, hoje);
    const linha = (porEspecie[plantio.especie] ||= { especie: plantio.especie, ...vazio() });

    if (situacao === 'colhido') {
      const kg = Number(plantio.quantidadeColhida) || 0;
      linha.colhidoArea += area;
      linha.colhidoKg += kg;
      totais.colhidoArea += area;
      totais.colhidoKg += kg;
    } else {
      linha[situacao] += area;
      totais[situacao] += area;
    }

    movimentos.push({ tipo: 'entrada', data: deIso(plantio.dataPlantio), plantio });
    if (plantio.dataColheita) {
      movimentos.push({ tipo: 'saida', data: deIso(plantio.dataColheita), plantio });
    }
  });

  return {
    totais,
    // Espécies com mais área no campo primeiro
    especies: Object.values(porEspecie).sort(
      (a, b) => b.crescendo + b.pronto + b.atrasado - (a.crescendo + a.pronto + a.atrasado),
    ),
    // Movimentos mais recentes primeiro
    movimentos: movimentos.sort((a, b) => b.data.localeCompare(a.data)),
  };
}

/** Número → "1.234,5 kg". */
export function formatarKg(valor) {
  const numero = Number(valor) || 0;
  return `${numero.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;
}
