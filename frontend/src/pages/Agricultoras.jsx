// =============================================================
// pages/Agricultoras.jsx — Lista das agricultoras da comunidade.
// Só a responsável pela comunidade (COORDENADORA) acessa esta tela.
//
// Recursos:
//   - busca por nome
//   - ordenação por área plantada (maior primeiro) ou por nome
// =============================================================
import { useEffect, useState } from 'react';
import AgricultoraCard from '../components/AgricultoraCard';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Carregando from '../components/Carregando';
import Layout from '../components/Layout';
import { listarAgricultorasDaComunidade } from '../services/comunidadeService';

/** Remove acentos e deixa minúsculo, para a busca achar "Conceição" digitando "conceicao". */
function normalizar(texto = '') {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export default function Agricultoras() {
  const [agricultoras, setAgricultoras] = useState([]);
  const [comunidade, setComunidade] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('area'); // 'area' ou 'nome'

  // Busca a lista ao abrir a tela
  useEffect(() => {
    listarAgricultorasDaComunidade()
      .then((dados) => {
        setAgricultoras(dados.agricultoras);
        setComunidade(dados.comunidade);
      })
      .catch((e) =>
        setErro(
          e.status === 404
            ? 'A lista de agricultoras ainda não está disponível no servidor.'
            : e.message,
        ),
      )
      .finally(() => setCarregando(false));
  }, []);

  // Aplica a busca e a ordenação escolhidas
  const visiveis = agricultoras
    .filter((a) => normalizar(a.nome).includes(normalizar(busca)))
    .sort((a, b) =>
      ordem === 'nome'
        ? a.nome.localeCompare(b.nome, 'pt-BR')
        : (Number(b.areaTotal) || 0) - (Number(a.areaTotal) || 0),
    );

  return (
    <Layout>
      <div>
        {comunidade && <p className="sobretitulo">{comunidade.nome}</p>}
        <h1 className="titulo">Agricultoras</h1>
      </div>

      <div className="busca-com-ordem">
        <Campo id="busca-agricultora" rotulo="Buscar pelo nome">
          <input
            id="busca-agricultora"
            type="search"
            placeholder="ex.: Maria"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </Campo>
        <label className="filtro">
          <span className="sr-only">Ordenar por</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="area">Maior área</option>
            <option value="nome">Nome (A–Z)</option>
          </select>
        </label>
      </div>

      <Aviso tipo="erro">{erro}</Aviso>

      {carregando ? (
        <Carregando texto="Buscando agricultoras..." />
      ) : !erro && visiveis.length === 0 ? (
        <p className="vazio">
          {busca
            ? `Nenhuma agricultora encontrada com "${busca}".`
            : 'Nenhuma agricultora cadastrada nesta comunidade ainda.'}
        </p>
      ) : (
        <>
          {!erro && (
            <p className="texto-apoio">
              {visiveis.length} {visiveis.length === 1 ? 'agricultora' : 'agricultoras'}
            </p>
          )}
          <ul className="lista">
            {visiveis.map((agricultora) => (
              <li key={agricultora.id}>
                <AgricultoraCard agricultora={agricultora} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Layout>
  );
}
