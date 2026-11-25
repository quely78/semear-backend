// =============================================================
// pages/DinheiroPlantio.jsx — Dinheiro de UM plantio.
//   /plantios/:id/dinheiro  (aba ao lado do Calendário)
//
//   1. Vendido, gasto, resultado e margem
//   2. Preço mínimo do kg × preço médio que ela conseguiu
//   3. Ponto de equilíbrio: quantos kg pagam os gastos (medidor)
//   4. Gastos por categoria
// =============================================================
import { Link, useLocation, useParams } from 'react-router-dom';
import AbasPlantio from '../components/AbasPlantio';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import CartaoGrafico from '../components/graficos/CartaoGrafico';
import GraficoBarrasH from '../components/graficos/GraficoBarrasH';
import Indicador from '../components/graficos/Indicador';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import useFinancasDoPlantio from '../hooks/useFinancasDoPlantio';
import { CATEGORIAS_GASTO, formatarMargem, formatarReais } from '../utils/dinheiro';
import { formatarKg } from '../utils/estoque';
import { formatarArea, formatarData } from '../utils/formatadores';
import { COR } from '../utils/graficos';

const percentual = (parte, total) => Math.min(Math.max((parte / total) * 100, 0), 100);
const porcento = (parte, total) => `${percentual(parte, total)}%`;

/** Medidor do ponto de equilíbrio sobre os kg colhidos, com escala embaixo. */
function MedidorEquilibrio({ resumo }) {
  const { kgColhidos, kgVendidos, pontoEquilibrioKg } = resumo;
  const marca = Math.min(pontoEquilibrioKg, kgColhidos);
  const pagando = Math.min(kgVendidos, marca);
  const lucro = Math.max(kgVendidos - marca, 0);
  const temMarca = pontoEquilibrioKg > 0 && pontoEquilibrioKg <= kgColhidos;
  const marcaPercentual = percentual(marca, kgColhidos);
  // Perto das bordas, o número da marca encosta para dentro (não sai do cartão)
  const alinhamento =
    marcaPercentual <= 15 ? 'medidor__escala-marca--inicio' : marcaPercentual >= 85 ? 'medidor__escala-marca--fim' : '';

  return (
    <div className="medidor">
      <div
        className="medidor__trilho"
        role="img"
        aria-label={`Vendidos ${formatarKg(kgVendidos)} de ${formatarKg(kgColhidos)}. Os gastos se pagam com ${formatarKg(pontoEquilibrioKg)}.`}
      >
        <span className="medidor__parte" style={{ width: porcento(pagando, kgColhidos), background: COR.secundaria }} />
        <span className="medidor__parte" style={{ width: porcento(lucro, kgColhidos), background: COR.principal }} />
        {temMarca && <span className="medidor__marca" style={{ left: `${marcaPercentual}%` }} />}
      </div>
      <div className="medidor__escala">
        <span>0</span>
        {temMarca && (
          <span className={`medidor__escala-marca ${alinhamento}`} style={{ left: `${marcaPercentual}%` }}>
            {formatarKg(pontoEquilibrioKg)}
          </span>
        )}
        <span>{formatarKg(kgColhidos)}</span>
      </div>
      <ul className="grafico-painel__legenda medidor__legenda">
        <li>
          <span className="grafico-painel__chave" style={{ background: COR.secundaria }} aria-hidden="true" />
          Pagou gastos ({formatarKg(pagando)})
        </li>
        <li>
          <span className="grafico-painel__chave" style={{ background: COR.principal }} aria-hidden="true" />
          Lucro ({formatarKg(lucro)})
        </li>
        <li>
          <span className="grafico-painel__chave medidor__chave-vazia" aria-hidden="true" />
          No estoque ({formatarKg(resumo.kgEmEstoque)})
        </li>
      </ul>
    </div>
  );
}

/** Cartão do ponto de equilíbrio — muda conforme a fase do plantio. */
function CartaoEquilibrio({ plantio, resumo, voltar }) {
  let conteudo;
  if (!plantio.dataColheita) {
    conteudo = (
      <Link to={`/plantios/${plantio.id}/calendario`} state={{ plantio, voltar }} replace className="botao-texto">
        Registre a colheita no Calendário para calcular
      </Link>
    );
  } else if (resumo.gastos === 0) {
    conteudo = <p className="painel-cartao__vazio">Anote os gastos do plantio para calcular.</p>;
  } else if (!resumo.kgVendidos) {
    conteudo = <p className="painel-cartao__vazio">Anote a primeira venda para calcular.</p>;
  } else {
    const faltam = Math.max(resumo.pontoEquilibrioKg - resumo.kgVendidos, 0);
    conteudo = (
      <>
        <p className="medidor__manchete">
          <strong>{formatarKg(resumo.pontoEquilibrioKg)}</strong> pagam os gastos
          <span className={`medidor__estado ${resumo.gastosPagos ? 'medidor__estado--ok' : ''}`}>
            {resumo.gastosPagos ? (
              <>
                <Icone nome="check" tamanho={14} /> pago
              </>
            ) : (
              `faltam ${formatarKg(faltam)}`
            )}
          </span>
        </p>
        {resumo.pontoEquilibrioKg > resumo.kgColhidos && (
          <Aviso tipo="erro">
            Vendendo tudo a {formatarReais(resumo.precoMedioKg)}/kg não paga os gastos. Venda acima de{' '}
            {formatarReais(resumo.precoMinimoKg)}/kg.
          </Aviso>
        )}
        <MedidorEquilibrio resumo={resumo} />
      </>
    );
  }
  return (
    <CartaoGrafico
      titulo="Ponto de equilíbrio"
      sub={resumo.precoMedioKg ? `pelo seu preço médio de ${formatarReais(resumo.precoMedioKg)}/kg` : undefined}
    >
      {conteudo}
    </CartaoGrafico>
  );
}

export default function DinheiroPlantio() {
  const { id } = useParams();
  const local = useLocation();
  const voltar = local.state?.voltar || { para: '/plantios', rotulo: 'Meus plantios' };
  const cabecalho = { voltarPara: voltar.para, rotuloVoltar: voltar.rotulo };
  const { financas, carregando, erro } = useFinancasDoPlantio(id);

  if (carregando) {
    return (
      <Layout cabecalho={cabecalho}>
        <Carregando texto="Fazendo as contas..." />
      </Layout>
    );
  }
  if (!financas) {
    return (
      <Layout cabecalho={cabecalho}>
        <Aviso tipo="erro">{erro || 'Plantio não encontrado.'}</Aviso>
      </Layout>
    );
  }

  const { plantio, resumo, gastos } = financas;
  const estado = { plantio, voltar };
  const deCadaDez =
    resumo.margem === null
      ? null
      : Math.abs(resumo.margem * 10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Gastos por categoria (maior primeiro)
  const porCategoria = CATEGORIAS_GASTO.map((c) => ({
    nome: c.rotulo,
    valor: gastos.filter((g) => g.categoria === c.valor).reduce((soma, g) => soma + g.valor, 0),
  }))
    .filter((c) => c.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .map((c) => ({ ...c, detalhe: `${Math.round((c.valor / resumo.gastos) * 100)}% dos gastos` }));

  return (
    <Layout cabecalho={cabecalho}>
      <div>
        <p className="sobretitulo">Dinheiro do plantio</p>
        <h1 className="titulo">{plantio.especie}</h1>
        <p className="texto-apoio">
          Plantado em {formatarData(plantio.dataPlantio)} · {formatarArea(plantio.area)}
          {plantio.dataColheita ? ` · ${formatarKg(plantio.quantidadeColhida)} colhidos` : ''}
        </p>
      </div>

      <AbasPlantio plantio={plantio} ativa="dinheiro" voltar={voltar} />

      <div className="painel-indicadores">
        <Indicador rotulo="Vendido" valor={formatarReais(resumo.receita)} detalhe={`${formatarKg(resumo.kgVendidos)} vendidos`} />
        <Indicador
          rotulo="Gasto"
          valor={formatarReais(resumo.gastos)}
          detalhe={`${gastos.length} ${gastos.length === 1 ? 'gasto anotado' : 'gastos anotados'}`}
        />
        <Indicador
          rotulo={resumo.lucro >= 0 ? 'Sobrou' : 'Faltou'}
          valor={formatarReais(Math.abs(resumo.lucro))}
          alerta={resumo.lucro < 0}
          detalhe="vendido − gasto"
        />
        <Indicador
          rotulo="Margem de lucro"
          valor={formatarMargem(resumo.margem)}
          detalhe={
            deCadaDez === null
              ? 'sem vendas ainda'
              : resumo.margem >= 0
                ? `sobram ${deCadaDez} de cada R$ 10`
                : `perde ${deCadaDez} de cada R$ 10`
          }
        />
        {resumo.precoMinimoKg > 0 && (
          <Indicador rotulo="Preço mínimo do kg" valor={formatarReais(resumo.precoMinimoKg)} detalhe="abaixo disso, prejuízo" />
        )}
        {resumo.precoMedioKg > 0 && (
          <Indicador
            rotulo="Seu preço médio"
            valor={formatarReais(resumo.precoMedioKg)}
            detalhe={
              resumo.precoMinimoKg > 0
                ? `${resumo.precoMedioKg >= resumo.precoMinimoKg ? '+' : '−'}${formatarReais(Math.abs(resumo.precoMedioKg - resumo.precoMinimoKg))}/kg vs mínimo`
                : 'por kg vendido'
            }
            alerta={resumo.precoMinimoKg > 0 && resumo.precoMedioKg < resumo.precoMinimoKg}
          />
        )}
      </div>

      <CartaoEquilibrio plantio={plantio} resumo={resumo} voltar={voltar} />

      {porCategoria.length > 0 && (
        <CartaoGrafico titulo="Gastos por categoria" sub={`total ${formatarReais(resumo.gastos)}`} exportavel>
          <GraficoBarrasH
            titulo="Gastos por categoria"
            itens={porCategoria}
            formatar={formatarReais}
            formatarEixo={(v) => `R$ ${v}`}
            cor={COR.secundaria}
            nomeValor="Gasto"
          />
        </CartaoGrafico>
      )}

      <div className="financas__acoes">
        <Link to={`/plantios/${plantio.id}/vendas`} state={estado} className="botao botao--primario">
          <Icone nome="mais" tamanho={18} /> Registrar venda
        </Link>
        <Link to={`/plantios/${plantio.id}/gastos`} state={estado} className="botao botao--secundario">
          <Icone nome="mais" tamanho={18} /> Anotar gasto
        </Link>
      </div>
      <Link to="/plantios/rendimento" className="botao-texto centralizado">
        Comparar com meus outros plantios
      </Link>
    </Layout>
  );
}
