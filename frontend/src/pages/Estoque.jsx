// =============================================================
// pages/Estoque.jsx — Controle dos plantios como um ESTOQUE.
//   /coordenadora/estoque — só a responsável pela comunidade,
//   com os plantios de todas as agricultoras (filtro por agricultora).
//
//   ENTRADA = plantio (m² no campo)  ·  SAÍDA = colheita (kg colhidos)
//
// Mostra: área no campo por situação, o que está pronto para colher,
// os totais por espécie e o histórico de entradas e saídas.
// =============================================================
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import { listarPlantiosDaComunidade } from '../services/comunidadeService';
import { diaEMes, hoje as calcularHoje } from '../utils/datas';
import {
  formatarKg,
  janelaDeColheita,
  resumirEstoque,
  situacaoDoPlantio,
  SITUACOES,
} from '../utils/estoque';
import { formatarArea, formatarData } from '../utils/formatadores';

// Quantos movimentos mostrar antes do botão "Ver mais"
const MOVIMENTOS_POR_VEZ = 8;

export default function Estoque() {
  const hoje = calcularHoje();
  const [parametros, setParametros] = useSearchParams();

  const [plantios, setPlantios] = useState([]);
  const [comunidade, setComunidade] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mostrarMovimentos, setMostrarMovimentos] = useState(MOVIMENTOS_POR_VEZ);

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

  // Agricultoras que aparecem nos plantios (para o filtro)
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

  /** Largura de cada pedaço da barra (em %). */
  const parte = (valor) => (noCampo ? `${(valor / noCampo) * 100}%` : '0%');

  function mudarFiltro(valor) {
    setMostrarMovimentos(MOVIMENTOS_POR_VEZ);
    setParametros(valor ? { agricultora: valor } : {});
  }

  return (
    <Layout>
      <div>
        <p className="sobretitulo">
          {comunidade?.nome || 'Minha comunidade'}
        </p>
        <h1 className="titulo">Estoque</h1>
        <p className="texto-apoio">
          Plantio é a entrada; colheita é a saída. Veja o que está no campo e o que já foi colhido.
        </p>
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
            {/* Visão geral: o que está no campo + o que já saiu */}
            <section className="cartao estoque-geral" aria-label="Resumo do estoque">
              <p className="estoque-geral__rotulo">No campo agora</p>
              <p className="estoque-geral__valor">{formatarArea(noCampo)}</p>

              <div className="estoque-barra" aria-hidden="true">
                <span className="estoque-barra__parte estoque-barra__parte--crescendo" style={{ width: parte(totais.crescendo) }} />
                <span className="estoque-barra__parte estoque-barra__parte--pronto" style={{ width: parte(totais.pronto) }} />
                <span className="estoque-barra__parte estoque-barra__parte--atrasado" style={{ width: parte(totais.atrasado) }} />
              </div>

              <ul className="estoque-linhas">
                <li>
                  <span className="estoque-marca estoque-marca--crescendo" aria-hidden="true" />
                  {SITUACOES.crescendo.rotulo}
                  <strong>{formatarArea(totais.crescendo)}</strong>
                </li>
                <li>
                  <span className="estoque-marca estoque-marca--pronto" aria-hidden="true" />
                  {SITUACOES.pronto.rotulo}
                  <strong>{formatarArea(totais.pronto)}</strong>
                </li>
                {totais.atrasado > 0 && (
                  <li>
                    <span className="estoque-marca estoque-marca--atrasado" aria-hidden="true" />
                    {SITUACOES.atrasado.rotulo}
                    <strong>{formatarArea(totais.atrasado)}</strong>
                  </li>
                )}
                <li className="estoque-linhas__saida">
                  <Icone nome="cesta" tamanho={18} />
                  Já colhido
                  <strong>
                    {formatarKg(totais.colhidoKg)}
                    <span> de {formatarArea(totais.colhidoArea)}</span>
                  </strong>
                </li>
              </ul>
            </section>

            {/* Prontos para colher: o que pede ação agora */}
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
                            {situacao === 'atrasado'
                              ? `época terminou em ${diaEMes(janela.fim)}`
                              : `colher até ${diaEMes(janela.fim)}`}
                          </p>
                        </div>
                        <span className={`selo selo--${situacao}`}>{SITUACOES[situacao].rotulo}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Totais por espécie */}
            <section className="estoque-secao">
              <h2 className="subtitulo">Por espécie</h2>
              <div className="tabela-envoltorio">
                <table className="tabela tabela--estoque">
                  <thead>
                    <tr>
                      <th scope="col">Espécie</th>
                      <th scope="col">No campo</th>
                      <th scope="col">Colhido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {especies.map((linha) => {
                      const campo = linha.crescendo + linha.pronto + linha.atrasado;
                      const prontoArea = linha.pronto + linha.atrasado;
                      return (
                        <tr key={linha.especie}>
                          <th scope="row">{linha.especie}</th>
                          <td>
                            {formatarArea(campo)}
                            {prontoArea > 0 && (
                              <span className="tabela__nota">{formatarArea(prontoArea)} pronto</span>
                            )}
                          </td>
                          <td>{linha.colhidoKg ? formatarKg(linha.colhidoKg) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Histórico de entradas e saídas */}
            <section className="estoque-secao">
              <h2 className="subtitulo">Entradas e saídas</h2>
              <ul className="movimentos">
                {movimentos.slice(0, mostrarMovimentos).map(({ tipo, data, plantio }) => (
                  <li key={`${tipo}-${plantio.id}`} className={`movimento movimento--${tipo}`}>
                    <span className="movimento__icone" aria-hidden="true">
                      <Icone nome={tipo} tamanho={18} />
                    </span>
                    <div>
                      <p className="movimento__titulo">
                        {tipo === 'entrada'
                          ? `Plantio de ${plantio.especie} · ${formatarArea(plantio.area)}`
                          : `Colheita de ${plantio.especie} · ${formatarKg(plantio.quantidadeColhida)}`}
                      </p>
                      <p className="movimento__detalhe">
                        {tipo === 'entrada' ? 'Entrada' : 'Saída'} · {formatarData(data)}
                        {plantio.agricultora ? ` · ${plantio.agricultora.nome}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {movimentos.length > mostrarMovimentos && (
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
