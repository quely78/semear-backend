// =============================================================
// pages/VendasComunidade.jsx — Painel de vendas da comunidade (responsável).
//   /coordenadora/vendas
//
// Só TOTAIS: quanto a comunidade vendeu e gastou, a margem mês a mês,
// o preço médio do kg em cada lugar de venda e o resultado por espécie.
// O dinheiro de cada agricultora fica visível só para ela (a API nem manda).
// =============================================================
import { useEffect, useMemo, useState } from 'react';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import FiltroPeriodo from '../components/graficos/FiltroPeriodo';
import GraficoColunas from '../components/graficos/GraficoColunas';
import GraficoLinha from '../components/graficos/GraficoLinha';
import Indicador from '../components/graficos/Indicador';
import Layout from '../components/Layout';
import { buscarResumoDaComunidade } from '../services/financasService';
import { formatarMargem, formatarReais, formatarReaisCurto, rotuloCanal } from '../utils/dinheiro';
import { formatarKg } from '../utils/estoque';
import { COR, compacto, periodoDoPainel, rotuloMes, variacao } from '../utils/graficos';

/** Frase comparando o melhor e o pior preço do kg entre os lugares de venda. */
function conclusaoDosCanais(canais) {
  if (canais.length < 2) return '';
  const melhor = canais[0];
  const pior = canais[canais.length - 1];
  if (!pior.precoMedioKg || melhor.precoMedioKg / pior.precoMedioKg < 1.3) return '';
  const proporcao = pior.precoMedioKg / melhor.precoMedioKg;
  const quanto = proporcao <= 0.6 ? 'quase a metade' : `${Math.round(proporcao * 100)}%`;
  return `Em "${rotuloCanal(pior.canal)}" o kg sai por ${quanto} do preço em "${rotuloCanal(melhor.canal)}". Vender junto onde paga melhor pode valer a pena.`;
}

const menosUmAno = (data) => `${Number(data.slice(0, 4)) - 1}${data.slice(4)}`;

export default function VendasComunidade() {
  const [filtro, setFiltro] = useState('12m');
  const periodo = useMemo(() => periodoDoPainel(filtro), [filtro]);
  const [dados, setDados] = useState(null);
  const [anterior, setAnterior] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    const { dataInicio, dataFim } = periodo;
    Promise.all([
      buscarResumoDaComunidade({ dataInicio, dataFim }),
      // Mesmo período um ano antes, para a comparação dos indicadores
      buscarResumoDaComunidade({ dataInicio: menosUmAno(dataInicio), dataFim: menosUmAno(dataFim) }).catch(() => null),
    ])
      .then(([atual, antes]) => {
        if (!ativo) return;
        setDados(atual);
        setAnterior(antes);
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [periodo]);

  const total = dados?.total;
  const semMovimento = dados && !total.receita && !total.gastos;
  const maiorPreco = Math.max(...(dados?.canais || []).map((c) => c.precoMedioKg), 0);
  const frase = dados ? conclusaoDosCanais(dados.canais) : '';

  // Séries por mês (meses sem venda: margem em branco, não zero)
  const doMes = (m) => dados?.meses?.find((x) => x.mes === m);
  const receitaMes = periodo.meses.map((m) => doMes(m)?.receita || 0);
  const gastosMes = periodo.meses.map((m) => doMes(m)?.gastos || 0);
  const margemMes = periodo.meses.map((m) => {
    const mes = doMes(m);
    return mes?.margem === null || mes?.margem === undefined ? null : Math.round(mes.margem * 100);
  });
  const lucroMes = periodo.meses.map((m) => doMes(m)?.lucro || 0);
  const rotulos = periodo.meses.map((m) => rotuloMes(m));
  const rotulosLongos = periodo.meses.map((m) => rotuloMes(m, true));
  const antes = anterior?.total;

  return (
    <Layout cabecalho={{ voltarPara: '/coordenadora', rotuloVoltar: 'Início' }}>
      <div>
        <p className="sobretitulo">{dados?.comunidade?.nome || 'Minha comunidade'}</p>
        <h1 className="titulo">Vendas da comunidade</h1>
        {dados && (
          <p className="texto-apoio">
            {dados.agricultorasComVendas} de {dados.totalAgricultoras}{' '}
            {dados.totalAgricultoras === 1 ? 'agricultora anotou' : 'agricultoras anotaram'} vendas no período
          </p>
        )}
      </div>

      <FiltroPeriodo valor={filtro} aoMudar={setFiltro} />
      <Aviso tipo="erro">{erro}</Aviso>

      {carregando && !dados ? (
        <Carregando texto="Somando as vendas..." />
      ) : semMovimento ? (
        <section className="cartao">
          <p className="texto-apoio">
            Nenhuma venda ou gasto anotado em {periodo.rotulo}. As agricultoras anotam na aba{' '}
            <strong>Dinheiro</strong> de cada plantio.
          </p>
        </section>
      ) : (
        dados && (
          <div className={`painel-pilha ${carregando ? 'painel--atualizando' : ''}`}>
            <div className="painel-indicadores">
              <Indicador
                rotulo="Vendido"
                valor={formatarReaisCurto(total.receita)}
                variacao={variacao(total.receita, antes?.receita)}
                rotuloVariacao="vs ano anterior"
                detalhe={`${formatarKg(total.kgVendidos)} vendidos`}
                tendencia={receitaMes}
              />
              <Indicador
                rotulo="Gasto"
                valor={formatarReaisCurto(total.gastos)}
                variacao={variacao(total.gastos, antes?.gastos)}
                rotuloVariacao="vs ano anterior"
                subirEhBom={false}
                detalhe="semente, adubo, mão de obra..."
                tendencia={gastosMes}
              />
              <Indicador
                rotulo={total.lucro >= 0 ? 'Sobrou' : 'Faltou'}
                valor={formatarReaisCurto(Math.abs(total.lucro))}
                variacao={variacao(total.lucro, antes?.lucro)}
                rotuloVariacao="vs ano anterior"
                detalhe="vendido − gasto"
                tendencia={lucroMes}
              />
              <Indicador
                rotulo="Margem média"
                valor={formatarMargem(total.margem)}
                detalhe={
                  total.precoMedioKg ? `preço médio ${formatarReais(total.precoMedioKg)}/kg` : 'sem vendas no período'
                }
              />
            </div>

            <section className="cartao painel-cartao">
              <div className="painel-cartao__topo">
                <h2 className="subtitulo subtitulo--sem-margem">Vendido e gasto por mês</h2>
                <p className="painel-cartao__sub">R$ · {periodo.rotulo}</p>
              </div>
              <GraficoColunas
                titulo="Vendido e gasto por mês, em reais"
                rotulos={rotulos}
                rotulosLongos={rotulosLongos}
                series={[
                  { nome: 'Vendido', cor: COR.principal, valores: receitaMes },
                  { nome: 'Gasto', cor: COR.secundaria, valores: gastosMes },
                ]}
                formatar={formatarReais}
              />
            </section>

            <section className="cartao painel-cartao">
              <div className="painel-cartao__topo">
                <h2 className="subtitulo subtitulo--sem-margem">Margem de lucro por mês</h2>
                <p className="painel-cartao__sub">% do vendido que sobrou · meses sem venda ficam em branco</p>
              </div>
              <GraficoLinha
                titulo="Margem de lucro por mês, em porcentagem"
                nome="Margem"
                rotulos={rotulos}
                rotulosLongos={rotulosLongos}
                valores={margemMes}
                formatar={(v) => `${v}%`}
              />
            </section>

            {dados.canais.length > 0 && (
              <section className="cartao painel-cartao">
                <div className="painel-cartao__topo">
                  <h2 className="subtitulo subtitulo--sem-margem">Preço médio do kg por canal</h2>
                  <p className="painel-cartao__sub">e quanto da receita veio de cada um</p>
                </div>
                <ul className="barras">
                  {dados.canais.map((c) => (
                    <li key={c.canal} className="barras__item">
                      <div className="barras__rotulos">
                        <span>
                          {rotuloCanal(c.canal)}
                          <span className="barras__nota">
                            {' '}
                            · {formatarKg(c.kgVendidos)} · {Math.round((c.receita / total.receita) * 100)}% da receita
                          </span>
                        </span>
                        <strong>{formatarReais(c.precoMedioKg)}</strong>
                      </div>
                      <div className="grafico__trilho grafico__trilho--fino">
                        <div
                          className="grafico__barra barras__barra"
                          style={{ width: `${(c.precoMedioKg / maiorPreco) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                {frase && <p className="financas__destaque">{frase}</p>}
              </section>
            )}

            {dados.especies.length > 0 && (
              <section className="cartao painel-cartao">
                <div className="painel-cartao__topo">
                  <h2 className="subtitulo subtitulo--sem-margem">Resultado por espécie</h2>
                  <p className="painel-cartao__sub">{periodo.rotulo}</p>
                </div>
                <div className="tabela-envoltorio">
                  <table className="tabela tabela--compacta">
                    <thead>
                      <tr>
                        <th scope="col">Espécie</th>
                        <th scope="col" className="tabela__numero">Vendido</th>
                        <th scope="col" className="tabela__numero">Gasto</th>
                        <th scope="col" className="tabela__numero">Margem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.especies.map((e) => (
                        <tr key={e.especie}>
                          <th scope="row">{e.especie}</th>
                          <td className="tabela__numero">R$ {compacto(e.receita)}</td>
                          <td className="tabela__numero">R$ {compacto(e.gastos)}</td>
                          <td className="tabela__numero">
                            <span className="margem-celula">
                              <span className="margem-celula__trilho" aria-hidden="true">
                                <span
                                  className="margem-celula__barra"
                                  style={{ width: `${Math.max(Math.min((e.margem || 0) * 100, 100), 0)}%` }}
                                />
                              </span>
                              <strong className={e.margem !== null && e.margem < 0 ? 'financas__negativo' : ''}>
                                {formatarMargem(e.margem)}
                              </strong>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )
      )}

    </Layout>
  );
}
