// =============================================================
// pages/Calendario.jsx — Tela 05: Calendário agrícola (RF07).
// A agricultora escolhe um dos plantios dela para abrir o
// calendário daquele plantio (etapas do ciclo + chuva prevista).
// =============================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import Layout from '../components/Layout';
import PlantioCard from '../components/PlantioCard';
import { listarPlantios } from '../services/plantioService';

export default function Calendario() {
  const [plantios, setPlantios] = useState(null); // null = carregando
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarPlantios()
      .then(setPlantios)
      .catch((e) => {
        setErro(e.message);
        setPlantios([]);
      });
  }, []);

  return (
    <Layout>
      <div>
        <h1 className="titulo">Calendário</h1>
        <p className="texto-apoio">
          Escolha um plantio para ver as etapas, a chuva prevista e registrar a colheita.
        </p>
      </div>

      {plantios === null ? (
        <Carregando texto="Buscando seus plantios..." />
      ) : erro ? (
        <Aviso tipo="erro">{erro}</Aviso>
      ) : plantios.length === 0 ? (
        <div className="vazio">
          <img src="/icone.png" alt="" className="vazio__imagem" />
          <p>Quando você registrar um plantio, o calendário dele aparece aqui.</p>
          <Link to="/plantios/novo" className="botao botao--primario">
            Registrar meu primeiro plantio
          </Link>
        </div>
      ) : (
        <ul className="lista">
          {plantios.map((plantio) => (
            <li key={plantio.id}>
              <PlantioCard plantio={plantio} voltar={{ para: '/calendario', rotulo: 'Calendário' }} />
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
