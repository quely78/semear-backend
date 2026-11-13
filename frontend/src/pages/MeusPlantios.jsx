// =============================================================
// pages/MeusPlantios.jsx — Tela 03: Meus plantios (RF06).
// Lista os plantios da agricultora com filtros por data e espécie.
// =============================================================
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import PlantioCard from '../components/PlantioCard';
import { ESPECIES, PERIODOS } from '../config/dados';
import { listarPlantios } from '../services/plantioService';
import { dataDiasAtras, formatarArea } from '../utils/formatadores';

export default function MeusPlantios() {
  const local = useLocation();
  const navegar = useNavigate();

  const [plantios, setPlantios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  // Mensagem vinda do formulário ("Plantio salvo com sucesso")
  const [sucesso, setSucesso] = useState(local.state?.mensagem || '');

  // Filtros escolhidos (valores dos dois <select>)
  const [periodo, setPeriodo] = useState('');
  const [especie, setEspecie] = useState('');

  // Apaga a mensagem de sucesso do histórico para não reaparecer ao voltar
  useEffect(() => {
    if (local.state?.mensagem) navegar(local.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esconde a mensagem de sucesso depois de 7 segundos (tempo para ler com calma)
  useEffect(() => {
    if (!sucesso) return undefined;
    const timer = setTimeout(() => setSucesso(''), 7000);
    return () => clearTimeout(timer);
  }, [sucesso]);

  // Busca os plantios sempre que um filtro muda
  useEffect(() => {
    let ativo = true; // evita atualizar a tela se ela já foi fechada

    async function carregar() {
      setCarregando(true);
      setErro('');
      try {
        const dias = PERIODOS.find((p) => p.valor === periodo)?.dias;
        const lista = await listarPlantios({
          especie,
          dataInicio: dias ? dataDiasAtras(dias) : '',
        });
        if (ativo) setPlantios(lista);
      } catch (e) {
        if (ativo) setErro(e.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [periodo, especie]);

  // Soma das áreas da lista atual (resumo no topo)
  const areaTotal = plantios.reduce((soma, p) => soma + Number(p.area || 0), 0);
  const filtrando = Boolean(periodo || especie);

  return (
    <Layout>
      <div className="linha-titulo">
        <h1 className="titulo">Meus plantios</h1>
        {/* Botão principal da tela: novo plantio */}
        <Link to="/plantios/novo" className="botao botao--primario botao--pequeno">
          <Icone nome="mais" tamanho={18} /> Novo
        </Link>
      </div>

      {/* Filtros com rótulo sempre visível: assim fica claro o que está filtrado */}
      <div className="filtros">
        <label className="filtro">
          <span className="filtro__rotulo">Data</span>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className={periodo ? 'filtro--ativo' : ''}
          >
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.valor ? p.rotulo : 'Todas'}
              </option>
            ))}
          </select>
        </label>
        <label className="filtro">
          <span className="filtro__rotulo">Espécie</span>
          <select
            value={especie}
            onChange={(e) => setEspecie(e.target.value)}
            className={especie ? 'filtro--ativo' : ''}
          >
            <option value="">Todas</option>
            {ESPECIES.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtrando && (
        <button
          type="button"
          className="botao-texto filtros__limpar"
          onClick={() => {
            setPeriodo('');
            setEspecie('');
          }}
        >
          Limpar filtros
        </button>
      )}

      <Aviso tipo="sucesso">{sucesso}</Aviso>
      <Aviso tipo="erro">{erro}</Aviso>

      {/* Conteúdo: carregando → vazio → lista */}
      {carregando ? (
        <Carregando texto="Buscando seus plantios..." />
      ) : plantios.length === 0 ? (
        <div className="vazio">
          <img src="/icone.png" alt="" className="vazio__imagem" />
          <p>
            {filtrando
              ? 'Nenhum plantio encontrado com esses filtros.'
              : 'Você ainda não registrou nenhum plantio.'}
          </p>
          {!filtrando && (
            <Link to="/plantios/novo" className="botao botao--primario">
              Registrar meu primeiro plantio
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="resumo-lista">
            <p className="resumo-lista__numeros">
              <strong>{plantios.length}</strong> {plantios.length === 1 ? 'plantio' : 'plantios'} ·{' '}
              <strong>{formatarArea(areaTotal)}</strong> no total
            </p>
            {/* Legenda da barrinha colorida de cada cartão */}
            <p className="legenda-cultivo" aria-hidden="true">
              <span className="legenda-cultivo__item legenda-cultivo__item--organico">Orgânico</span>
              <span className="legenda-cultivo__item">Convencional</span>
            </p>
          </div>
          <p className="texto-apoio">
            Toque em um plantio para ver o calendário e o dinheiro dele.
          </p>
          <Link to="/plantios/rendimento" className="botao botao--secundario">
            <Icone nome="grafico" tamanho={18} /> Qual plantio rende mais?
          </Link>
          <ul className="lista">
            {plantios.map((plantio) => (
              <li key={plantio.id}>
                <PlantioCard plantio={plantio} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Layout>
  );
}
