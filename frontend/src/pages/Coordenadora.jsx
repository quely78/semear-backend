// =============================================================
// pages/Coordenadora.jsx — Tela 08: Início da responsável pela comunidade.
//
// Resumo do dia a dia (os gráficos completos ficam na aba Comunidade):
//   1. Filtro de período (vale para todos os números abaixo)
//   2. Precisa de atenção (só aparece quando há algo a fazer)
//   3. Produção: no campo, colhido, em estoque, vendido (com tendência
//      por mês e comparação com o mesmo período do ano anterior)
//   4. Dinheiro (só totais) → painel de vendas
//   5. Atalho para o painel completo e últimas movimentações
// =============================================================
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import FiltroPeriodo from '../components/graficos/FiltroPeriodo';
import Indicador from '../components/graficos/Indicador';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import {
  listarAgricultorasDaComunidade,
  listarPlantiosDaComunidade,
} from '../services/comunidadeService';
import { buscarResumoDaComunidade } from '../services/financasService';
import { diaEMes, hoje as calcularHoje } from '../utils/datas';
import { formatarMargem, formatarReaisCurto } from '../utils/dinheiro';
import {
  formatarKg,
  ICONE_MOVIMENTO,
  janelaDeColheita,
  resumirEstoque,
  ROTULO_MOVIMENTO,
  situacaoDoPlantio,
  textoDoMovimento,
} from '../utils/estoque';
import { formatarArea, formatarData } from '../utils/formatadores';
import {
  colheitasEVendas,
  periodoAnterior,
  periodoDoPainel,
  somaKgNoPeriodo as somaKg,
  somarPorMes,
  variacao,
} from '../utils/graficos';

export default function Coordenadora() {
  const hoje = calcularHoje();
  const [filtro, setFiltro] = useState('12m');
  const periodo = useMemo(() => periodoDoPainel(filtro), [filtro]);

  const [dados, setDados] = useState(null); // { comunidade, agricultoras, plantios }
  const [financas, setFinancas] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([listarAgricultorasDaComunidade(), listarPlantiosDaComunidade()])
      .then(([resumo, { plantios }]) => setDados({ ...resumo, plantios }))
      .catch((e) =>
        setErro(e.status === 404 ? e.message || 'Os dados da sua comunidade ainda não estão disponíveis.' : e.message),
      )
      .finally(() => setCarregando(false));
  }, []);

  // Dinheiro do período (só totais da comunidade)
  useEffect(() => {
    let ativo = true;
    buscarResumoDaComunidade({ dataInicio: periodo.dataInicio, dataFim: periodo.dataFim })
      .then((d) => ativo && setFinancas(d))
      .catch(() => ativo && setFinancas(null));
    return () => {
      ativo = false;
    };
  }, [periodo]);

  const agricultoras = dados?.agricultoras || [];
  const plantios = dados?.plantios || [];
  const ativas = agricultoras.filter((a) => Number(a.totalPlantios) > 0).length;
  const semPlantio = agricultoras.length - ativas;
  const { totais, movimentos } = resumirEstoque(plantios, hoje);
  const noCampo = totais.crescendo + totais.pronto + totais.atrasado;
  const paraColher = plantios.filter((p) => ['pronto', 'atrasado'].includes(situacaoDoPlantio(p, hoje)));
  const atrasados = paraColher.filter((p) => situacaoDoPlantio(p, hoje) === 'atrasado').length;

  // Séries por mês do período
  const { colheitas, vendas } = colheitasEVendas(plantios);
  const kgColhidoMes = somarPorMes(colheitas, periodo.meses, (m) => m.data, (m) => m.kg);
  const kgVendidoMes = somarPorMes(vendas, periodo.meses, (m) => m.data, (m) => m.kg);
  const areaPlantadaMes = somarPorMes(plantios, periodo.meses, (p) => p.dataPlantio, (p) => p.area);
  const anterior = periodoAnterior(periodo);
  const colhido = somaKg(colheitas, periodo);
  const vendido = somaKg(vendas, periodo);

  const receitaMes = periodo.meses.map((m) => financas?.meses?.find((x) => x.mes === m)?.receita || 0);

  return (
    <Layout>
      <section className="painel-responsavel">
        <p className="painel-responsavel__papel">Responsável pela comunidade</p>
        <h1 className="painel-responsavel__nome">{dados?.comunidade?.nome || 'Minha comunidade'}</h1>
        {dados && (
          <p className="painel-responsavel__resumo">
            {agricultoras.length} {agricultoras.length === 1 ? 'agricultora' : 'agricultoras'} · {ativas} com plantio
          </p>
        )}
      </section>

      {carregando && <Carregando texto="Carregando sua comunidade..." />}
      <Aviso tipo="erro">{erro}</Aviso>

      {dados && (
        <>
          <FiltroPeriodo valor={filtro} aoMudar={setFiltro} />

          {/* Só aparece quando há algo para fazer */}
          {(paraColher.length > 0 || semPlantio > 0) && (
            <section className="atencao" aria-label="Precisa de atenção">
              <h2 className="subtitulo">Precisa de atenção</h2>
              <ul className="atencao__lista">
                {paraColher.length > 0 && (
                  <li>
                    <Link to="/coordenadora/estoque" className="atencao__item">
                      <span className="atencao__icone atencao__icone--colheita" aria-hidden="true">
                        <Icone nome="cesta" tamanho={22} />
                      </span>
                      <span>
                        <strong>
                          {paraColher.length} {paraColher.length === 1 ? 'plantio pronto' : 'plantios prontos'} para colher
                        </strong>
                        <span className="atencao__detalhe">
                          {atrasados > 0
                            ? `${atrasados} já ${atrasados === 1 ? 'passou' : 'passaram'} da época`
                            : paraColher
                                .slice(0, 2)
                                .map((p) => `${p.especie} (${p.agricultora?.nome?.split(' ')[0]}) até ${diaEMes(janelaDeColheita(p).fim)}`)
                                .join(' · ')}
                        </span>
                      </span>
                      <Icone nome="avancar" tamanho={18} />
                    </Link>
                  </li>
                )}
                {semPlantio > 0 && (
                  <li>
                    <Link to="/coordenadora/agricultoras" className="atencao__item">
                      <span className="atencao__icone" aria-hidden="true">
                        <Icone nome="comunidade" tamanho={22} />
                      </span>
                      <span>
                        <strong>
                          {semPlantio} {semPlantio === 1 ? 'agricultora' : 'agricultoras'} sem plantio
                        </strong>
                        <span className="atencao__detalhe">Vale conversar e ajudar no registro</span>
                      </span>
                      <Icone nome="avancar" tamanho={18} />
                    </Link>
                  </li>
                )}
              </ul>
            </section>
          )}

          {/* Produção */}
          <section aria-labelledby="titulo-producao" className="painel-secao">
            <div className="painel-secao__topo">
              <h2 id="titulo-producao" className="subtitulo subtitulo--sem-margem">Produção</h2>
              <span className="painel-secao__periodo">{periodo.rotulo}</span>
            </div>
            <div className="painel-indicadores">
              <Indicador
                rotulo="No campo agora"
                valor={formatarArea(noCampo)}
                detalhe={`plantado no período: ${formatarArea(areaPlantadaMes.reduce((a, b) => a + b, 0))}`}
                tendencia={areaPlantadaMes}
              />
              <Indicador
                rotulo="Colhido"
                valor={formatarKg(colhido)}
                variacao={variacao(colhido, somaKg(colheitas, anterior))}
                rotuloVariacao="vs ano anterior"
                detalhe="sem dados do ano anterior"
                tendencia={kgColhidoMes}
              />
              <Indicador
                rotulo="Em estoque agora"
                valor={formatarKg(totais.estoqueKg)}
                detalhe={`de ${formatarKg(totais.colhidoKg)} colhidos no total`}
                para="/coordenadora/estoque"
              />
              <Indicador
                rotulo="Vendido"
                valor={formatarKg(vendido)}
                variacao={variacao(vendido, somaKg(vendas, anterior))}
                rotuloVariacao="vs ano anterior"
                detalhe="sem dados do ano anterior"
                tendencia={kgVendidoMes}
              />
            </div>
          </section>

          <Link to="/comunidade" className="atalho-painel">
            <span className="atalho-painel__icone" aria-hidden="true">
              <Icone nome="grafico" tamanho={22} />
            </span>
            <span>
              <strong>Painel da comunidade</strong>
              <span className="atalho-painel__texto">Gráficos do estoque e da produção · exportar PDF, planilha e imagens</span>
            </span>
            <Icone nome="avancar" tamanho={18} />
          </Link>

          {/* Dinheiro (só totais) */}
          {financas && (
            <section aria-labelledby="titulo-dinheiro" className="painel-secao">
              <div className="painel-secao__topo">
                <h2 id="titulo-dinheiro" className="subtitulo subtitulo--sem-margem">Dinheiro</h2>
                <Link to="/coordenadora/vendas" className="painel-secao__link">
                  Painel de vendas <Icone nome="avancar" tamanho={16} />
                </Link>
              </div>
              <div className="painel-indicadores">
                <Indicador
                  rotulo="Vendido"
                  valor={formatarReaisCurto(financas.total.receita)}
                  tendencia={receitaMes}
                  para="/coordenadora/vendas"
                />
                <Indicador
                  rotulo="Margem média"
                  valor={formatarMargem(financas.total.margem)}
                  detalhe={`sobrou ${formatarReaisCurto(financas.total.lucro)}`}
                  para="/coordenadora/vendas"
                />
              </div>
            </section>
          )}

          {movimentos.length > 0 && (
            <section className="cartao">
              <h2 className="subtitulo">Últimas movimentações</h2>
              <ul className="movimentos">
                {movimentos.slice(0, 5).map((m) => (
                  <li key={`${m.tipo}-${m.plantio.id}-${m.chave ?? ''}`} className={`movimento movimento--${m.tipo}`}>
                    <span className="movimento__icone" aria-hidden="true">
                      <Icone nome={ICONE_MOVIMENTO[m.tipo]} tamanho={18} />
                    </span>
                    <div>
                      <p className="movimento__titulo">{textoDoMovimento(m)}</p>
                      <p className="movimento__detalhe">
                        {ROTULO_MOVIMENTO[m.tipo]} · {formatarData(m.data)} · {m.plantio.agricultora?.nome?.split(' ')[0]}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link to="/coordenadora/estoque" className="botao-texto">
                Ver todas no estoque
              </Link>
            </section>
          )}
        </>
      )}
    </Layout>
  );
}
