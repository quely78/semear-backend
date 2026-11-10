// =============================================================
// components/PlantioCard.jsx — Cartão de um plantio na lista (Tela 3).
//   Milho — orgânico
//   Plantado em 12/03/2026 · 40 m²
// O cartão inteiro é clicável e abre o CALENDÁRIO do plantio
// (de lá a agricultora também pode editar ou excluir).
// =============================================================
import { Link } from 'react-router-dom';
import { formatarArea, formatarData } from '../utils/formatadores';

export default function PlantioCard({ plantio, voltar }) {
  // Orgânico ganha uma marca verde-broto; convencional, cor de terra
  const organico = plantio.tipoCultivo?.toLowerCase().startsWith('org');

  return (
    // "state" leva o plantio junto, assim a próxima tela abre sem esperar a API
    <Link
      to={`/plantios/${plantio.id}/calendario`}
      state={{ plantio, voltar }}
      className="plantio-card"
    >
      <span
        className={`plantio-card__marca ${organico ? 'plantio-card__marca--organico' : ''}`}
        aria-hidden="true"
      />
      <div>
        <p className="plantio-card__titulo">
          {plantio.especie} <span>— {plantio.tipoCultivo?.toLowerCase()}</span>
        </p>
        <p className="plantio-card__detalhe">
          Plantado em {formatarData(plantio.dataPlantio)} · {formatarArea(plantio.area)}
        </p>
      </div>
      {/* Seta indicando que o cartão abre outra tela */}
      <span className="plantio-card__seta" aria-hidden="true">›</span>
    </Link>
  );
}
