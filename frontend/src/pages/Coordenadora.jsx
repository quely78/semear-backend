// =============================================================
// pages/Coordenadora.jsx — Tela 08: Área da responsável pela comunidade.
//
// Perfil de quem CUIDA da comunidade (no banco: COORDENADORA).
// Mostra:
//   - nome da comunidade que ela cuida
//   - resumo: quantas agricultoras, quantas com plantio, área total
//   - atalhos para a lista de agricultoras e o painel da comunidade
// =============================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import { listarAgricultorasDaComunidade } from '../services/comunidadeService';
import { formatarArea } from '../utils/formatadores';

export default function Coordenadora() {
  const [dados, setDados] = useState(null); // { comunidade, agricultoras }
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Busca a comunidade e as agricultoras ao abrir a tela
  useEffect(() => {
    listarAgricultorasDaComunidade()
      .then(setDados)
      .catch((e) =>
        setErro(
          e.status === 404
            ? 'Os dados da sua comunidade ainda não estão disponíveis no servidor.'
            : e.message,
        ),
      )
      .finally(() => setCarregando(false));
  }, []);

  // Números do resumo, calculados a partir da lista de agricultoras
  const agricultoras = dados?.agricultoras || [];
  const comPlantio = agricultoras.filter((a) => Number(a.totalPlantios) > 0).length;
  const areaTotal = agricultoras.reduce((soma, a) => soma + (Number(a.areaTotal) || 0), 0);

  return (
    // Cabeçalho padrão: saudação ("Olá, Nome") e botão Sair
    <Layout>
      <div>
        <p className="sobretitulo">Responsável pela comunidade</p>
        <h1 className="titulo">{dados?.comunidade?.nome || 'Minha comunidade'}</h1>
      </div>

      {carregando && <Carregando texto="Carregando sua comunidade..." />}
      <Aviso tipo="erro">{erro}</Aviso>

      {/* Resumo da comunidade */}
      {dados && (
        <div className="indicadores indicadores--tres">
          <div className="indicador">
            <strong>{agricultoras.length}</strong>
            <span>{agricultoras.length === 1 ? 'agricultora' : 'agricultoras'}</span>
          </div>
          <div className="indicador">
            <strong>{comPlantio}</strong>
            <span>com plantio</span>
          </div>
          <div className="indicador">
            <strong>{formatarArea(areaTotal)}</strong>
            <span>área total</span>
          </div>
        </div>
      )}

      {/* Ações da responsável */}
      <Link to="/coordenadora/agricultoras" className="botao botao--primario">
        <Icone nome="comunidade" tamanho={20} /> Ver agricultoras
      </Link>
      <Link to="/comunidade" className="botao botao--secundario">
        <Icone nome="grafico" tamanho={20} /> Números da comunidade
      </Link>
    </Layout>
  );
}
