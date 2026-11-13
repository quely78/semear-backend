// =============================================================
// pages/DinheiroPlantio.jsx — Dinheiro de UM plantio.
//   /plantios/:id/dinheiro  (aba ao lado do Calendário)
//
// Responde, em palavras simples:
//   1. Quanto sobrou? (vendeu − gastou) e a margem em frase
//   2. Os gastos já estão pagos? (ponto de equilíbrio, em kg)
//   3. Qual o menor preço para não ter prejuízo? (preço mínimo do kg)
// =============================================================
import { Link, useLocation, useParams } from 'react-router-dom';
import AbasPlantio from '../components/AbasPlantio';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import useFinancasDoPlantio from '../hooks/useFinancasDoPlantio';
import { formatarReais, formatarMargem, fraseDaMargem } from '../utils/dinheiro';
import { formatarKg } from '../utils/estoque';
import { formatarArea, formatarData } from '../utils/formatadores';

const porcento = (parte, total) => `${Math.min(Math.max((parte / total) * 100, 0), 100)}%`;

/** Barra: kg colhidos, com o que foi vendido e a marca de "pagou os gastos". */
function BarraEquilibrio({ resumo }) {
  const { kgColhidos, kgVendidos, pontoEquilibrioKg } = resumo;
  const marca = Math.min(pontoEquilibrioKg, kgColhidos);
  const pagando = Math.min(kgVendidos, marca); // kg que pagaram gastos
  const lucro = Math.max(kgVendidos - marca, 0); // kg vendidos depois disso

  return (
    <div className="equilibrio">
      <div
        className="equilibrio__trilho"
        role="img"
        aria-label={`Vendeu ${formatarKg(kgVendidos)} de ${formatarKg(kgColhidos)}. Os gastos se pagam com ${formatarKg(pontoEquilibrioKg)}.`}
      >
        <span className="equilibrio__parte equilibrio__parte--pagando" style={{ width: porcento(pagando, kgColhidos) }} />
        <span className="equilibrio__parte equilibrio__parte--lucro" style={{ width: porcento(lucro, kgColhidos) }} />
      </div>
      {pontoEquilibrioKg > 0 && pontoEquilibrioKg <= kgColhidos && (
        <div className="equilibrio__marca" style={{ left: porcento(marca, kgColhidos) }}>
          <span>{formatarKg(pontoEquilibrioKg)} pagam os gastos</span>
        </div>
      )}
      <ul className="equilibrio__legenda">
        <li><span className="equilibrio__cor equilibrio__cor--pagando" />pagou gastos</li>
        <li><span className="equilibrio__cor equilibrio__cor--lucro" />lucro ({formatarKg(lucro)})</li>
        <li><span className="equilibrio__cor" />no estoque ({formatarKg(resumo.kgEmEstoque)})</li>
      </ul>
    </div>
  );
}

/** Cartão "os gastos já estão pagos?" — muda conforme a fase do plantio. */
function CartaoEquilibrio({ plantio, resumo, voltar }) {
  if (!plantio.dataColheita) {
    return (
      <section className="cartao">
        <h2 className="subtitulo">Os gastos já estão pagos?</h2>
        <p className="texto-apoio">
          Depois da colheita, mostramos aqui quantos kg você precisa vender para pagar os gastos.
        </p>
        <Link to={`/plantios/${plantio.id}/calendario`} state={{ plantio, voltar }} replace className="botao-texto">
          Registrar a colheita no Calendário
        </Link>
      </section>
    );
  }
  if (resumo.gastos === 0) {
    return (
      <section className="cartao">
        <h2 className="subtitulo">Nenhum gasto anotado</h2>
        <p className="texto-apoio">
          Anote o que gastou com semente, adubo, mão de obra e transporte para saber se o plantio
          deu lucro de verdade.
        </p>
      </section>
    );
  }
  if (!resumo.kgVendidos) {
    return (
      <section className="cartao">
        <h2 className="subtitulo">Os gastos já estão pagos?</h2>
        <p className="texto-apoio">
          Anote a primeira venda: com o preço do kg, mostramos quantos kg pagam os{' '}
          {formatarReais(resumo.gastos)} que você gastou.
        </p>
      </section>
    );
  }

  const naoPagaNemVendendoTudo = resumo.pontoEquilibrioKg > resumo.kgColhidos;
  const faltam = Math.max(resumo.pontoEquilibrioKg - resumo.kgVendidos, 0);
  return (
    <section className="cartao">
      <div className="equilibrio__titulo">
        {resumo.gastosPagos && (
          <span className="equilibrio__ok" aria-hidden="true">
            <Icone nome="check" tamanho={18} />
          </span>
        )}
        <h2 className="subtitulo subtitulo--sem-margem">
          {resumo.gastosPagos ? 'Os gastos já estão pagos' : `Faltam ${formatarKg(faltam)} para pagar os gastos`}
        </h2>
      </div>
      <p className="financas__texto">
        {resumo.gastosPagos ? (
          <>
            Com <strong>{formatarKg(resumo.pontoEquilibrioKg)}</strong> vendidos você pagou tudo o que
            gastou. Cada kg vendido daqui pra frente é lucro.
          </>
        ) : (
          <>
            Vendendo a {formatarReais(resumo.precoMedioKg)} o kg, você precisa vender{' '}
            <strong>{formatarKg(resumo.pontoEquilibrioKg)}</strong> para pagar os gastos.
          </>
        )}
      </p>
      {naoPagaNemVendendoTudo && (
        <Aviso tipo="erro">
          Mesmo vendendo tudo o que colheu a esse preço, não dá para pagar os gastos. Tente vender
          por mais de {formatarReais(resumo.precoMinimoKg)} o kg.
        </Aviso>
      )}
      <BarraEquilibrio resumo={resumo} />
    </section>
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

  const { plantio, resumo } = financas;
  const sobrou = resumo.lucro >= 0;
  const estado = { plantio, voltar };

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

      {/* 1. Quanto sobrou */}
      <section className="cartao">
        <p className="financas__rotulo">{sobrou ? 'Quanto sobrou neste plantio' : 'Quanto faltou para pagar os gastos'}</p>
        <p className={`financas__grande ${sobrou ? '' : 'financas__grande--negativo'}`}>
          {formatarReais(Math.abs(resumo.lucro))}
        </p>
        <div className="financas__dupla">
          <div className="financas__caixa financas__caixa--entrada">
            <span>Vendeu</span>
            <strong>{formatarReais(resumo.receita)}</strong>
          </div>
          <div className="financas__caixa financas__caixa--saida">
            <span>Gastou</span>
            <strong>{formatarReais(resumo.gastos)}</strong>
          </div>
        </div>
        {resumo.margem !== null && (
          <>
            <p className="financas__texto">{fraseDaMargem(resumo.margem)}</p>
            <p className="texto-apoio">Margem de lucro: {formatarMargem(resumo.margem)}</p>
          </>
        )}
      </section>

      {/* 2. Ponto de equilíbrio */}
      <CartaoEquilibrio plantio={plantio} resumo={resumo} voltar={voltar} />

      {/* 3. Preço mínimo */}
      {resumo.precoMinimoKg > 0 && (
        <section className="cartao">
          <p className="financas__rotulo">Preço mínimo</p>
          <p className="financas__texto financas__texto--grande">
            Não venda por menos de{' '}
            <strong className="financas__minimo">{formatarReais(resumo.precoMinimoKg)}/kg</strong>
          </p>
          <p className="texto-apoio">
            É quanto cada kg custou para você ({formatarReais(resumo.gastos)} ÷{' '}
            {formatarKg(resumo.kgColhidos)}). Abaixo disso, a venda dá prejuízo.
          </p>
        </section>
      )}

      <div className="financas__acoes">
        <Link to={`/plantios/${plantio.id}/vendas`} state={estado} className="botao botao--primario">
          <Icone nome="mais" tamanho={18} /> Registrar venda
        </Link>
        <Link to={`/plantios/${plantio.id}/gastos`} state={estado} className="botao botao--secundario">
          <Icone nome="mais" tamanho={18} /> Anotar gasto
        </Link>
      </div>
      <p className="texto-apoio centralizado">
        {financas.vendas.length} {financas.vendas.length === 1 ? 'venda' : 'vendas'} ·{' '}
        {financas.gastos.length} {financas.gastos.length === 1 ? 'gasto' : 'gastos'} anotados
      </p>
      <Link to="/plantios/rendimento" className="botao-texto centralizado">
        Comparar com meus outros plantios
      </Link>
    </Layout>
  );
}
