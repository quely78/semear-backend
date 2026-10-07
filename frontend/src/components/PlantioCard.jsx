// =============================================================
// components/PlantioCard.jsx — Cartão de um plantio na lista (Tela 3).
//   Milho — orgânico
//   Plantado em 12/03/2026 · 40 m²
// O cartão inteiro é clicável e abre a edição do plantio.
// =============================================================
import { Link } from 'react-router-dom';
import { formatarArea, formatarData } from '../utils/formatadores';

export default function PlantioCard({ plantio }) {
  // Orgânico ganha uma marca verde-broto; convencional, cor de terra
  const organico = plantio.tipoCultivo?.toLowerCase().startsWith('org');

  return (
    // "state" leva o plantio junto, assim a tela de edição abre sem esperar a API
    <Link to={`/plantios/${plantio.id}/editar`} state={{ plantio }} className="plantio-card">
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
      {/* Seta indicando que o cartão abre a edição */}
      <span className="plantio-card__seta" aria-hidden="true">›</span>
    </Link>
  );
}