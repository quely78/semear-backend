// =============================================================
// pages/Estoque.jsx — Estoque da comunidade (só a responsável).
//   /coordenadora/estoque  (filtro por agricultora: ?agricultora=3)
//
//   NO CAMPO (m²) → COLHEITA = entrada (kg) → VENDA = saída (kg)
//   Em estoque = colhido − vendido
//
// Tela de consulta, sem gráficos (eles ficam no painel da Comunidade):
// resumo em números, o que está pronto para colher, a tabela por
// espécie e o registro de movimentos.
// =============================================================
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import { listarPlantiosDaComunidade } from '../services/comunidadeService';
import { diaEMes, hoje as calcularHoje } from '../utils/datas';
import { formatarKg, janelaDeColheita, resumirEstoque, situacaoDoPlantio, SITUACOES } from '../utils/estoque';
import { formatarArea, formatarData } from '../utils/formatadores';

// Quantos movimentos mostrar antes do botão "Ver mais"
const MOVIMENTOS_POR_VEZ = 10;

const TIPO = {
  plantio: { rotulo: 'Plantio', classe: 'campo' },
  entrada: { rotulo: 'Colheita', classe: 'entrada' },
  saida: { rotulo: 'Venda', classe: 'saida' },
};

export default function Estoque() {
  const hoje = calcularHoje();
  const [parametros, setParametros] = useSearchParams();

  const [plantios, setPlantios] = useState([]);
  const [comunidade, setComunidade] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mostrarMovimentos, setMostrarMovimentos] = useState(MOVIMENTOS_POR_VEZ);
  // Filtros da tabela de movimentos
  const [tipoMovimento, setTipoMovimento] = useState(''); // '' | 'plantio' | 'entrada' | 'saida'
  const [especieMovimento, setEspecieMovimento] = useState('');

  // Filtro por agricultora. Fica na URL: ?agricultora=3
  const filtroAgricultora = parametros.get('agricultora') || '';

  useEffect(() => {
    listarPlantiosDaComunidade()
      .then((dados) => {
        setComunidade(dados.comunidade);
        setPlantios(dados.plantios);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  const agricultoras = useMemo(() => {
    const mapa = new Map();
    plantios.forEach((p) => p.agricultora && mapa.set(p.agricultora.id, p.agricultora.nome));
    return [...mapa].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [plantios]);

  const visiveis = filtroAgricultora
    ? plantios.filter((p) => String(p.agricultora?.id) === filtroAgricultora)
    : plantios;

  const { totais, especies, movimentos } = resumirEstoque(visiveis, hoje);
  const noCampo = totais.crescendo + totais.pronto + totais.atrasado;
  const paraColher = visiveis
    .filter((p) => ['pronto', 'atrasado'].includes(situacaoDoPlantio(p, hoje)))
    .sort((a, b) => a.dataPlantio.localeCompare(b.dataPlantio));

  const especiesDosMovimentos = [...new Set(movimentos.map((m) => m.plantio.especie))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
  const movimentosFiltrados = movimentos.filter(
    (m) => (!tipoMovimento || m.tipo === tipoMovimento) && (!especieMovimento || m.plantio.especie === especieMovimento),
  );

  /** Muda um filtro da tabela e volta para o começo da lista. */
  const filtrarMovimentos = (mudar) => (valor) => {
    setMostrarMovimentos(MOVIMENTOS_POR_VEZ);
    mudar(valor);
  };

  function mudarFiltro(valor) {
    setMostrarMovimentos(MOVIMENTOS_POR_VEZ);
    setParametros(valor ? { agricultora: valor } : {});
  }

  const resumo = [
    { rotulo: 'No campo', valor: formatarArea(noCampo) },
    { rotulo: 'Colhido', valor: formatarKg(totais.colhidoKg) },
    { rotulo: 'Vendido', valor: formatarKg(totais.vendidoKg) },
    { rotulo: 'Em estoque', valor: formatarKg(totais.estoqueKg), destaque: true },
  ];

  return (
    <Layout>
      <div className="linha-titulo">
        <div>
          <p className="sobretitulo">{comunidade?.nome || 'Minha comunidade'}</p>
          <h1 className="titulo">Estoque</h1>
        </div>
        <Link to="/comunidade" className="botao-texto">
          <Icone nome="grafico" tamanho={18} /> Gráficos
        </Link>
      </div>

      {agricultoras.length > 0 && (
        <label className="filtro">
          <span className="filtro__rotulo">Agricultora</span>
          <select
            value={filtroAgricultora}
            onChange={(e) => mudarFiltro(e.target.value)}
            className={filtroAgricultora ? 'filtro--ativo' : ''}
          >
            <option value="">Todas</option>
            {agricultoras.map(([id, nome]) => (
              <option key={id} value={id}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      )}

      <Aviso tipo="erro">{erro}</Aviso>

      {carregando ? (
        <Carregando texto="Somando o estoque..." />
      ) : !erro && visiveis.length === 0 ? (
        <div className="vazio">
          <img src="/icone.png" alt="" className="vazio__imagem" />
          <p>Ainda não há plantios registrados na comunidade.</p>
        </div>
      ) : (
        !erro && (
          <>
            {/* Resumo: uma linha de números, sem enfeite */}
            <dl className="resumo-tecnico">
              {resumo.map((item) => (
                <div key={item.rotulo} className={item.destaque ? 'resumo-tecnico__item--destaque' : ''}>
                  <dt>{item.rotulo}</dt>
                  <dd>{item.valor}</dd>
                </div>
              ))}
            </dl>

            {paraColher.length > 0 && (
              <section className="estoque-secao">
                <h2 className="subtitulo">Pronto para colher</h2>
                <ul className="lista">
                  {paraColher.map((p) => {
                    const situacao = situacaoDoPlantio(p, hoje);
                    const janela = janelaDeColheita(p);
                    return (
                      <li key={p.id} className="item-estoque">
                        <div>
                          <p className="item-estoque__titulo">
                            {p.especie} · {formatarArea(p.area)}
                          </p>
                          <p className="item-estoque__detalhe">
                            {p.agricultora ? `${p.agricultora.nome} · ` : ''}
                            {situacao === 'atrasado' ? `época terminou em ${diaEMes(janela.fim)}` : `colher até ${diaEMes(janela.fim)}`}
                          </p>
                        </div>
                        <span className={`selo selo--${situacao}`}>{SITUACOES[situacao].rotulo}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="estoque-secao">
              <h2 className="subtitulo">Por espécie</h2>
              <div className="tabela-envoltorio">
                <table className="tabela tabela--compacta">
                  <thead>
                    <tr>
                      <th scope="col">Espécie</th>
                      <th scope="col" className="tabela__numero">Campo</th>
                      <th scope="col" className="tabela__numero">Colhido</th>
                      <th scope="col" className="tabela__numero">Vendido</th>
                      <th scope="col" className="tabela__numero">Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {especies.map((linha) => {
                      const campo = linha.crescendo + linha.pronto + linha.atrasado;
                      return (
                        <tr key={linha.especie}>
                          <th scope="row">{linha.especie}</th>
                          <td className="tabela__numero">{campo ? formatarArea(campo) : '—'}</td>
                          <td className="tabela__numero">{linha.colhidoKg ? formatarKg(linha.colhidoKg) : '—'}</td>
                          <td className="tabela__numero">{linha.vendidoKg ? formatarKg(linha.vendidoKg) : '—'}</td>
                          <td className="tabela__numero">
                            <strong>{linha.colhidoKg ? formatarKg(linha.estoqueKg) : '—'}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">Total</th>
                      <td className="tabela__numero">{formatarArea(noCampo)}</td>
                      <td className="tabela__numero">{formatarKg(totais.colhidoKg)}</td>
                      <td className="tabela__numero">{formatarKg(totais.vendidoKg)}</td>
                      <td className="tabela__numero">{formatarKg(totais.estoqueKg)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className="estoque-secao">
              <h2 className="subtitulo">Movimentos</h2>
              <div className="movimentos-filtros">
                <div className="seletor-ano" role="group" aria-label="Tipo de movimento">
                  {[
                    { valor: '', rotulo: 'Todos' },
                    { valor: 'plantio', rotulo: 'Plantio' },
                    { valor: 'entrada', rotulo: 'Colheita' },
                    { valor: 'saida', rotulo: 'Venda' },
                  ].map((opcao) => (
                    <button
                      key={opcao.valor || 'todos'}
                      type="button"
                      className={`seletor-ano__opcao ${tipoMovimento === opcao.valor ? 'seletor-ano__opcao--ativa' : ''}`}
                      aria-pressed={tipoMovimento === opcao.valor}
                      onClick={() => filtrarMovimentos(setTipoMovimento)(opcao.valor)}
                    >
                      {opcao.rotulo}
                    </button>
                  ))}
                </div>
                <label className="filtro">
                  <span className="filtro__rotulo">Espécie</span>
                  <select
                    value={especieMovimento}
                    onChange={(e) => filtrarMovimentos(setEspecieMovimento)(e.target.value)}
                    className={especieMovimento ? 'filtro--ativo' : ''}
                  >
                    <option value="">Todas</option>
                    {especiesDosMovimentos.map((nome) => (
                      <option key={nome} value={nome}>
                        {nome}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="movimentos-contagem" aria-live="polite">
                {movimentosFiltrados.length} {movimentosFiltrados.length === 1 ? 'movimento' : 'movimentos'}
                {(tipoMovimento || especieMovimento) && (
                  <button
                    type="button"
                    className="botao-texto"
                    onClick={() => {
                      setTipoMovimento('');
                      setEspecieMovimento('');
                      setMostrarMovimentos(MOVIMENTOS_POR_VEZ);
                    }}
                  >
                    Limpar filtros
                  </button>
                )}
              </p>
              {movimentosFiltrados.length === 0 ? (
                <p className="painel-cartao__vazio">Nenhum movimento com esses filtros.</p>
              ) : (
              <div className="tabela-envoltorio">
                <table className="tabela tabela--compacta tabela--movimentos">
                  <thead>
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Movimento</th>
                      <th scope="col" className="tabela__numero">Qtd.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentosFiltrados.slice(0, mostrarMovimentos).map((m) => (
                      <tr key={`${m.tipo}-${m.plantio.id}-${m.chave ?? ''}`}>
                        <td className="tabela__data">{formatarData(m.data)}</td>
                        <td>
                          <span className={`tipo-movimento tipo-movimento--${TIPO[m.tipo].classe}`}>{TIPO[m.tipo].rotulo}</span>{' '}
                          {m.plantio.especie}
                          {m.plantio.agricultora && <span className="tabela__sub">{m.plantio.agricultora.nome}</span>}
                        </td>
                        <td className="tabela__numero">
                          {m.tipo === 'plantio' ? formatarArea(m.plantio.area) : `${m.tipo === 'saida' ? '−' : '+'}${formatarKg(m.kg)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
              {movimentosFiltrados.length > mostrarMovimentos && (
                <button
                  type="button"
                  className="botao botao--secundario"
                  onClick={() => setMostrarMovimentos((n) => n + MOVIMENTOS_POR_VEZ)}
                >
                  Ver mais
                </button>
              )}
            </section>
          </>
        )
      )}
    </Layout>
  );
}
