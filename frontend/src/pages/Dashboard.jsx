// =============================================================
// pages/Dashboard.jsx — Tela 06: Painel da comunidade (RF08/RF09).
//   /comunidade
//
// Responsável: painel completo da comunidade (produção e estoque),
//   com filtro de período e exportação (PDF do painel, planilha e
//   PNG de cada gráfico).
// Agricultora: alterna entre "Comunidade" (áreas por espécie) e
//   "Meus plantios" (a produção dela).
// =============================================================
import { useEffect, useMemo, useState } from 'react';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import BarraPartes from '../components/graficos/BarraPartes';
import CartaoGrafico from '../components/graficos/CartaoGrafico';
import FiltroPeriodo from '../components/graficos/FiltroPeriodo';
import GraficoBarrasH from '../components/graficos/GraficoBarrasH';
import GraficoColunas from '../components/graficos/GraficoColunas';
import Indicador from '../components/graficos/Indicador';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { listarAgricultorasDaComunidade, listarPlantiosDaComunidade } from '../services/comunidadeService';
import { carregarPainel } from '../services/dashboardService';
import { listarPlantios } from '../services/plantioService';
import { hoje as calcularHoje } from '../utils/datas';
import { formatarKg, resumirEstoque, SITUACOES } from '../utils/estoque';
import { baixarCsv, imprimir } from '../utils/exportarPainel';
import { formatarArea } from '../utils/formatadores';
import {
  colheitasEVendas,
  COR,
  noPeriodo,
  periodoAnterior,
  periodoDoPainel,
  rotuloMes,
  somaKgNoPeriodo,
  somarPorMes,
  variacao,
} from '../utils/graficos';

const CORES_CAMPO = { crescendo: '#86ae3e', pronto: '#be3e73', atrasado: '#8e2754' };

/** Área por espécie (m²) com a quantidade de plantios. */
function areaPorEspecie(plantios) {
  const linhas = {};
  plantios.forEach((p) => {
    const linha = (linhas[p.especie] ||= { nome: p.especie, valor: 0, plantios: 0 });
    linha.valor += Number(p.area) || 0;
    linha.plantios += 1;
  });
  return Object.values(linhas)
    .sort((a, b) => b.valor - a.valor)
    .map((l) => ({ ...l, detalhe: `${l.plantios} ${l.plantios === 1 ? 'plantio' : 'plantios'}` }));
}

const percentual = (parte, total) => (total ? `${Math.round((parte / total) * 100)}% da área` : '');

export default function Dashboard() {
  const { usuario } = useAuth();
  const ehResponsavel = usuario?.tipo === 'COORDENADORA';
  const hoje = calcularHoje();

  // Agricultora: 'comunidade' ou 'meus'. Responsável: sempre a comunidade completa.
  const [visao, setVisao] = useState('comunidade');
  const [filtro, setFiltro] = useState('12m');
  const [filtroAgricultora, setFiltroAgricultora] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState('');
  const periodo = useMemo(() => periodoDoPainel(filtro), [filtro]);

  const [painel, setPainel] = useState(null); // números gerais da comunidade
  const [plantios, setPlantios] = useState(null); // detalhados (responsável: da comunidade; agricultora: os dela)
  const [agricultoras, setAgricultoras] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  const detalhado = ehResponsavel || visao === 'meus';

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    const buscas = ehResponsavel
      ? Promise.all([carregarPainel(usuario?.tipo), listarPlantiosDaComunidade(), listarAgricultorasDaComunidade()]).then(
          ([p, { plantios: lista }, resumo]) => ({ painel: p.dados, plantios: lista, agricultoras: resumo.agricultoras }),
        )
      : visao === 'meus'
        ? listarPlantios().then((lista) => ({ painel: null, plantios: lista, agricultoras: [] }))
        : carregarPainel(usuario?.tipo).then((p) => ({ painel: p.dados, plantios: null, agricultoras: [] }));

    buscas
      .then((r) => {
        if (!ativo) return;
        setPainel(r.painel);
        setPlantios(r.plantios);
        setAgricultoras(r.agricultoras);
      })
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [visao, ehResponsavel, usuario?.tipo]);

  // ---------- Números do painel detalhado ----------
  const todos = plantios || [];
  // Opções dos filtros (a partir de todos os plantios carregados)
  const opcoesAgricultora = [
    ...new Map(todos.filter((p) => p.agricultora).map((p) => [String(p.agricultora.id), p.agricultora.nome])),
  ].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  const opcoesEspecie = [...new Set(todos.map((p) => p.especie))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  // Os filtros valem para todos os números e gráficos abaixo
  const lista = todos.filter(
    (p) =>
      (!filtroAgricultora || String(p.agricultora?.id) === filtroAgricultora) &&
      (!filtroEspecie || p.especie === filtroEspecie),
  );
  const filtrando = Boolean(filtroAgricultora || filtroEspecie);
  const descricaoFiltro = [filtroAgricultora && opcoesAgricultora.find(([id]) => id === filtroAgricultora)?.[1], filtroEspecie]
    .filter(Boolean)
    .join(' · ');
  const { totais, especies } = resumirEstoque(lista, hoje);
  const noCampo = totais.crescendo + totais.pronto + totais.atrasado;
  const { colheitas, vendas } = colheitasEVendas(lista);
  const kgColhidoMes = somarPorMes(colheitas, periodo.meses, (m) => m.data, (m) => m.kg);
  const kgVendidoMes = somarPorMes(vendas, periodo.meses, (m) => m.data, (m) => m.kg);
  const areaMes = somarPorMes(lista, periodo.meses, (p) => p.dataPlantio, (p) => p.area);
  const anterior = periodoAnterior(periodo);
  const colhido = somaKgNoPeriodo(colheitas, periodo);
  const vendido = somaKgNoPeriodo(vendas, periodo);
  const areaNoPeriodo = lista.filter((p) => noPeriodo(p.dataPlantio, periodo)).reduce((s, p) => s + p.area, 0);
  // Com filtro: quem tem plantio dentro do filtro. Sem filtro: quem tem algum plantio.
  const ativas = filtrando
    ? new Set(lista.map((p) => p.agricultora?.id)).size
    : agricultoras.filter((a) => Number(a.totalPlantios) > 0).length;
  const textoEspecies = `${especies.length} ${especies.length === 1 ? 'espécie' : 'espécies'}`;
  const textoPlantios = `${lista.length} ${lista.length === 1 ? 'plantio' : 'plantios'}`;
  const temVendasComData = lista.some((p) => p.vendas);
  const rotulos = periodo.meses.map((m) => rotuloMes(m));
  const rotulosLongos = periodo.meses.map((m) => rotuloMes(m, true));

  // Área por espécie: detalhado = dos plantios; senão, do painel da comunidade
  const porEspecie = detalhado
    ? areaPorEspecie(lista)
    : (painel?.especies || []).map((e) => ({
        nome: e.especie,
        valor: e.area,
        detalhe: `${e.quantidade} ${e.quantidade === 1 ? 'plantio' : 'plantios'} · ${percentual(e.area, painel.areaTotal)}`,
      }));

  const nomeComunidade = painel?.comunidade?.nome;
  const titulo = ehResponsavel ? 'Painel da comunidade' : visao === 'meus' ? 'Meus números' : 'Comunidade';

  function aoBaixarPlanilha() {
    if (!detalhado) {
      baixarCsv(`${titulo} areas por especie`, ['Espécie', 'Área (m²)', 'Plantios'], (painel?.especies || []).map((e) => [e.especie, e.area, e.quantidade]));
      return;
    }
    const mensal = periodo.meses.map((m, i) => [rotuloMes(m, true), areaMes[i], kgColhidoMes[i], ...(temVendasComData ? [kgVendidoMes[i]] : [])]);
    const cabecalhoMensal = ['Mês', 'Área plantada (m²)', 'Colhido (kg)', ...(temVendasComData ? ['Vendido (kg)'] : [])];
    const linhasEspecie = detalhado
      ? especies.map((e) => [e.especie, e.crescendo + e.pronto + e.atrasado, e.colhidoKg, e.vendidoKg, e.estoqueKg])
      : porEspecie.map((e) => [e.nome, e.valor, '', '', '']);
    baixarCsv(`${titulo} ${periodo.rotulo}${filtrando ? ` ${descricaoFiltro}` : ''}`, cabecalhoMensal, [
      ...(detalhado ? mensal : []),
      [],
      ['Espécie', 'No campo (m²)', 'Colhido (kg)', 'Vendido (kg)', 'Em estoque (kg)'],
      ...linhasEspecie,
    ]);
  }

  return (
    <Layout>
      <div>
        {nomeComunidade && visao === 'comunidade' && <p className="sobretitulo">{nomeComunidade}</p>}
        <h1 className="titulo">{titulo}</h1>
      </div>

      {!ehResponsavel && (
        <div className="alternador" role="group" aria-label="Ver números de">
          {[
            { valor: 'comunidade', rotulo: 'Comunidade' },
            { valor: 'meus', rotulo: 'Meus plantios' },
          ].map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={`alternador__opcao ${visao === opcao.valor ? 'alternador__opcao--ativa' : ''}`}
              aria-pressed={visao === opcao.valor}
              onClick={() => setVisao(opcao.valor)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      )}

      {/* Barra de ferramentas: período + exportar (vale para o painel todo) */}
      <div className="painel-ferramentas nao-imprimir">
        {detalhado && <FiltroPeriodo valor={filtro} aoMudar={setFiltro} />}
        {detalhado && !carregando && todos.length > 0 && (
          <div className="painel-filtros-dados">
            {ehResponsavel && opcoesAgricultora.length > 1 && (
              <label className="filtro">
                <span className="filtro__rotulo">Agricultora</span>
                <select
                  value={filtroAgricultora}
                  onChange={(e) => setFiltroAgricultora(e.target.value)}
                  className={filtroAgricultora ? 'filtro--ativo' : ''}
                >
                  <option value="">Todas</option>
                  {opcoesAgricultora.map(([id, nome]) => (
                    <option key={id} value={id}>
                      {nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="filtro">
              <span className="filtro__rotulo">Espécie</span>
              <select
                value={filtroEspecie}
                onChange={(e) => setFiltroEspecie(e.target.value)}
                className={filtroEspecie ? 'filtro--ativo' : ''}
              >
                <option value="">Todas</option>
                {opcoesEspecie.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {filtrando && (
          <p className="painel-filtro-ativo">
            <span>
              Mostrando só: <strong>{descricaoFiltro}</strong>
            </span>
            <button
              type="button"
              className="botao-texto"
              onClick={() => {
                setFiltroAgricultora('');
                setFiltroEspecie('');
              }}
            >
              Limpar filtros
            </button>
          </p>
        )}
        <div className="painel-acoes">
          <button type="button" className="painel-acao" onClick={() => imprimir('imprimindo-painel')} disabled={carregando}>
            <Icone nome="baixar" tamanho={16} /> PDF do painel
          </button>
          <button type="button" className="painel-acao" onClick={aoBaixarPlanilha} disabled={carregando}>
            <Icone nome="baixar" tamanho={16} /> Planilha (CSV)
          </button>
        </div>
      </div>

      {carregando && <Carregando texto="Montando o painel..." />}
      <Aviso tipo="erro">{erro}</Aviso>

      {!carregando && !erro && (
        <div className="painel-pilha painel-exportavel">
          {/* Só aparece no PDF */}
          <div className="painel-impressao">
            <strong>SemeAR · {titulo}</strong>
            <span>
              {nomeComunidade ? `${nomeComunidade} · ` : ''}
              {detalhado ? `${periodo.rotulo} · ` : ''}
              {filtrando ? `filtro: ${descricaoFiltro} · ` : ''}gerado em {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>

          {detalhado ? (
            <>
              <div className="painel-indicadores">
                <Indicador
                  rotulo="Plantado no período"
                  valor={formatarArea(areaNoPeriodo)}
                  detalhe={`${formatarArea(noCampo)} no campo agora`}
                  tendencia={areaMes}
                />
                <Indicador
                  rotulo="Colhido"
                  valor={formatarKg(colhido)}
                  variacao={variacao(colhido, somaKgNoPeriodo(colheitas, anterior))}
                  rotuloVariacao="vs ano anterior"
                  detalhe={periodo.rotulo}
                  tendencia={kgColhidoMes}
                />
                <Indicador
                  rotulo="Em estoque agora"
                  valor={formatarKg(totais.estoqueKg)}
                  detalhe={`${formatarKg(totais.vendidoKg)} vendidos no total`}
                />
                {ehResponsavel ? (
                  <Indicador
                    rotulo="Agricultoras ativas"
                    valor={`${ativas} de ${agricultoras.length}`}
                    detalhe={`${textoPlantios} · ${textoEspecies}`}
                  />
                ) : (
                  <Indicador rotulo="Plantios" valor={String(lista.length)} detalhe={textoEspecies} />
                )}
              </div>

              <CartaoGrafico
                titulo={temVendasComData ? 'Entradas e saídas do estoque' : 'Colheita por mês'}
                sub={`kg por mês · ${periodo.rotulo}`}
                exportavel
              >
                <GraficoColunas
                  titulo="Entradas e saídas do estoque, kg por mês"
                  rotulos={rotulos}
                  rotulosLongos={rotulosLongos}
                  series={[
                    { nome: temVendasComData ? 'Colhido (entrada)' : 'Colhido', cor: COR.principal, valores: kgColhidoMes },
                    ...(temVendasComData ? [{ nome: 'Vendido (saída)', cor: COR.secundaria, valores: kgVendidoMes }] : []),
                  ]}
                  formatar={formatarKg}
                />
              </CartaoGrafico>

              <CartaoGrafico titulo="Área plantada por mês" sub={`m² que foram para o campo · ${periodo.rotulo}`} exportavel>
                <GraficoColunas
                  titulo="Área plantada por mês, em metros quadrados"
                  rotulos={rotulos}
                  rotulosLongos={rotulosLongos}
                  series={[{ nome: 'Área plantada', cor: COR.principal, valores: areaMes }]}
                  formatar={formatarArea}
                />
              </CartaoGrafico>

              <CartaoGrafico titulo="Área por espécie" sub="m² de todos os plantios" exportavel>
                <GraficoBarrasH titulo="Área por espécie" itens={porEspecie} formatar={formatarArea} nomeValor="Área" />
              </CartaoGrafico>

              <CartaoGrafico titulo="Situação do campo" sub={`${formatarArea(noCampo)} ainda não colhidos`}>
                <BarraPartes
                  titulo="Situação do campo"
                  formatar={formatarArea}
                  partes={['crescendo', 'pronto', 'atrasado'].map((s) => ({
                    nome: SITUACOES[s].rotulo,
                    valor: totais[s],
                    cor: CORES_CAMPO[s],
                  }))}
                />
              </CartaoGrafico>

              <CartaoGrafico titulo="Destino do que foi colhido" sub={`${formatarKg(totais.colhidoKg)} colhidos no total`}>
                <BarraPartes
                  titulo="Colhido: vendido e em estoque"
                  formatar={formatarKg}
                  partes={[
                    { nome: 'Vendido', valor: totais.vendidoKg, cor: COR.secundaria },
                    { nome: 'Em estoque', valor: totais.estoqueKg, cor: COR.principal },
                  ]}
                />
              </CartaoGrafico>
            </>
          ) : (
            painel && (
              <>
                <div className="painel-indicadores">
                  <Indicador rotulo="Área plantada" valor={formatarArea(painel.areaTotal)} detalhe="todos os plantios" />
                  <Indicador
                    rotulo="Agricultoras ativas"
                    valor={String(painel.agricultorasAtivas)}
                    detalhe={`${porEspecie.length} espécies cultivadas`}
                  />
                </div>
                <CartaoGrafico titulo="Área por espécie" sub="m² plantados na comunidade" exportavel>
                  <GraficoBarrasH titulo="Área por espécie" itens={porEspecie} formatar={formatarArea} nomeValor="Área" />
                </CartaoGrafico>
              </>
            )
          )}
        </div>
      )}
    </Layout>
  );
}
