// =============================================================
// utils/estoque.js — Plantios vistos como um ESTOQUE.
//
//   NO CAMPO .. o plantio (área plantada, em m²), até ser colhido
//   ENTRADA ... a colheita (os kg colhidos entram no estoque)
//   SAÍDA ..... a venda (os kg vendidos saem do estoque)
//   EM ESTOQUE  colhido − vendido
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

/** kg já vendidos do plantio (a lista da agricultora traz kgVendidos; a da comunidade, as vendas). */
export function kgVendidosDo(plantio) {
  if (plantio.kgVendidos !== undefined) return Number(plantio.kgVendidos) || 0;
  return (plantio.vendas || []).reduce((soma, v) => soma + (Number(v.quantidadeKg) || 0), 0);
}

/** kg colhidos que ainda não foram vendidos. */
export function kgEmEstoqueDo(plantio) {
  return Math.max((Number(plantio.quantidadeColhida) || 0) - kgVendidosDo(plantio), 0);
}

/**
 * Resume uma lista de plantios como estoque.
 * @returns {{
 *   totais: { crescendo, pronto, atrasado, colhidoArea, colhidoKg, vendidoKg, estoqueKg },
 *   especies: Array<{ especie, crescendo, pronto, atrasado, colhidoArea, colhidoKg, vendidoKg, estoqueKg }>,
 *   movimentos: Array<{ tipo: 'plantio'|'entrada'|'saida', data, kg?, plantio }>
 * }}
 *   plantio = foi para o campo · entrada = colheita · saida = venda
 */
export function resumirEstoque(plantios, hoje) {
  const vazio = () => ({
    crescendo: 0,
    pronto: 0,
    atrasado: 0,
    colhidoArea: 0,
    colhidoKg: 0,
    vendidoKg: 0,
    estoqueKg: 0,
  });
  const totais = vazio();
  const porEspecie = {};
  const movimentos = [];

  plantios.forEach((plantio) => {
    const area = Number(plantio.area) || 0;
    const situacao = situacaoDoPlantio(plantio, hoje);
    const linha = (porEspecie[plantio.especie] ||= { especie: plantio.especie, ...vazio() });

    if (situacao === 'colhido') {
      const kg = Number(plantio.quantidadeColhida) || 0;
      const vendido = kgVendidosDo(plantio);
      const estoque = Math.max(kg - vendido, 0);
      for (const alvo of [linha, totais]) {
        alvo.colhidoArea += area;
        alvo.colhidoKg += kg;
        alvo.vendidoKg += vendido;
        alvo.estoqueKg += estoque;
      }
    } else {
      linha[situacao] += area;
      totais[situacao] += area;
    }

    movimentos.push({ tipo: 'plantio', data: deIso(plantio.dataPlantio), plantio });
    if (plantio.dataColheita) {
      movimentos.push({
        tipo: 'entrada',
        data: deIso(plantio.dataColheita),
        kg: Number(plantio.quantidadeColhida) || 0,
        plantio,
      });
    }
    (plantio.vendas || []).forEach((venda, i) => {
      movimentos.push({ tipo: 'saida', data: deIso(venda.data), kg: venda.quantidadeKg, plantio, chave: i });
    });
  });

  return {
    totais,
    // Espécies com mais área no campo primeiro
    especies: Object.values(porEspecie).sort(
      (a, b) => b.crescendo + b.pronto + b.atrasado - (a.crescendo + a.pronto + a.atrasado) || b.colhidoKg - a.colhidoKg,
    ),
    // Movimentos mais recentes primeiro
    movimentos: movimentos.sort((a, b) => b.data.localeCompare(a.data)),
  };
}

/** Texto de um movimento: "Colheita de Milho · 180 kg". */
export function textoDoMovimento({ tipo, kg, plantio }) {
  if (tipo === 'plantio') return `Plantio de ${plantio.especie} · ${plantio.area.toLocaleString('pt-BR')} m²`;
  if (tipo === 'entrada') return `Colheita de ${plantio.especie} · ${formatarKg(kg)}`;
  return `Venda de ${plantio.especie} · ${formatarKg(kg)}`;
}

/** Rótulo do tipo: "No campo", "Entrada", "Saída". */
export const ROTULO_MOVIMENTO = { plantio: 'No campo', entrada: 'Entrada', saida: 'Saída' };

/** Ícone de cada tipo de movimento. */
export const ICONE_MOVIMENTO = { plantio: 'broto', entrada: 'entrada', saida: 'saida' };

/** Número → "1.234,5 kg". */
export function formatarKg(valor) {
  const numero = Number(valor) || 0;
  return `${numero.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;
}
